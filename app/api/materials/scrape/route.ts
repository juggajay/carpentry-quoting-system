import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { MaterialWebScraper } from '@/lib/material-prices/web-scraper';
import { ScraperConfigSchema } from '@/lib/material-prices/scraper-config';

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    
    // Validate the configuration
    const configResult = ScraperConfigSchema.safeParse(body);
    if (!configResult.success) {
      return NextResponse.json({ 
        error: 'Invalid configuration',
        details: configResult.error.errors 
      }, { status: 400 });
    }

    const config = configResult.data;
    
    // If no materials specified, use default common materials
    const materialsToSearch = config.materials && config.materials.length > 0 
      ? config.materials 
      : [
          '90x45 pine',
          '12mm plywood',
          'liquid nails',
          'timber screws',
          '16mm mdf'
        ];
    
    // Create scraper and fetch prices
    const scraper = new MaterialWebScraper(config);
    const results = await scraper.scrapePrices(materialsToSearch);
    
    return NextResponse.json({
      success: true,
      count: results.length,
      materials: results
    });
  } catch (error) {
    console.error('Scraping error:', error);
    return NextResponse.json(
      { error: 'Scraping failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}