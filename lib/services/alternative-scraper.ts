import * as cheerio from 'cheerio';

interface AlternativeScrapedProduct {
  name: string;
  price: number;
  unit?: string;
  sku?: string;
  inStock?: boolean;
  description?: string;
}

export class AlternativeScraper {
  /**
   * Scrape using direct fetch with proper headers
   */
  static async scrapeDirectly(url: string): Promise<AlternativeScrapedProduct[]> {
    console.log(`[AlternativeScraper.scrapeDirectly] Starting fetch for: ${url}`);
    try {
      // Fetch with browser-like headers
      const fetchStart = Date.now();
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Cache-Control': 'max-age=0',
        },
      });
      const fetchTime = Date.now() - fetchStart;
      console.log(`[AlternativeScraper.scrapeDirectly] Fetch completed in ${fetchTime}ms, status: ${response.status}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const html = await response.text();
      console.log(`[AlternativeScraper.scrapeDirectly] HTML length: ${html.length} characters`);
      
      const parseStart = Date.now();
      const products = this.parseShopifyProducts(html);
      const parseTime = Date.now() - parseStart;
      console.log(`[AlternativeScraper.scrapeDirectly] Parsing completed in ${parseTime}ms, found ${products.length} products`);
      
      return products;
    } catch (error) {
      console.error('[AlternativeScraper.scrapeDirectly] ❌ Error:', error);
      throw error;
    }
  }

  /**
   * Parse Shopify product listings
   */
  static parseShopifyProducts(html: string): AlternativeScrapedProduct[] {
    const $ = cheerio.load(html);
    const products: AlternativeScrapedProduct[] = [];

    console.log(`[parseShopifyProducts] Starting to parse HTML`);

    // Common Shopify product selectors
    const productSelectors = [
      '.m-product-item',  // Canterbury Timbers specific
      '.product-item',
      '.grid__item',
      '.collection-product-card',
      'article[class*="product"]',
      'div[class*="product-card"]',
      'li[class*="product"]',
    ];

    for (const selector of productSelectors) {
      const elements = $(selector);
      if (elements.length > 0) {
        console.log(`[parseShopifyProducts] ✅ Found ${elements.length} elements with selector: ${selector}`);
        
        elements.each((index: any, element: any) => {
          const product = this.extractProductFromElement($(element));
          if (product && product.name && product.price > 0) {
            products.push(product);
            if (products.length === 1) {
              console.log(`[parseShopifyProducts] First product found:`, product);
            }
          }
        });
        
        if (products.length > 0) {
          console.log(`[parseShopifyProducts] ✅ Successfully extracted ${products.length} products using selector: ${selector}`);
          break; // Stop if we found products
        }
      }
    }

    // If no products found with structured selectors, try to extract from JSON-LD
    if (products.length === 0) {
      console.log(`[parseShopifyProducts] No products found with selectors, trying JSON-LD`);
      const jsonLdProducts = this.extractFromJsonLd($);
      products.push(...jsonLdProducts);
      if (jsonLdProducts.length > 0) {
        console.log(`[parseShopifyProducts] ✅ Found ${jsonLdProducts.length} products from JSON-LD`);
      }
    }

    console.log(`[parseShopifyProducts] Total products found: ${products.length}`);
    return products;
  }

  /**
   * Extract product data from a single element
   */
  static extractProductFromElement($element: any): AlternativeScrapedProduct | null {
    
    // Try multiple name selectors
    const nameSelectors = [
      '.m-product-card__name',  // Canterbury Timbers specific
      '.m-product-card__title', // Canterbury Timbers specific
      '.product-item__title',
      '.product-card__title',
      '.product__title',
      'h2', 'h3', 'h4',
      'a[href*="/products/"]',
    ];
    
    let name = '';
    for (const selector of nameSelectors) {
      name = $element.find(selector).first().text().trim();
      if (name) break;
    }

    // Try multiple price selectors
    const priceSelectors = [
      '.m-price-item--sale',     // Canterbury Timbers specific
      '.m-price-item--regular',  // Canterbury Timbers specific
      '.m-price-item',          // Canterbury Timbers specific
      '.price',
      '.product-price',
      '.money',
      '[class*="price"]',
      'span[class*="price"]',
    ];
    
    let priceText = '';
    for (const selector of priceSelectors) {
      priceText = $element.find(selector).first().text();
      if (priceText.includes('$')) break;
    }

    const price = this.parsePrice(priceText);

    if (!name || price === 0) return null;

    return {
      name,
      price,
      unit: 'EA',
      inStock: !$element.text().toLowerCase().includes('sold out'),
    };
  }

  /**
   * Extract products from JSON-LD structured data
   */
  static extractFromJsonLd($: any): AlternativeScrapedProduct[] {
    const products: AlternativeScrapedProduct[] = [];
    
    $('script[type="application/ld+json"]').each((_: any, script: any) => {
      try {
        const json = JSON.parse($(script).html() || '{}');
        
        if (json['@type'] === 'Product') {
          products.push({
            name: json.name,
            price: this.parsePrice(json.offers?.price || json.price || '0'),
            unit: 'EA',
            inStock: json.offers?.availability?.includes('InStock'),
            sku: json.sku,
            description: json.description,
          });
        } else if (json['@graph']) {
          // Handle arrays of products
          json['@graph'].forEach((item: any) => {
            if (item['@type'] === 'Product') {
              products.push({
                name: item.name,
                price: this.parsePrice(item.offers?.price || item.price || '0'),
                unit: 'EA',
                inStock: item.offers?.availability?.includes('InStock'),
                sku: item.sku,
                description: item.description,
              });
            }
          });
        }
      } catch {
        // Invalid JSON, skip
      }
    });
    
    return products;
  }

  /**
   * Parse price from text
   */
  static parsePrice(text: string): number {
    const match = text.match(/\$?\s*([\d,]+\.?\d*)/);
    return match ? parseFloat(match[1].replace(/,/g, '')) : 0;
  }
}