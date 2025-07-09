import { MCPTool } from '../types';
import { getFirecrawlService } from '@/lib/services/firecrawl-service';
import { transformBatch } from '@/lib/services/material-mapper';
import { prisma } from '@/lib/prisma';


export const firecrawlTools: Record<string, MCPTool> = {
  scrape_supplier: {
    name: 'scrape_supplier',
    description: "Scrape products from supplier website (Bunnings, Tradelink, Reece)",
    parameters: {
      type: 'object',
      properties: {
        supplier: {
          type: 'string',
          enum: ['bunnings', 'tradelink', 'reece'],
          description: 'The supplier to scrape from',
        },
        category: {
          type: 'string',
          description: 'Product category to filter (e.g., timber, plumbing, hardware)',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of products to scrape',
          default: 50,
        },
      },
      required: ['supplier'],
    },
    handler: async ({ supplier, category, limit = 50 }, { userId }) => {
      if (!userId) {
        throw new Error('User authentication required');
      }

      try {
        const urls = getSupplierUrls(supplier, category);
        if (urls.length === 0) {
          return {
            products: [],
            summary: {
              total: 0,
              message: `No URLs found for ${supplier}${category ? ` - ${category}` : ''}`,
            },
          };
        }

        const firecrawl = getFirecrawlService();
        const config = {
          supplier,
          category,
          options: {
            updateExisting: false,
            importNew: true,
            includeGST: true,
          },
        };

        // Scrape products
        const scrapedProducts = await firecrawl.scrapeWithConfig(config, urls);
        
        // Limit results
        const limitedProducts = scrapedProducts.slice(0, limit);

        // Transform to our format
        const transformedProducts = transformBatch(
          limitedProducts.map(p => ({
            title: p.name,
            price: p.price?.toString() || '0',
            url: '',
            metadata: {
              sku: p.sku,
              availability: p.inStock,
              unit: p.unit,
              description: p.description,
            },
          })),
          supplier,
          userId
        );

        // Check existing materials
        const skus = transformedProducts
          .map(p => p.sku)
          .filter((sku): sku is string => !!sku);

        const existingMaterials = await prisma.material.findMany({
          where: {
            sku: { in: skus },
            userId,
          },
          select: { sku: true },
        });

        const existingSkus = new Set(existingMaterials.map(m => m.sku));

        // Add status to products
        const productsWithStatus = transformedProducts.map(product => ({
          ...product,
          status: existingSkus.has(product.sku || '') ? 'existing' : 'new',
        }));

        return {
          products: productsWithStatus,
          summary: {
            total: productsWithStatus.length,
            new: productsWithStatus.filter(p => p.status === 'new').length,
            existing: productsWithStatus.filter(p => p.status === 'existing').length,
            supplier,
            category: category || 'all',
          },
        };
      } catch (error) {
        console.error('Scraping error:', error);
        throw new Error(`Failed to scrape ${supplier}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
  },

  import_materials: {
    name: 'import_materials',
    description: "Import scraped materials to the database",
    parameters: {
      type: 'object',
      properties: {
        products: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              sku: { type: 'string' },
              supplier: { type: 'string' },
              unit: { type: 'string' },
              pricePerUnit: { type: 'number' },
              category: { type: 'string' },
              inStock: { type: 'boolean' },
            },
            required: ['name', 'supplier', 'unit', 'pricePerUnit'],
          },
          description: 'Array of products to import',
        },
        updateExisting: {
          type: 'boolean',
          description: 'Whether to update existing materials with matching SKUs',
          default: false,
        },
      },
      required: ['products'],
    },
    handler: async ({ products, updateExisting = false }, { userId }) => {
      if (!userId) {
        throw new Error('User authentication required');
      }

      if (!products || products.length === 0) {
        return {
          success: false,
          message: 'No products to import',
        };
      }

      const results = {
        imported: 0,
        updated: 0,
        skipped: 0,
        errors: 0,
      };

      try {
        // Process in batches
        const batchSize = 20;
        for (let i = 0; i < products.length; i += batchSize) {
          const batch = products.slice(i, i + batchSize);
          
          // Check existing materials
          const skus = batch
            .map((p: any) => p.sku)
            .filter((sku: any): sku is string => !!sku);

          const existingMaterials = await prisma.material.findMany({
            where: {
              sku: { in: skus },
              userId,
            },
          });

          const existingSkuMap = new Map(
            existingMaterials.map((m: any) => [m.sku!, m.id])
          );

          // Process each product
          for (const product of batch) {
            try {
              const existingId = product.sku ? existingSkuMap.get(product.sku) : null;

              if (existingId && updateExisting) {
                // Update existing
                await prisma.material.update({
                  where: { id: existingId },
                  data: {
                    name: product.name,
                    pricePerUnit: product.pricePerUnit,
                    unit: product.unit,
                    category: product.category,
                    inStock: product.inStock,
                    updatedAt: new Date(),
                  },
                });
                results.updated++;
              } else if (!existingId) {
                // Create new
                const { cuid } = await import('@/lib/utils');
                await prisma.material.create({
                  data: {
                    id: cuid(),
                    name: product.name,
                    sku: product.sku || generateSKU(product.name, product.supplier),
                    supplier: product.supplier,
                    unit: product.unit,
                    pricePerUnit: product.pricePerUnit,
                    gstInclusive: true,
                    category: product.category,
                    inStock: product.inStock,
                    userId,
                  },
                });
                results.imported++;
              } else {
                results.skipped++;
              }
            } catch (error) {
              console.error('Error importing product:', error);
              results.errors++;
            }
          }
        }

        return {
          success: true,
          results,
          message: `Imported ${results.imported} new materials${
            results.updated > 0 ? `, updated ${results.updated}` : ''
          }${results.skipped > 0 ? `, skipped ${results.skipped} existing` : ''}${
            results.errors > 0 ? `, ${results.errors} errors` : ''
          }`,
        };
      } catch (error) {
        console.error('Import error:', error);
        throw new Error(`Failed to import materials: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
  },
};

function getSupplierUrls(supplier: string, category?: string): string[] {
  const urlMap: Record<string, Record<string, string[]>> = {
    bunnings: {
      timber: [
        'https://www.bunnings.com.au/our-range/building-hardware/timber/structural-timber',
        'https://www.bunnings.com.au/our-range/building-hardware/timber/treated-pine',
      ],
      plumbing: [
        'https://www.bunnings.com.au/our-range/bathroom-plumbing/plumbing/pipe-fittings',
      ],
      hardware: [
        'https://www.bunnings.com.au/our-range/building-hardware/screws-fasteners-hardware',
      ],
    },
    tradelink: {
      plumbing: [
        'https://www.tradelink.com.au/products/plumbing-supplies',
      ],
    },
    reece: {
      plumbing: [
        'https://www.reece.com.au/plumbing/c/c1',
      ],
    },
  };

  const supplierUrls = urlMap[supplier];
  if (!supplierUrls) return [];

  if (category && supplierUrls[category]) {
    return supplierUrls[category];
  }

  return Object.values(supplierUrls).flat();
}

function generateSKU(name: string, supplier: string): string {
  const prefix = supplier.substring(0, 3).toUpperCase();
  const namePart = name
    .replace(/[^a-zA-Z0-9]/g, '')
    .substring(0, 10)
    .toUpperCase();
  const timestamp = Date.now().toString().slice(-6);
  return `${prefix}-${namePart}-${timestamp}`;
}