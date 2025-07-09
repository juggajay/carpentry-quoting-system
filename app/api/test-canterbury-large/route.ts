import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { AlternativeScraper } from '@/lib/services/alternative-scraper';
import { ChunkedImportService } from '@/lib/services/chunked-import';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Test large Canterbury Timbers import
    const testUrl = 'https://www.canterburytimbers.com.au/timber-products/';
    console.log(`Testing large import from: ${testUrl}`);
    
    // Fetch all products (up to 50 pages)
    const startTime = Date.now();
    const products = await AlternativeScraper.scrapeDirectly(testUrl, 50);
    const scrapingTime = Date.now() - startTime;
    
    console.log(`Scraped ${products.length} products in ${scrapingTime}ms`);
    
    if (products.length === 0) {
      return NextResponse.json({
        error: 'No products found',
        url: testUrl,
      }, { status: 404 });
    }
    
    // Transform to import format
    const importProducts = products.map(p => ({
      name: p.name,
      description: p.description,
      sku: p.sku,
      supplier: 'Canterbury Timbers',
      unit: p.unit || 'EA',
      pricePerUnit: p.price || 0,
      gstInclusive: true,
      category: 'Timber',
      inStock: p.inStock ?? true,
      notes: null,
    }));
    
    // Create import job
    const jobId = await ChunkedImportService.createImportJob(
      userId,
      'Canterbury Timbers',
      importProducts,
      {
        updateExisting: true,
        importNew: true,
      }
    );
    
    return NextResponse.json({
      success: true,
      jobId,
      totalProducts: products.length,
      scrapingTimeMs: scrapingTime,
      message: `Import job created for ${products.length} products`,
      sampleProducts: products.slice(0, 5).map(p => ({
        name: p.name,
        price: p.price,
        sku: p.sku,
      })),
    });
  } catch (error) {
    console.error('Test failed:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Test failed',
      stack: process.env.NODE_ENV === 'development' ? 
        (error instanceof Error ? error.stack : undefined) : undefined,
    }, { status: 500 });
  }
}