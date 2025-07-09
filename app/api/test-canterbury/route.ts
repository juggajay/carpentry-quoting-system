import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Test if we can reach Canterbury Timbers website
    const testUrl = 'https://www.canterburytimbers.com.au/timber-products/';
    console.log(`Testing URL: ${testUrl}`);
    
    // Try a simple fetch first
    const response = await fetch(testUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });
    
    const status = response.status;
    const contentType = response.headers.get('content-type');
    const contentLength = response.headers.get('content-length');
    
    // Try to get some content
    const text = await response.text();
    const hasProducts = text.includes('product') || text.includes('timber');
    const hasPrice = text.includes('$') || text.includes('price');
    
    return NextResponse.json({
      url: testUrl,
      status,
      contentType,
      contentLength,
      textLength: text.length,
      hasProducts,
      hasPrice,
      preview: text.substring(0, 500),
      selectors: {
        products: countMatches(text, 'class="product'),
        prices: countMatches(text, 'class="price'),
        woocommerce: text.includes('woocommerce'),
      }
    });
  } catch (error) {
    console.error('Test failed:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Test failed',
      type: error instanceof Error ? error.constructor.name : 'Unknown'
    }, { status: 500 });
  }
}

function countMatches(text: string, pattern: string): number {
  const matches = text.match(new RegExp(pattern, 'g'));
  return matches ? matches.length : 0;
}