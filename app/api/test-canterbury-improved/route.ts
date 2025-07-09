import { NextResponse } from 'next/server';
import { AlternativeScraper } from '@/lib/services/alternative-scraper';

export async function GET() {
  try {
    const testUrl = 'https://www.canterburytimbers.com.au/collections/timber-all';
    
    console.log('Testing improved Canterbury Timbers scraper...');
    
    // Test with pagination (up to 3 pages for testing)
    const products = await AlternativeScraper.scrapeDirectly(testUrl, 3);
    
    // Group products by unit to see the distribution
    const unitCounts: Record<string, number> = {};
    products.forEach(p => {
      unitCounts[p.unit || 'UNKNOWN'] = (unitCounts[p.unit || 'UNKNOWN'] || 0) + 1;
    });
    
    // Get sample products for each unit type
    const samplesByUnit: Record<string, any[]> = {};
    products.forEach(p => {
      const unit = p.unit || 'UNKNOWN';
      if (!samplesByUnit[unit]) {
        samplesByUnit[unit] = [];
      }
      if (samplesByUnit[unit].length < 3) {
        samplesByUnit[unit].push({
          name: p.name,
          price: p.price,
          unit: p.unit,
        });
      }
    });
    
    return NextResponse.json({
      success: true,
      url: testUrl,
      totalProducts: products.length,
      unitDistribution: unitCounts,
      samplesByUnit,
      allProducts: products.slice(0, 10), // First 10 products for debugging
    });
  } catch (error) {
    console.error('Canterbury test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}