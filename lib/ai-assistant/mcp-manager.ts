import { prisma } from '@/lib/prisma';

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  server: string;
}

export interface MCPConnection {
  id: string;
  name: string;
  type: 'postgresql' | 'filesystem' | 'brave' | 'memory';
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
  tools: MCPTool[];
  config?: Record<string, unknown>;
  error?: string;
}

export class MCPManager {
  private connections: Map<string, MCPConnection> = new Map();
  private static instance: MCPManager;
  private initialized: boolean = false;
  private memory: Map<string, string> = new Map();

  private constructor() {}

  static getInstance(): MCPManager {
    if (!MCPManager.instance) {
      MCPManager.instance = new MCPManager();
    }
    return MCPManager.instance;
  }

  async initializeConnections() {
    if (this.initialized) {
      return; // Already initialized
    }

    try {
      // Load MCP connections from database
      const dbConnections = await prisma.mCPConnection.findMany({
        where: { status: 'active' }
      });

      for (const dbConnection of dbConnections) {
        await this.connectToMCP({
          id: dbConnection.id,
          name: dbConnection.name,
          type: dbConnection.type,
          config: (dbConnection.config as Record<string, unknown>) || {}
        });
      }

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize MCP connections:', error);
      // Don't set initialized = true so we can retry later
    }
  }

  async connectToMCP(dbConnection: { id: string; name: string; type: string; config: Record<string, unknown> }): Promise<MCPConnection> {
    const connection: MCPConnection = {
      id: dbConnection.id,
      name: dbConnection.name,
      type: dbConnection.type as 'postgresql' | 'filesystem' | 'brave' | 'memory',
      status: 'connecting',
      tools: [],
      config: dbConnection.config
    };

    try {
      switch (dbConnection.type) {
        case 'postgresql':
          await this.connectPostgreSQL(connection);
          break;
        case 'filesystem':
          await this.connectFilesystem(connection);
          break;
        case 'brave':
          await this.connectBrave(connection);
          break;
        case 'memory':
          await this.connectMemory(connection);
          break;
        default:
          throw new Error(`Unsupported MCP type: ${dbConnection.type}`);
      }

      connection.status = 'connected';
      this.connections.set(connection.id, connection);
      
      // Update database status
      await prisma.mCPConnection.update({
        where: { id: dbConnection.id },
        data: { 
          status: 'active',
          lastUsed: new Date()
        }
      });

      return connection;
    } catch (error) {
      connection.status = 'error';
      connection.error = error instanceof Error ? error.message : String(error);
      this.connections.set(connection.id, connection);
      
      console.error(`Failed to connect to MCP ${dbConnection.name}:`, error);
      return connection;
    }
  }

  private async connectPostgreSQL(connection: MCPConnection) {
    // For now, use hardcoded tools that directly call our PostgreSQL functions
    connection.tools = [
      {
        name: 'search_materials',
        description: 'Search for materials in the database by name, SKU, or category',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search query for material name or SKU' },
            category: { type: 'string', description: 'Optional category filter' },
            limit: { type: 'number', description: 'Maximum number of results', default: 10 }
          },
          required: ['query']
        },
        server: 'postgresql'
      },
      {
        name: 'get_labor_rates',
        description: 'Get labor rates by title or level',
        inputSchema: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'Labor title filter' },
            level: { type: 'string', description: 'Labor level filter' }
          }
        },
        server: 'postgresql'
      },
      {
        name: 'find_similar_quotes',
        description: 'Find similar quotes based on description',
        inputSchema: {
          type: 'object',
          properties: {
            description: { type: 'string', description: 'Quote description to find similar projects' },
            limit: { type: 'number', description: 'Maximum number of results', default: 5 }
          },
          required: ['description']
        },
        server: 'postgresql'
      }
    ];
  }

  private async connectFilesystem(connection: MCPConnection) {
    // For filesystem MCP, we'll implement a simple file reader
    // Mock filesystem tools for now
    connection.tools = [
      {
        name: 'read_file',
        description: 'Read contents of a file',
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'File path to read' }
          },
          required: ['path']
        },
        server: 'filesystem'
      },
      {
        name: 'list_files',
        description: 'List files in a directory',
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Directory path to list' }
          },
          required: ['path']
        },
        server: 'filesystem'
      }
    ];
  }

  private async connectBrave(connection: MCPConnection) {
    // For Brave search, we'll implement a web search wrapper
    connection.tools = [
      {
        name: 'web_search',
        description: 'Search the web using Brave Search',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search query' },
            count: { type: 'number', description: 'Number of results', default: 10 }
          },
          required: ['query']
        },
        server: 'brave'
      }
    ];
  }

  private async connectMemory(connection: MCPConnection) {
    // For memory MCP, we'll implement session memory
    connection.tools = [
      {
        name: 'store_memory',
        description: 'Store information in session memory',
        inputSchema: {
          type: 'object',
          properties: {
            key: { type: 'string', description: 'Memory key' },
            value: { type: 'string', description: 'Value to store' }
          },
          required: ['key', 'value']
        },
        server: 'memory'
      },
      {
        name: 'retrieve_memory',
        description: 'Retrieve information from session memory',
        inputSchema: {
          type: 'object',
          properties: {
            key: { type: 'string', description: 'Memory key to retrieve' }
          },
          required: ['key']
        },
        server: 'memory'
      }
    ];
  }

  async disconnectMCP(connectionId: string) {
    const connection = this.connections.get(connectionId);
    if (connection) {
      // Remove the connection from our map
      this.connections.delete(connectionId);
      
      // Update database status
      await prisma.mCPConnection.update({
        where: { id: connectionId },
        data: { status: 'inactive' }
      });
    }
  }

  async callTool(toolName: string, args: Record<string, unknown>, connectionId?: string): Promise<{ content: Array<{ type: string; text: string }> }> {
    // Find the connection that has this tool
    let targetConnection: MCPConnection | undefined;
    
    if (connectionId) {
      targetConnection = this.connections.get(connectionId);
    } else {
      // Find the first connection that has this tool
      for (const connection of this.connections.values()) {
        if (connection.tools.some(tool => tool.name === toolName)) {
          targetConnection = connection;
          break;
        }
      }
    }

    if (!targetConnection) {
      throw new Error(`Tool ${toolName} not found in any connected MCP server`);
    }

    if (targetConnection.status !== 'connected') {
      throw new Error(`MCP connection ${targetConnection.name} is not connected`);
    }

    // Handle different server types
    switch (targetConnection.type) {
      case 'postgresql':
        return await this.callPostgreSQLTool(targetConnection, toolName, args);
      case 'filesystem':
        return await this.callFilesystemTool(targetConnection, toolName, args);
      case 'brave':
        return await this.callBraveTool(targetConnection, toolName, args);
      case 'memory':
        return await this.callMemoryTool(targetConnection, toolName, args);
      default:
        throw new Error(`Unsupported MCP type: ${targetConnection.type}`);
    }
  }

  private async callPostgreSQLTool(connection: MCPConnection, toolName: string, args: Record<string, unknown>) {
    switch (toolName) {
      case 'search_materials':
        return await this.searchMaterials(args as { query: string; category?: string; limit?: number });
      case 'get_labor_rates':
        return await this.getLaborRates(args as { title?: string; level?: string });
      case 'find_similar_quotes':
        return await this.findSimilarQuotes(args as { description: string; limit?: number });
      default:
        throw new Error(`Unknown PostgreSQL tool: ${toolName}`);
    }
  }

  private async searchMaterials(args: { query: string; category?: string; limit?: number }) {
    try {
      const { query, category, limit = 10 } = args;
      
      // Validate query parameter
      if (!query || typeof query !== 'string') {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              error: 'Query parameter is required and must be a string',
              count: 0,
              materials: []
            }, null, 2)
          }]
        };
      }
      
      // Use raw SQL to avoid schema mismatch issues
      let materials: Array<{
        id: string;
        name: string;
        description: string | null;
        sku: string | null;
        supplier: string | null;
        unit: string;
        pricePerUnit: number;
        gstInclusive: boolean;
        category: string | null;
        inStock: boolean;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
      }>;
      
      if (category) {
        materials = await prisma.$queryRaw`
          SELECT id, name, description, sku, supplier, unit, "pricePerUnit", 
                 "gstInclusive", category, "inStock", notes, "createdAt", "updatedAt"
          FROM "Material"
          WHERE (
            LOWER(name) LIKE ${`%${query.toLowerCase()}%`} OR
            LOWER(description) LIKE ${`%${query.toLowerCase()}%`} OR
            LOWER(sku) LIKE ${`%${query.toLowerCase()}%`}
          )
          AND LOWER(category) LIKE ${`%${category.toLowerCase()}%`}
          ORDER BY name ASC
          LIMIT ${limit}
        `;
      } else {
        materials = await prisma.$queryRaw`
          SELECT id, name, description, sku, supplier, unit, "pricePerUnit", 
                 "gstInclusive", category, "inStock", notes, "createdAt", "updatedAt"
          FROM "Material"
          WHERE (
            LOWER(name) LIKE ${`%${query.toLowerCase()}%`} OR
            LOWER(description) LIKE ${`%${query.toLowerCase()}%`} OR
            LOWER(sku) LIKE ${`%${query.toLowerCase()}%`}
          )
          ORDER BY name ASC
          LIMIT ${limit}
        `;
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            count: materials.length,
            query: query,
            category: category || null,
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
              inStock: material.inStock
            }))
          }, null, 2)
        }]
      };
    } catch (error) {
      console.error('Error searching materials:', error);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            error: 'Database error while searching materials',
            count: 0,
            materials: []
          }, null, 2)
        }]
      };
    }
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
      orderBy: [{ title: 'asc' }, { level: 'asc' }],
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

  private async callFilesystemTool(connection: MCPConnection, toolName: string, args: Record<string, unknown>) {
    const fs = await import('fs/promises');

    switch (toolName) {
      case 'read_file':
        const content = await fs.readFile(args.path as string, 'utf-8');
        return {
          content: [{
            type: 'text',
            text: content
          }]
        };
      case 'list_files':
        const files = await fs.readdir(args.path as string);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(files, null, 2)
          }]
        };
      default:
        throw new Error(`Unknown filesystem tool: ${toolName}`);
    }
  }

  private async callBraveTool(connection: MCPConnection, toolName: string, args: Record<string, unknown>) {
    switch (toolName) {
      case 'web_search':
        try {
          const apiKey = process.env.BRAVE_API_KEY;
          if (!apiKey) {
            throw new Error('BRAVE_API_KEY not configured');
          }

          const query = args.query as string;
          const response = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=5`, {
            headers: {
              'Accept': 'application/json',
              'X-Subscription-Token': apiKey
            }
          });

          if (!response.ok) {
            throw new Error(`Brave API error: ${response.statusText}`);
          }

          const data = await response.json();
          const results = data.web?.results || [];

          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                query: query,
                results: results.map((result: { title: string; url: string; description: string }) => ({
                  title: result.title,
                  url: result.url,
                  snippet: result.description
                }))
              }, null, 2)
            }]
          };
        } catch (error) {
          console.error('Brave search error:', error);
          return {
            content: [{
              type: 'text',
              text: `Error performing web search: ${error instanceof Error ? error.message : 'Unknown error'}`
            }]
          };
        }
      default:
        throw new Error(`Unknown Brave tool: ${toolName}`);
    }
  }

  private async callMemoryTool(connection: MCPConnection, toolName: string, args: Record<string, unknown>) {
    switch (toolName) {
      case 'store_memory':
        this.memory.set(args.key as string, args.value as string);
        return {
          content: [{
            type: 'text',
            text: `Stored value for key: ${args.key}`
          }]
        };
      case 'retrieve_memory':
        const value = this.memory.get(args.key as string);
        return {
          content: [{
            type: 'text',
            text: value || `No value found for key: ${args.key}`
          }]
        };
      default:
        throw new Error(`Unknown memory tool: ${toolName}`);
    }
  }

  getConnections(): MCPConnection[] {
    return Array.from(this.connections.values());
  }

  getConnection(id: string): MCPConnection | undefined {
    return this.connections.get(id);
  }

  getAllTools(): MCPTool[] {
    // Auto-initialize if not already done
    if (!this.initialized) {
      this.initializeConnections().catch(error => {
        console.error('Failed to auto-initialize MCP connections:', error);
      });
    }

    const tools: MCPTool[] = [];
    for (const connection of this.connections.values()) {
      if (connection.status === 'connected') {
        tools.push(...connection.tools);
      }
    }
    return tools;
  }

  async testConnection(connectionId: string): Promise<boolean> {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      return false;
    }

    try {
      // Test with a simple tool call
      if (connection.type === 'postgresql') {
        await this.callTool('search_materials', { query: 'test', limit: 1 }, connectionId);
      }
      return true;
    } catch (error) {
      console.error(`Connection test failed for ${connectionId}:`, error);
      return false;
    }
  }
}

export const mcpManager = MCPManager.getInstance();