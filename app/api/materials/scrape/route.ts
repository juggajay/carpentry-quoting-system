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
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Apply rate limiting
    const rateLimitResponse = await withRateLimit(req, rateLimiters.scrape, userId);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await req.json();
    const { supplier, category, urls, options, customUrl } = body as {
      supplier: string;
      category?: string;
      urls?: string[];
      customUrl?: string;
      options: {
        updateExisting: boolean;
        importNew: boolean;
        includeGST: boolean;
      };
    };

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

      const firecrawl = getFirecrawlService();
      const config: ScraperConfig = {
        supplier: supplier as any,
        category,
        customUrl,
        options,
      };

      // Scrape products
      const scrapedProducts = await firecrawl.scrapeWithConfig(config, scrapeUrls);

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
    console.error('Scraping error:', error);
    return NextResponse.json(
      { error: 'Failed to scrape products' },
      { status: 500 }
    );
  }
}