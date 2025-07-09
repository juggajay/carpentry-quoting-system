import { NextRequest, NextResponse } from 'next/server';
import FirecrawlApp from 'firecrawl';

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const diagnostics: any = {
      url,
      timestamp: new Date().toISOString(),
      tests: []
    };

    // Test 1: Simple fetch
    try {
      const fetchStart = Date.now();
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        signal: AbortSignal.timeout(10000)
      });
      
      diagnostics.tests.push({
        name: 'Simple Fetch',
        success: true,
        duration: Date.now() - fetchStart,
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        contentLength: response.headers.get('content-length'),
        contentType: response.headers.get('content-type'),
      });

      // Check for Cloudflare
      const cfRay = response.headers.get('cf-ray');
      if (cfRay) {
        diagnostics.cloudflare = true;
        diagnostics.cfRay = cfRay;
      }
    } catch (error) {
      diagnostics.tests.push({
        name: 'Simple Fetch',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test 2: Firecrawl with minimal options
    try {
      const apiKey = process.env.FIRECRAWL_API_KEY;
      if (!apiKey) throw new Error('No Firecrawl API key');

      const firecrawl = new FirecrawlApp({ apiKey });
      const fcStart = Date.now();
      
      const result = await firecrawl.scrapeUrl(url, {
        formats: ['markdown'],
        waitFor: 2000,
        timeout: 15000,
      });

      diagnostics.tests.push({
        name: 'Firecrawl Basic',
        success: result.success,
        duration: Date.now() - fcStart,
        hasMarkdown: !!(result as any).markdown,
        markdownLength: (result as any).markdown?.length || 0,
        error: !result.success ? 'Firecrawl returned success=false' : undefined
      });

      // Sample of content
      if ((result as any).markdown) {
        diagnostics.markdownPreview = (result as any).markdown.substring(0, 500);
      }
    } catch (error) {
      diagnostics.tests.push({
        name: 'Firecrawl Basic',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        errorType: error instanceof Error ? error.constructor.name : 'Unknown'
      });
    }

    // Test 3: Check if it's a Shopify site
    try {
      const response = await fetch(url);
      const text = await response.text();
      
      diagnostics.platform = {
        shopify: text.includes('Shopify.shop') || text.includes('cdn.shopify.com'),
        wordpress: text.includes('wp-content') || text.includes('wordpress'),
        woocommerce: text.includes('woocommerce'),
        squarespace: text.includes('squarespace'),
      };

      // Check for common protection systems
      diagnostics.protection = {
        cloudflare: text.includes('cloudflare') || !!response.headers.get('cf-ray'),
        recaptcha: text.includes('recaptcha'),
        ddosGuard: text.includes('ddos-guard'),
      };
    } catch (error) {
      diagnostics.platformCheckError = error instanceof Error ? error.message : 'Unknown';
    }

    // Test 4: Try Firecrawl with different options
    if (process.env.FIRECRAWL_API_KEY) {
      try {
        const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });
        const result = await firecrawl.scrapeUrl(url, {
          formats: ['links', 'html', 'markdown'],
          onlyMainContent: false,
          waitFor: 5000,
          timeout: 20000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
          }
        });

        diagnostics.tests.push({
          name: 'Firecrawl Full Options',
          success: result.success,
          formats: {
            hasLinks: !!(result as any).links,
            hasHtml: !!(result as any).html,
            hasMarkdown: !!(result as any).markdown,
            linksCount: (result as any).links?.length || 0,
          }
        });
      } catch (error) {
        diagnostics.tests.push({
          name: 'Firecrawl Full Options',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Recommendations
    diagnostics.recommendations = [];
    
    if (diagnostics.cloudflare || diagnostics.protection?.cloudflare) {
      diagnostics.recommendations.push('Site has Cloudflare protection. Consider using a proxy service or API.');
    }
    
    if (!diagnostics.tests.some((t: any) => t.name === 'Firecrawl Basic' && t.success)) {
      diagnostics.recommendations.push('Firecrawl cannot access this site. Try alternative scrapers or APIs.');
    }

    if (diagnostics.platform?.shopify) {
      diagnostics.recommendations.push('This is a Shopify site. Consider using Shopify\'s API if available.');
    }

    return NextResponse.json(diagnostics);
  } catch (error) {
    console.error('Diagnostic error:', error);
    return NextResponse.json({
      error: 'Diagnostic failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}