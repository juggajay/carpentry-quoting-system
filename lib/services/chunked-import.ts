import { prisma } from '@/lib/prisma';
import { cuid } from '@/lib/utils';
import { DataValidator } from './data-validator';

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

interface ImportOptions {
  updateExisting: boolean;
  importNew: boolean;
}

export class ChunkedImportService {
  private static readonly BATCH_SIZE = 50;
  private static readonly MAX_CONCURRENT_BATCHES = 2;
  
  /**
   * Creates a new import job and processes it asynchronously
   */
  static async createImportJob(
    userId: string,
    source: string,
    products: ImportProduct[],
    options: ImportOptions
  ): Promise<string> {
    // Validate products first
    const { valid: validProducts, invalid } = DataValidator.validateBatch(products);
    
    if (validProducts.length === 0) {
      throw new Error(`No valid products to import. ${invalid.length} products had validation errors.`);
    }
    
    // Create import job record
    const importJob = await prisma.importJob.create({
      data: {
        id: cuid(),
        userId,
        source,
        type: 'materials',
        status: 'PENDING',
        totalItems: validProducts.length,
        totalBatches: Math.ceil(validProducts.length / this.BATCH_SIZE),
        data: JSON.parse(JSON.stringify({
          products: validProducts,
          options,
          invalidProducts: invalid,
        })),
      },
    });
    
    // Process the import job asynchronously
    this.processImportJob(importJob.id).catch(error => {
      console.error(`Failed to process import job ${importJob.id}:`, error);
      // Mark job as failed
      prisma.importJob.update({
        where: { id: importJob.id },
        data: {
          status: 'FAILED',
          errors: {
            message: error.message,
            stack: error.stack,
          },
        },
      }).catch(console.error);
    });
    
    return importJob.id;
  }
  
  /**
   * Processes an import job in chunks
   */
  private static async processImportJob(jobId: string): Promise<void> {
    const job = await prisma.importJob.findUnique({
      where: { id: jobId },
    });
    
    if (!job || job.status !== 'PENDING') {
      throw new Error('Import job not found or already processed');
    }
    
    // Update job status to processing
    await prisma.importJob.update({
      where: { id: jobId },
      data: {
        status: 'PROCESSING',
        startedAt: new Date(),
      },
    });
    
    const products = (job.data as any).products as ImportProduct[];
    const options = (job.data as any).options as ImportOptions;
    const errors: any[] = [];
    
    let processedCount = 0;
    let importedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    // Process in batches
    for (let i = 0; i < products.length; i += this.BATCH_SIZE) {
      const batchNumber = Math.floor(i / this.BATCH_SIZE) + 1;
      const batch = products.slice(i, i + this.BATCH_SIZE);
      
      try {
        // Update progress
        await prisma.importJob.update({
          where: { id: jobId },
          data: {
            currentBatch: batchNumber,
            percentComplete: Math.round((i / products.length) * 100),
          },
        });
        
        // Process batch
        const batchResult = await this.processBatch(job.userId, batch, options);
        
        // Update counts
        processedCount += batchResult.processed;
        importedCount += batchResult.imported;
        updatedCount += batchResult.updated;
        skippedCount += batchResult.skipped;
        errorCount += batchResult.errors;
        
        if (batchResult.errorDetails.length > 0) {
          errors.push(...batchResult.errorDetails);
        }
        
        // Update job progress
        await prisma.importJob.update({
          where: { id: jobId },
          data: {
            processedItems: processedCount,
            importedItems: importedCount,
            updatedItems: updatedCount,
            skippedItems: skippedCount,
            errorItems: errorCount,
          },
        });
        
        // Small delay between batches to prevent overload
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`Error processing batch ${batchNumber}:`, error);
        errors.push({
          batch: batchNumber,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        errorCount += batch.length;
      }
    }
    
    // Mark job as completed
    await prisma.importJob.update({
      where: { id: jobId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        processedItems: processedCount,
        importedItems: importedCount,
        updatedItems: updatedCount,
        skippedItems: skippedCount,
        errorItems: errorCount,
        percentComplete: 100,
        errors: errors.length > 0 ? errors : undefined,
      },
    });
  }
  
  /**
   * Processes a single batch of products
   */
  private static async processBatch(
    userId: string,
    batch: ImportProduct[],
    options: ImportOptions
  ): Promise<{
    processed: number;
    imported: number;
    updated: number;
    skipped: number;
    errors: number;
    errorDetails: any[];
  }> {
    const result = {
      processed: 0,
      imported: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
      errorDetails: [] as any[],
    };
    
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
                unit: product.unit as any,
                category: product.category,
                inStock: product.inStock,
                gstInclusive: product.gstInclusive,
                updatedAt: new Date(),
              },
            })
          );
          result.updated++;
        } else if (!existingId && options.importNew) {
          // Create new material
          operations.push(
            prisma.material.create({
              data: {
                id: cuid(),
                name: product.name,
                description: product.description,
                sku: product.sku || this.generateSKU(product.name, product.supplier),
                supplier: product.supplier,
                unit: product.unit as any,
                pricePerUnit: product.pricePerUnit,
                gstInclusive: product.gstInclusive,
                category: product.category,
                inStock: product.inStock,
                notes: product.notes,
                userId,
              },
            })
          );
          result.imported++;
        } else {
          result.skipped++;
        }
        
        result.processed++;
      } catch (error) {
        console.error('Error processing product:', error);
        result.errors++;
        result.errorDetails.push({
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
        // If transaction fails, all items in batch are errors
        result.errors += operations.length;
        result.imported = 0;
        result.updated = 0;
        result.errorDetails.push({
          batch: 'transaction',
          error: error instanceof Error ? error.message : 'Transaction failed',
        });
      }
    }
    
    return result;
  }
  
  /**
   * Gets the status of an import job
   */
  static async getJobStatus(jobId: string, userId: string) {
    const job = await prisma.importJob.findFirst({
      where: {
        id: jobId,
        userId,
      },
    });
    
    if (!job) {
      return null;
    }
    
    return {
      id: job.id,
      status: job.status,
      type: job.type,
      source: job.source,
      totalItems: job.totalItems,
      processedItems: job.processedItems,
      importedItems: job.importedItems,
      updatedItems: job.updatedItems,
      skippedItems: job.skippedItems,
      errorItems: job.errorItems,
      currentBatch: job.currentBatch,
      totalBatches: job.totalBatches,
      percentComplete: job.percentComplete,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      createdAt: job.createdAt,
      errors: job.errors,
    };
  }
  
  /**
   * Gets recent import jobs for a user
   */
  static async getRecentJobs(userId: string, limit: number = 10) {
    const jobs = await prisma.importJob.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        status: true,
        type: true,
        source: true,
        totalItems: true,
        processedItems: true,
        importedItems: true,
        updatedItems: true,
        errorItems: true,
        percentComplete: true,
        createdAt: true,
        completedAt: true,
      },
    });
    
    return jobs;
  }
  
  /**
   * Cancels a pending or processing import job
   */
  static async cancelJob(jobId: string, userId: string): Promise<boolean> {
    const job = await prisma.importJob.findFirst({
      where: {
        id: jobId,
        userId,
        status: { in: ['PENDING', 'PROCESSING'] },
      },
    });
    
    if (!job) {
      return false;
    }
    
    await prisma.importJob.update({
      where: { id: jobId },
      data: {
        status: 'CANCELLED',
        completedAt: new Date(),
      },
    });
    
    return true;
  }
  
  private static generateSKU(name: string, supplier: string): string {
    const prefix = supplier.substring(0, 3).toUpperCase();
    const namePart = name
      .replace(/[^a-zA-Z0-9]/g, '')
      .substring(0, 10)
      .toUpperCase();
    const timestamp = Date.now().toString().slice(-6);
    return `${prefix}-${namePart}-${timestamp}`;
  }
}