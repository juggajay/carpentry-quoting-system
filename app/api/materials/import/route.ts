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
    console.log('[Import API] ===== START =====');
    console.log('[Import API] Request received at:', new Date().toISOString());
    console.log('[Import API] Headers:', Object.fromEntries(req.headers.entries()));
  } catch (earlyError) {
    console.error('[Import API] Very early error:', earlyError);
    return NextResponse.json({ 
      error: 'Critical error at start', 
      details: String(earlyError),
      stack: earlyError instanceof Error ? earlyError.stack : undefined
    }, { status: 500 });
  }
  
  let body: any;
  
  try {
    // First, try to get the body to see what's being sent
    try {
      body = await req.json();
      console.log('[Import API] Received body:', JSON.stringify(body).substring(0, 500));
    } catch (jsonError) {
      console.error('[Import API] Failed to parse JSON:', jsonError);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get the actual user from database
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const userId = user.id;

    // Apply rate limiting
    const rateLimitResponse = await withRateLimit(req, rateLimiters.import, clerkId);
    if (rateLimitResponse) return rateLimitResponse;
    
    const { products, options } = body as {
      products: ImportProduct[];
      options: {
        updateExisting: boolean;
        importNew: boolean;
      };
    };

    if (!products || !Array.isArray(products)) {
      console.error('[Import API] Invalid products:', typeof products, products);
      return NextResponse.json(
        { error: 'Products must be an array' },
        { status: 400 }
      );
    }
    
    if (products.length === 0) {
      return NextResponse.json(
        { error: 'No products to import' },
        { status: 400 }
      );
    }

    // Log first product for debugging
    console.log('Import request - first product:', JSON.stringify(products[0], null, 2));
    console.log('Import request - product count:', products.length);
    console.log('Import request - options:', options);
    
    // Check if products have required fields
    if (products.length > 0) {
      const sampleProduct = products[0];
      console.log('Product field check:', {
        hasName: !!sampleProduct.name,
        hasSupplier: !!sampleProduct.supplier,
        hasUnit: !!sampleProduct.unit,
        hasPricePerUnit: sampleProduct.pricePerUnit !== undefined,
        priceType: typeof sampleProduct.pricePerUnit,
        hasGstInclusive: sampleProduct.gstInclusive !== undefined,
        gstType: typeof sampleProduct.gstInclusive,
      });
    }
    
    // For large imports (> 100 items), use chunked import service
    if (products.length > 100) {
      // Check if ImportJob table exists
      let supportsAsync = false;
      try {
        await prisma.$queryRaw`SELECT 1 FROM "ImportJob" LIMIT 1`;
        supportsAsync = true;
      } catch (error) {
        console.log('ImportJob table check error:', error instanceof Error ? error.message : 'Unknown');
        // Continue with sync import
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
          console.log('Falling back to sync import due to async error');
          // Fall through to sync processing instead of returning error
        }
      }
      // If async not supported, fall through to sync processing
    }
    
    // For smaller imports, process synchronously as before
    // Validate all products first
    let validProducts: any[] = [];
    let invalid: any[] = [];
    
    try {
      const validationResult = DataValidator.validateBatch(products);
      validProducts = validationResult.valid;
      invalid = validationResult.invalid;
      
      // Log validation results
      if (invalid.length > 0) {
        console.log('Validation errors found:', JSON.stringify(invalid.slice(0, 3), null, 2));
      }
    } catch (validationError) {
      console.error('Validation failed:', validationError);
      return NextResponse.json(
        { 
          error: 'Product validation failed',
          details: validationError instanceof Error ? validationError.message : 'Unknown validation error',
        },
        { status: 400 }
      );
    }

    if (validProducts.length === 0) {
      console.error('All products failed validation:', invalid);
      return NextResponse.json(
        { 
          error: 'No valid products to import',
          details: invalid,
        },
        { status: 400 }
      );
    }

    // Start progress tracking
    try {
      importProgress.start(validProducts.length);
    } catch (progressError) {
      console.error('Failed to start progress tracking:', progressError);
      // Continue without progress tracking
    }

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
      try {
        importProgress.updateBatch(batchNumber);
      } catch (e) {
        console.error('Progress tracking error:', e);
      }
      
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
        select: {
          id: true,
          sku: true,
        },
      });

      const existingSkuMap = new Map(
        existingMaterials.map(m => [m.sku!, m.id])
      );

      // Process each product in the batch
      const operations = [];
      console.log(`[Import] Processing batch ${batchNumber} with ${batch.length} products`);
      
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
                  description: product.description || null,
                  pricePerUnit: product.pricePerUnit,
                  unit: product.unit as any, // Cast to enum type
                  category: product.category || null,
                  inStock: product.inStock,
                  gstInclusive: product.gstInclusive,
                  supplier: product.supplier,
                  updatedAt: new Date(),
                },
              })
            );
            results.updated++;
            try {
              importProgress.recordUpdated(1, product.name);
            } catch (e) {
              console.error('Progress tracking error:', e);
            }
          } else if (!existingId && options.importNew) {
            // Create new material
            const materialData = {
              id: cuid(),
              name: product.name,
              description: product.description || null,
              sku: product.sku || generateSKU(product.name, product.supplier),
              supplier: product.supplier,
              unit: product.unit as any, // Cast to enum type
              pricePerUnit: product.pricePerUnit,
              gstInclusive: product.gstInclusive,
              category: product.category || null,
              inStock: product.inStock,
              notes: product.notes || null,
              userId,
            };
            console.log('[Import] Creating material with data:', {
              ...materialData,
              userIdType: typeof userId,
              userIdValue: userId,
            });
            operations.push(
              prisma.material.create({
                data: materialData,
              })
            );
            results.imported++;
            try {
              importProgress.recordImported(1, product.name);
            } catch (e) {
              console.error('Progress tracking error:', e);
            }
          } else {
            results.skipped++;
            try {
              importProgress.recordSkipped(1, product.name);
            } catch (e) {
              console.error('Progress tracking error:', e);
            }
          }
        } catch (error) {
          console.error('Error processing product:', error);
          results.errors++;
          try {
            importProgress.recordError(1, product.name);
          } catch (e) {
            console.error('Progress tracking error:', e);
          }
          results.details.push({
            product: product.name,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      // Execute all operations in a transaction
      if (operations.length > 0) {
        try {
          console.log(`[Import] Executing ${operations.length} operations in batch ${batchNumber}`);
          const transactionResults = await prisma.$transaction(operations);
          console.log(`[Import] Transaction completed, created/updated ${transactionResults.length} materials`);
        } catch (error) {
          console.error('Transaction error:', error);
          console.error('Failed batch sample:', JSON.stringify(batch[0], null, 2));
          console.error('Transaction error details:', {
            errorType: error?.constructor?.name,
            message: error instanceof Error ? error.message : 'Unknown error',
            operations: operations.length,
            userId: userId,
          });
          results.errors += operations.length;
          // Reset counts as transaction failed
          results.imported -= operations.filter(op => 'create' in op).length;
          results.updated -= operations.filter(op => 'update' in op).length;
          
          // Add detailed error info
          results.details.push({
            batch: `Batch ${batchNumber}`,
            error: error instanceof Error ? error.message : 'Transaction failed',
            sample: batch[0]?.name,
            operationsCount: operations.length
          });
          
          // Throw error to stop processing and return error response
          throw error;
        }
      }
    }

    // Add validation errors to results
    results.errors += invalid.length;

    // Complete progress tracking
    try {
      importProgress.complete();
    } catch (e) {
      console.error('Progress tracking error:', e);
    }

    console.log('[Import] Final results:', {
      imported: results.imported,
      updated: results.updated,
      skipped: results.skipped,
      errors: results.errors,
      validationErrors: invalid.length,
      userId,
    });
    
    // Verify materials were actually created
    if (results.imported > 0) {
      const verifyCount = await prisma.material.count({
        where: { userId }
      });
      console.log(`[Import] Verification: User ${userId} now has ${verifyCount} materials`);
    }
    
    // Check if there were transaction errors
    if (results.errors > 0 && results.imported === 0 && results.updated === 0) {
      return NextResponse.json({
        success: false,
        error: 'Failed to import materials',
        results: {
          ...results,
          validationErrors: invalid.length,
        },
        details: results.details,
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      results: {
        ...results,
        validationErrors: invalid.length,
      },
    });
  } catch (error) {
    console.error('[Import API] ===== ERROR =====');
    console.error('[Import API] Import error:', error);
    console.error('[Import API] Import error details:', {
      errorType: error?.constructor?.name,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      body: body,
    });
    
    // Check if it's a Prisma error
    if (error && typeof error === 'object' && 'code' in error) {
      console.error('[Import API] Prisma error code:', (error as any).code);
      console.error('[Import API] Prisma error meta:', (error as any).meta);
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to import materials',
        details: error instanceof Error ? error.message : 'Unknown error',
        errorType: error?.constructor?.name,
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