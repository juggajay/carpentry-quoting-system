import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { MaterialWebScraper } from '@/lib/material-prices/web-scraper';
import { ScraperConfigSchema, SCRAPER_SOURCES } from '@/lib/material-prices/scraper-config';
import { MaterialPrice } from '@/lib/material-prices';

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
    
    // Initialize results array
    const results: MaterialPrice[] = [];
    const scraper = new MaterialWebScraper(config);
    const source = config.source === 'customUrl' 
      ? {
          name: 'Custom Supplier',
          baseUrl: config.customUrl || '',
          searchPath: '',
          selectors: config.customSelectors || SCRAPER_SOURCES.customUrl.selectors
        }
      : SCRAPER_SOURCES[config.source];

    // Fetch and scrape each material on the server side
    for (const term of materialsToSearch) {
      try {
        const url = `${source.baseUrl}${source.searchPath}${encodeURIComponent(term)}`;
        
        // Server-side fetch with proper headers
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
          },
        });

        if (!response.ok) {
          console.error(`Failed to fetch ${url}: ${response.status}`);
          // Try mock data as fallback
          const mockResults = await scraper.getMockPrices([term]);
          results.push(...mockResults);
          continue;
        }

        const html = await response.text();
        const scrapedResults = await scraper.parseHtml(html, term, source);
        results.push(...scrapedResults);
      } catch (error) {
        console.error(`Error scraping ${term}:`, error);
        // Fall back to mock data
        const mockResults = await scraper.getMockPrices([term]);
        results.push(...mockResults);
      }
    }
    
    return NextResponse.json({
      success: true,
      count: results.length,
      materials: results.map(m => ({
        ...m,
        lastUpdated: m.lastUpdated.toISOString() // Ensure dates are serialized
      }))
    });
  } catch (error) {
    console.error('Scraping error:', error);
    return NextResponse.json(
      { error: 'Scraping failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}