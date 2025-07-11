import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getFirecrawlService, ScraperConfig } from '@/lib/services/firecrawl-service';
import { transformBatch } from '@/lib/services/material-mapper';
import { prisma } from '@/lib/prisma';
import { scrapeCache, requestDeduplicator } from '@/lib/services/firecrawl-cache';
import { getCategoryUrls } from '@/lib/services/supplier-configs';
import { DataValidator } from '@/lib/services/data-validator';
import { rateLimiters, withRateLimit } from '@/lib/services/rate-limiter';

export async function POST(req: NextRequest) {
  let body: any;
  
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Apply rate limiting
    const rateLimitResponse = await withRateLimit(req, rateLimiters.scrape, userId);
    if (rateLimitResponse) return rateLimitResponse;

    body = await req.json();
    console.log('Scrape API received body:', body);
    
    // Support both old format (direct params) and new format (config object)
    let supplier: string;
    let category: string | undefined;
    let urls: string[] | undefined;
    let customUrl: string | undefined;
    let options: {
      updateExisting: boolean;
      importNew: boolean;
      includeGST: boolean;
    };
    
    if (body.config) {
      // New format from MCP tool
      const config = body.config as ScraperConfig;
      supplier = config.supplier;
      category = config.category;
      customUrl = config.customUrl;
      options = config.options;
    } else {
      // Old format from UI
      supplier = body.supplier;
      category = body.category;
      urls = body.urls;
      customUrl = body.customUrl;
      options = body.options || {
        updateExisting: true,
        importNew: true,
        includeGST: true,
      };
    }

    // Validate supplier
    if (!supplier || !DataValidator.isValidSupplier(supplier)) {
      return NextResponse.json(
        { error: 'Invalid supplier' },
        { status: 400 }
      );
    }

    if (!options) {
      return NextResponse.json(
        { error: 'Options are required' },
        { status: 400 }
      );
    }

    // Check cache first
    const cacheKey = scrapeCache.generateKey(supplier, category, urls);
    const cachedData = scrapeCache.get<any>(cacheKey);
    
    if (cachedData) {
      return NextResponse.json({
        ...cachedData,
        cached: true,
      });
    }

    // Deduplicate concurrent requests
    const result = await requestDeduplicator.deduplicate(cacheKey, async () => {
      // Get URLs from supplier config
      const scrapeUrls = urls || getCategoryUrls(supplier, category);
      
      if (scrapeUrls.length === 0) {
        return {
          error: 'No URLs to scrape',
          products: [],
          summary: { total: 0, new: 0, existing: 0, errors: 0 },
        };
      }

      let firecrawl;
      
      // For Canterbury, we can use alternative scraper directly without Firecrawl
      if (supplier === 'canterbury') {
        console.log('[Scrape API] Canterbury detected - using alternative scraper directly');
        const { AlternativeScraper } = await import('@/lib/services/alternative-scraper');
        const allProducts: any[] = [];
        
        for (const url of scrapeUrls) {
          try {
            console.log(`[Scrape API] Scraping Canterbury URL: ${url}`);
            const products = await AlternativeScraper.scrapeDirectly(url, 50); // Fetch up to 50 pages for Canterbury
            console.log(`[Scrape API] Found ${products.length} products from ${url}`);
            allProducts.push(...products.map(p => ({
              name: p.name,
              pricePerUnit: p.price || 0,
              unit: p.unit || 'EA',
              inStock: p.inStock ?? true,
              description: p.description,
              sku: p.sku,
              supplier: 'Canterbury Timbers',
              gstInclusive: true,
              category: 'Timber',
              status: 'new',
            })));
          } catch (urlError) {
            console.error(`[Scrape API] Error scraping ${url}:`, urlError);
          }
        }
        
        return {
          products: allProducts,
          summary: {
            total: allProducts.length,
            new: allProducts.length,
            existing: 0,
            errors: 0,
          },
        };
      }
      
      // For other suppliers, use Firecrawl
      try {
        firecrawl = getFirecrawlService();
      } catch (serviceError) {
        console.error('Failed to initialize Firecrawl service:', serviceError);
        return {
          error: `Firecrawl initialization failed: ${serviceError instanceof Error ? serviceError.message : 'Unknown error'}`,
          products: [],
          summary: { total: 0, new: 0, existing: 0, errors: 0 },
        };
      }
      const config: ScraperConfig = {
        supplier: supplier as any,
        category,
        customUrl,
        options,
      };

      // Scrape products with timeout
      console.log(`[Scrape API] Starting scrape for ${supplier} - URLs:`, scrapeUrls);
      console.log(`[Scrape API] Supplier config:`, { supplier, category, customUrl });
      
      const scrapePromise = firecrawl.scrapeWithConfig(config, scrapeUrls);
      const timeoutPromise = new Promise<never>((_, reject) => {
        // Longer timeout for Canterbury Timbers (2 minutes for 1000+ items)
        const timeoutMs = supplier === 'canterbury' ? 120000 : 30000;
        console.log(`[Scrape API] Setting timeout for ${supplier}: ${timeoutMs}ms`);
        setTimeout(() => {
          console.log(`[Scrape API] ❌ Timeout reached for ${supplier} after ${timeoutMs/1000} seconds`);
          reject(new Error(`Scraping timeout after ${timeoutMs/1000} seconds`));
        }, timeoutMs);
      });
      
      console.log(`[Scrape API] Starting race between scrape and timeout`);
      const scrapedProducts = await Promise.race([scrapePromise, timeoutPromise]);
      console.log(`[Scrape API] ✅ Scrape completed, got ${scrapedProducts.length} products`);

      // Transform to our material format
      const transformedProducts = transformBatch(
        scrapedProducts.map(p => ({
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

      // Validate all products
      const { valid, invalid } = DataValidator.validateBatch(transformedProducts);
      
      // Check which valid products already exist
      const skus = valid
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

      // Mark products with their status
      const productsWithStatus = valid.map(product => ({
        ...product,
        status: existingSkus.has(product.sku || '') ? 'existing' : 'new',
      }));

      // Add invalid products with error status
      const invalidWithStatus = invalid.map(({ data, errors }) => ({
        ...data,
        status: 'error',
        error: errors.join(', '),
      }));

      const allProducts = [...productsWithStatus, ...invalidWithStatus];

      // Calculate summary
      const summary = {
        total: allProducts.length,
        new: productsWithStatus.filter(p => p.status === 'new').length,
        existing: productsWithStatus.filter(p => p.status === 'existing').length,
        errors: invalidWithStatus.length,
      };

      const responseData = {
        products: allProducts,
        summary,
      };

      // Cache successful results
      if (summary.errors === 0) {
        scrapeCache.set(cacheKey, responseData);
      }

      return responseData;
    });

    if ('error' in result && result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Scraping error details:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      body: body,
    });
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { 
        error: 'Failed to scrape products',
        details: errorMessage,
        supplier: body?.supplier,
        debug: process.env.NODE_ENV === 'development' ? {
          stack: error instanceof Error ? error.stack : undefined,
          body: body,
        } : undefined
      },
      { status: 500 }
    );
  }
}