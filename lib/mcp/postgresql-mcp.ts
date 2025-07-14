import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  CallToolRequestSchema, 
  ListToolsRequestSchema,
  GetPromptRequestSchema,
  ListPromptsRequestSchema
} from '@modelcontextprotocol/sdk/types.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class PostgreSQLMCPServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'postgresql-mcp',
        version: '1.0.0',
        description: 'PostgreSQL MCP server for carpentry quoting system'
      },
      {
        capabilities: {
          tools: {},
          prompts: {},
        },
      }
    );

    this.setupTools();
    this.setupPrompts();
  }

  private setupTools() {
    // List all available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'search_materials',
            description: 'Search for materials in the database by name, SKU, or category',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Search query for material name or SKU'
                },
                category: {
                  type: 'string',
                  description: 'Optional category filter (e.g., "Timber", "Hardware", "Fixings")'
                },
                limit: {
                  type: 'number',
                  description: 'Maximum number of results to return',
                  default: 10
                }
              },
              required: ['query']
            }
          },
          {
            name: 'get_labor_rates',
            description: 'Get labor rates by title or level',
            inputSchema: {
              type: 'object',
              properties: {
                title: {
                  type: 'string',
                  description: 'Labor title filter (e.g., "Carpenter", "Leading Hand")'
                },
                level: {
                  type: 'string',
                  description: 'Labor level filter (e.g., "Level 1", "Level 2")'
                }
              }
            }
          },
          {
            name: 'find_similar_quotes',
            description: 'Find similar quotes based on description or items',
            inputSchema: {
              type: 'object',
              properties: {
                description: {
                  type: 'string',
                  description: 'Quote description to find similar projects'
                },
                limit: {
                  type: 'number',
                  description: 'Maximum number of results to return',
                  default: 5
                }
              },
              required: ['description']
            }
          },
          {
            name: 'get_labor_rate_templates',
            description: 'Get labor rate templates by category or activity',
            inputSchema: {
              type: 'object',
              properties: {
                category: {
                  type: 'string',
                  description: 'Category filter (e.g., "framing", "doors", "windows")'
                },
                activity: {
                  type: 'string',
                  description: 'Activity search query'
                },
                limit: {
                  type: 'number',
                  description: 'Maximum number of results to return',
                  default: 10
                }
              }
            }
          },
          {
            name: 'get_material_price_history',
            description: 'Get price history for a material',
            inputSchema: {
              type: 'object',
              properties: {
                materialId: {
                  type: 'string',
                  description: 'Material ID to get price history for'
                },
                days: {
                  type: 'number',
                  description: 'Number of days back to look',
                  default: 30
                }
              },
              required: ['materialId']
            }
          }
        ]
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'search_materials':
            return await this.searchMaterials((args || {}) as { query: string; category?: string; limit?: number });
          case 'get_labor_rates':
            return await this.getLaborRates((args || {}) as { title?: string; level?: string });
          case 'find_similar_quotes':
            return await this.findSimilarQuotes((args || {}) as { description: string; limit?: number });
          case 'get_labor_rate_templates':
            return await this.getLaborRateTemplates((args || {}) as { category?: string; activity?: string; limit?: number });
          case 'get_material_price_history':
            return await this.getMaterialPriceHistory((args || {}) as { materialId: string; days?: number });
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `Error executing tool ${name}: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        };
      }
    });
  }

  private setupPrompts() {
    this.server.setRequestHandler(ListPromptsRequestSchema, async () => {
      return {
        prompts: [
          {
            name: 'quote_analysis',
            description: 'Analyze a quote for completeness and accuracy',
            arguments: [
              {
                name: 'quote_data',
                description: 'Quote data to analyze',
                required: true
              }
            ]
          }
        ]
      };
    });

    this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      if (name === 'quote_analysis') {
        return {
          description: 'Analyze a quote for completeness and accuracy',
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: `Analyze this quote for completeness and accuracy:\n\n${args?.quote_data || 'No quote data provided'}`
              }
            }
          ]
        };
      }

      throw new Error(`Unknown prompt: ${name}`);
    });
  }

  private async searchMaterials(args: { query: string; category?: string; limit?: number }) {
    const { query, category, limit = 10 } = args;
    
    const whereClause: Record<string, unknown> = {
      AND: [
        {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { sku: { contains: query, mode: 'insensitive' } }
          ]
        }
      ]
    };

    if (category) {
      (whereClause.AND as Array<Record<string, unknown>>).push({ 
        category: { contains: category, mode: 'insensitive' } 
      });
    }

    const materials = await prisma.material.findMany({
      where: whereClause,
      take: limit,
      orderBy: [
        { name: 'asc' }
      ],
      include: {
        priceUpdates: {
          take: 1,
          orderBy: { scrapedAt: 'desc' }
        }
      }
    });

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          count: materials.length,
          materials: materials.map(material => ({
            id: material.id,
            name: material.name,
            description: material.description,
            sku: material.sku,
            supplier: material.supplier,
            unit: material.unit,
            pricePerUnit: material.pricePerUnit,
            gstInclusive: material.gstInclusive,
            category: material.category,
            inStock: material.inStock,
            recentPriceUpdate: material.priceUpdates[0] || null
          }))
        }, null, 2)
      }]
    };
  }

  private async getLaborRates(args: { title?: string; level?: string }) {
    const { title, level } = args;
    
    const whereClause: Record<string, unknown> = {};
    
    if (title) {
      whereClause.title = { contains: title, mode: 'insensitive' };
    }
    
    if (level) {
      whereClause.level = { contains: level, mode: 'insensitive' };
    }

    const laborRates = await prisma.laborRate.findMany({
      where: whereClause,
      orderBy: [
        { title: 'asc' },
        { level: 'asc' }
      ],
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          count: laborRates.length,
          laborRates: laborRates.map(rate => ({
            id: rate.id,
            title: rate.title,
            level: rate.level,
            baseRate: rate.baseRate,
            saturdayRate: rate.saturdayRate,
            sundayRate: rate.sundayRate,
            loadedRate: rate.loadedRate,
            description: rate.description,
            effectiveDate: rate.effectiveDate,
            createdBy: rate.user ? `${rate.user.firstName} ${rate.user.lastName}` : null
          }))
        }, null, 2)
      }]
    };
  }

  private async findSimilarQuotes(args: { description: string; limit?: number }) {
    const { description, limit = 5 } = args;

    const quotes = await prisma.quote.findMany({
      where: {
        OR: [
          { title: { contains: description, mode: 'insensitive' } },
          { description: { contains: description, mode: 'insensitive' } }
        ]
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        client: {
          select: {
            name: true,
            company: true
          }
        },
        createdBy: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        items: {
          take: 5,
          include: {
            material: {
              select: {
                name: true,
                category: true
              }
            },
            laborRate: {
              select: {
                title: true,
                level: true
              }
            }
          }
        }
      }
    });

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          count: quotes.length,
          quotes: quotes.map(quote => ({
            id: quote.id,
            quoteNumber: quote.quoteNumber,
            title: quote.title,
            description: quote.description,
            status: quote.status,
            total: quote.total,
            client: quote.client,
            createdBy: quote.createdBy ? `${quote.createdBy.firstName} ${quote.createdBy.lastName}` : null,
            createdAt: quote.createdAt,
            sampleItems: quote.items.map(item => ({
              description: item.description,
              quantity: item.quantity,
              unit: item.unit,
              unitPrice: item.unitPrice,
              total: item.total,
              material: item.material,
              laborRate: item.laborRate
            }))
          }))
        }, null, 2)
      }]
    };
  }

  private async getLaborRateTemplates(args: { category?: string; activity?: string; limit?: number }) {
    const { category, activity, limit = 10 } = args;
    
    const whereClause: Record<string, unknown> = {
      isActive: true
    };
    
    if (category) {
      whereClause.category = { contains: category, mode: 'insensitive' };
    }
    
    if (activity) {
      whereClause.activity = { contains: activity, mode: 'insensitive' };
    }

    const templates = await prisma.laborRateTemplate.findMany({
      where: whereClause,
      take: limit,
      orderBy: [
        { confidence: 'desc' },
        { category: 'asc' },
        { activity: 'asc' }
      ],
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          count: templates.length,
          templates: templates.map(template => ({
            id: template.id,
            category: template.category,
            activity: template.activity,
            unit: template.unit,
            rate: template.rate,
            description: template.description,
            source: template.source,
            confidence: template.confidence,
            createdBy: template.user ? `${template.user.firstName} ${template.user.lastName}` : null,
            createdAt: template.createdAt
          }))
        }, null, 2)
      }]
    };
  }

  private async getMaterialPriceHistory(args: { materialId: string; days?: number }) {
    const { materialId, days = 30 } = args;
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const material = await prisma.material.findUnique({
      where: { id: materialId },
      include: {
        priceUpdates: {
          where: {
            scrapedAt: {
              gte: cutoffDate
            }
          },
          orderBy: { scrapedAt: 'desc' }
        }
      }
    });

    if (!material) {
      throw new Error(`Material with ID ${materialId} not found`);
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          material: {
            id: material.id,
            name: material.name,
            currentPrice: material.pricePerUnit,
            unit: material.unit,
            category: material.category,
            supplier: material.supplier
          },
          priceHistory: material.priceUpdates.map(update => ({
            date: update.scrapedAt,
            currentPrice: update.currentPrice,
            scrapedPrice: update.scrapedPrice,
            percentChange: update.percentChange,
            source: update.source,
            status: update.status
          }))
        }, null, 2)
      }]
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('PostgreSQL MCP server running on stdio');
  }
}

// Run the server if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new PostgreSQLMCPServer();
  server.run().catch(console.error);
}