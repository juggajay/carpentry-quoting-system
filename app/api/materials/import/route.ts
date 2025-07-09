import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { cuid } from '@/lib/utils';
import { DataValidator } from '@/lib/services/data-validator';
import { importProgress } from '@/lib/services/import-progress';
import { rateLimiters, withRateLimit } from '@/lib/services/rate-limiter';
import { ChunkedImportService } from '@/lib/services/chunked-import';

interface ImportProduct {
  name: string;
  description?: string | null;
  sku?: string | null;
  supplier: string;
  unit: string;
  pricePerUnit: number;
  gstInclusive: boolean;
  category?: string | null;
  inStock: boolean;
  notes?: string | null;
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Apply rate limiting
    const rateLimitResponse = await withRateLimit(req, rateLimiters.import, userId);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await req.json();
    const { products, options } = body as {
      products: ImportProduct[];
      options: {
        updateExisting: boolean;
        importNew: boolean;
      };
    };

    if (!products || products.length === 0) {
      return NextResponse.json(
        { error: 'No products to import' },
        { status: 400 }
      );
    }

    // Log first product for debugging
    console.log('Import request - first product:', products[0]);
    console.log('Import request - product count:', products.length);
    
    // For large imports (> 100 items), use chunked import service
    if (products.length > 100) {
      // Check if ImportJob table exists
      let supportsAsync = false;
      try {
        await prisma.$queryRaw`SELECT 1 FROM "ImportJob" LIMIT 1`;
        supportsAsync = true;
      } catch (error) {
        console.log('ImportJob table not found - using sync import');
      }
      
      if (supportsAsync) {
        try {
          const jobId = await ChunkedImportService.createImportJob(
            userId,
            products[0]?.supplier || 'unknown',
            products,
            options
          );
        
          return NextResponse.json({
            success: true,
            jobId,
            message: `Import job created. Processing ${products.length} items in background.`,
            async: true,
          });
        } catch (error) {
          console.error('Failed to create import job:', error);
          return NextResponse.json(
            { 
              error: 'Failed to create import job',
              details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
          );
        }
      }
      // If async not supported, fall through to sync processing
    }
    
    // For smaller imports, process synchronously as before
    // Validate all products first
    const { valid: validProducts, invalid } = DataValidator.validateBatch(products);

    if (validProducts.length === 0) {
      return NextResponse.json(
        { 
          error: 'No valid products to import',
          details: invalid,
        },
        { status: 400 }
      );
    }

    // Start progress tracking
    importProgress.start(validProducts.length);

    const results = {
      imported: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
      details: [] as any[],
    };

    // Process in batches to avoid overwhelming the database
    const batchSize = 50;
    let batchNumber = 0;
    
    for (let i = 0; i < validProducts.length; i += batchSize) {
      batchNumber++;
      importProgress.updateBatch(batchNumber);
      
      const batch = validProducts.slice(i, i + batchSize);
      
      // Get existing materials by SKU
      const skus = batch
        .map(p => p.sku)
        .filter((sku): sku is string => !!sku);

      const existingMaterials = await prisma.material.findMany({
        where: {
          sku: { in: skus },
          userId,
        },
      });

      const existingSkuMap = new Map(
        existingMaterials.map(m => [m.sku!, m.id])
      );

      // Process each product in the batch
      const operations = [];
      
      for (const product of batch) {
        try {
          const existingId = product.sku ? existingSkuMap.get(product.sku) : null;

          if (existingId && options.updateExisting) {
            // Update existing material
            operations.push(
              prisma.material.update({
                where: { id: existingId },
                data: {
                  name: product.name,
                  description: product.description,
                  pricePerUnit: product.pricePerUnit,
                  unit: product.unit as any, // Cast to enum type
                  category: product.category,
                  inStock: product.inStock,
                  gstInclusive: product.gstInclusive,
                  updatedAt: new Date(),
                },
              })
            );
            results.updated++;
            importProgress.recordUpdated(1, product.name);
          } else if (!existingId && options.importNew) {
            // Create new material
            operations.push(
              prisma.material.create({
                data: {
                  id: cuid(),
                  name: product.name,
                  description: product.description,
                  sku: product.sku || generateSKU(product.name, product.supplier),
                  supplier: product.supplier,
                  unit: product.unit as any, // Cast to enum type
                  pricePerUnit: product.pricePerUnit,
                  gstInclusive: product.gstInclusive,
                  category: product.category,
                  inStock: product.inStock,
                  notes: product.notes,
                  userId,
                },
              })
            );
            results.imported++;
            importProgress.recordImported(1, product.name);
          } else {
            results.skipped++;
            importProgress.recordSkipped(1, product.name);
          }
        } catch (error) {
          console.error('Error processing product:', error);
          results.errors++;
          importProgress.recordError(1, product.name);
          results.details.push({
            product: product.name,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      // Execute all operations in a transaction
      if (operations.length > 0) {
        try {
          await prisma.$transaction(operations);
        } catch (error) {
          console.error('Transaction error:', error);
          results.errors += operations.length;
          // Reset counts as transaction failed
          results.imported -= operations.filter(op => 'create' in op).length;
          results.updated -= operations.filter(op => 'update' in op).length;
        }
      }
    }

    // Add validation errors to results
    results.errors += invalid.length;

    // Complete progress tracking
    importProgress.complete();

    return NextResponse.json({
      success: true,
      results: {
        ...results,
        validationErrors: invalid.length,
      },
    });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to import materials',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
      },
      { status: 500 }
    );
  }
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