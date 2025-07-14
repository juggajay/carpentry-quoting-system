import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { cuid } from '@/lib/utils';
import { DataValidator } from '@/lib/services/data-validator';
import { importProgress } from '@/lib/services/import-progress';
import { rateLimiters, withRateLimit } from '@/lib/services/rate-limiter';
import { ChunkedImportService } from '@/lib/services/chunked-import';
import { getImportSession, updateImportSession } from './session/route';

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
  const results = {
    imported: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
    details: [] as any[],
  };
  let invalid: any[] = [];
  
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
    
    const { products, options, sessionId } = body as {
      products: ImportProduct[];
      options: {
        updateExisting: boolean;
        importNew: boolean;
      };
      sessionId?: string;
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

    // Reset results for this import
    results.imported = 0;
    results.updated = 0;
    results.skipped = 0;
    results.errors = 0;
    results.details = [];

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
      
      // Get existing materials by SKU (check ALL materials, not just user's)
      const skus = batch
        .map(p => p.sku)
        .filter((sku): sku is string => !!sku);

      const existingMaterials = await prisma.material.findMany({
        where: {
          sku: { in: skus }
        },
        select: {
          id: true,
          sku: true,
          userId: true,
        },
      });

      // Separate existing materials by ownership
      const userMaterials = existingMaterials.filter(m => m.userId === userId);
      const otherUserMaterials = existingMaterials.filter(m => m.userId !== userId);
      
      const userSkuMap = new Map(
        userMaterials.map(m => [m.sku!, m.id])
      );
      
      const globalSkuSet = new Set(
        otherUserMaterials.map(m => m.sku!)
      );

      // Process each product in the batch
      const operations: Array<{ promise: Promise<any>, product: any, type: 'create' | 'update' }> = [];
      console.log(`[Import] Processing batch ${batchNumber} with ${batch.length} products`);
      
      for (const product of batch) {
        try {
          const existingId = product.sku ? userSkuMap.get(product.sku) : null;
          const skuExistsGlobally = product.sku ? globalSkuSet.has(product.sku) : false;

          if (existingId && options.updateExisting) {
            // Update existing material
            operations.push({
              promise: prisma.material.update({
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
              }),
              product,
              type: 'update'
            });
            results.updated++;
          } else if (!existingId && options.importNew) {
            // Create new material
            let sku = product.sku || generateSKU(product.name, product.supplier);
            
            // If SKU exists globally (for another user), generate a unique one
            if (skuExistsGlobally) {
              console.log(`[Import] SKU ${sku} already exists for another user, generating new SKU`);
              // Try adding user ID suffix
              sku = `${sku}-${userId.substring(0, 8)}`;
              
              // If that still exists, add a timestamp
              const existingWithSuffix = await prisma.material.findUnique({
                where: { sku },
                select: { id: true }
              });
              
              if (existingWithSuffix) {
                sku = `${product.sku || generateSKU(product.name, product.supplier)}-${Date.now()}`;
              }
            }
            
            const materialData = {
              id: cuid(),
              name: product.name,
              description: product.description || null,
              sku,
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
            operations.push({
              promise: prisma.material.create({
                data: materialData,
              }),
              product: { ...product, sku: materialData.sku },
              type: 'create'
            });
            results.imported++;
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

      // Execute operations individually instead of in a transaction to handle SKU conflicts
      if (operations.length > 0) {
        console.log(`[Import] Executing ${operations.length} operations in batch ${batchNumber}`);
        
        for (let i = 0; i < operations.length; i++) {
          const { promise, product, type } = operations[i];
          
          try {
            await promise;
            
            // Record progress on success
            try {
              if (type === 'create') {
                importProgress.recordImported(1, product.name);
              } else if (type === 'update') {
                importProgress.recordUpdated(1, product.name);
              }
            } catch (progressError) {
              console.error('[Import] Progress tracking error:', progressError);
              // Don't fail the import due to progress tracking issues
            }
          } catch (error: any) {
            console.error(`Operation ${i} failed:`, error);
            
            // Check if it's a unique constraint error on SKU
            if (error.code === 'P2002' && error.meta?.target?.includes('sku')) {
              console.log(`[Import] SKU conflict detected, attempting to resolve...`);
              
              // Only retry for create operations
              if (type === 'create' && product && !product.sku?.includes(Date.now().toString())) {
                // Generate a new unique SKU with timestamp
                const newSku = `${product.sku || generateSKU(product.name, product.supplier)}-${Date.now()}`;
                console.log(`[Import] Retrying with new SKU: ${newSku}`);
                
                try {
                  // Retry the create operation with new SKU
                  const retryData = {
                    id: cuid(),
                    name: product.name,
                    description: product.description || null,
                    sku: newSku,
                    supplier: product.supplier,
                    unit: product.unit as any,
                    pricePerUnit: product.pricePerUnit,
                    gstInclusive: product.gstInclusive,
                    category: product.category || null,
                    inStock: product.inStock,
                    notes: product.notes || null,
                    userId,
                  };
                  
                  await prisma.material.create({ data: retryData });
                  console.log(`[Import] Successfully created with new SKU: ${newSku}`);
                } catch (retryError) {
                  console.error(`[Import] Retry failed:`, retryError);
                  results.errors++;
                  results.imported--;
                  results.details.push({
                    product: product.name,
                    error: 'SKU conflict could not be resolved',
                    originalSku: product.sku,
                    attemptedSku: newSku
                  });
                }
              } else {
                results.errors++;
                if (type === 'create') results.imported--;
                try {
                  importProgress.recordError(1, product?.name || 'Unknown');
                } catch (e) {
                  console.error('[Import] Progress error tracking failed:', e);
                }
                results.details.push({
                  product: product?.name || 'Unknown',
                  error: 'SKU already exists',
                });
              }
            } else {
              // Other types of errors
              results.errors++;
              if (type === 'create') results.imported--;
              if (type === 'update') results.updated--;
              try {
                importProgress.recordError(1, product?.name || 'Unknown');
              } catch (e) {
                console.error('[Import] Progress error tracking failed:', e);
              }
              
              results.details.push({
                product: product?.name || 'Unknown',
                error: error instanceof Error ? error.message : 'Operation failed',
              });
            }
          }
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
    
    // Update session if provided
    if (sessionId) {
      const session = getImportSession(sessionId);
      if (session) {
        updateImportSession(sessionId, {
          processedProducts: session.processedProducts + validProducts.length,
          imported: session.imported + results.imported,
          updated: session.updated + results.updated,
          skipped: session.skipped + results.skipped,
          errors: session.errors + results.errors,
        });
      }
    }
    
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
        sessionId,
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      results: {
        ...results,
        validationErrors: invalid.length,
      },
      sessionId,
    });
  } catch (error) {
    console.error('[Import API] ===== ERROR =====');
    console.error('[Import API] Import error:', error);
    
    // Check if the error is actually the progress object
    if (error && typeof error === 'object' && 'total' in error && 'processed' in error) {
      console.error('[Import API] Progress object thrown as error, continuing with results');
      // Don't treat progress as an error, return success with current results
      return NextResponse.json({
        success: true,
        results: {
          ...results,
          validationErrors: invalid.length,
        },
      });
    }
    
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