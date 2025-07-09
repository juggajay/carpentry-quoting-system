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
   * Scrape using direct fetch with proper headers and pagination support
   */
  static async scrapeDirectly(url: string, maxPages: number = 5): Promise<AlternativeScrapedProduct[]> {
    console.log(`[AlternativeScraper.scrapeDirectly] Starting fetch for: ${url}`);
    
    const allProducts: AlternativeScrapedProduct[] = [];
    let currentPage = 1;
    let hasNextPage = true;
    
    // Parse base URL and existing page parameter
    const urlObj = new URL(url);
    const existingPage = urlObj.searchParams.get('page');
    if (existingPage) {
      currentPage = parseInt(existingPage, 10);
    }
    
    while (hasNextPage && currentPage <= maxPages) {
      try {
        // Update page parameter
        urlObj.searchParams.set('page', currentPage.toString());
        const pageUrl = urlObj.toString();
        
        console.log(`[AlternativeScraper.scrapeDirectly] Fetching page ${currentPage}: ${pageUrl}`);
        
        // Fetch with browser-like headers
        const fetchStart = Date.now();
        const response = await fetch(pageUrl, {
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
          console.error(`[AlternativeScraper.scrapeDirectly] HTTP error for page ${currentPage}: ${response.status}`);
          break;
        }

        const html = await response.text();
        console.log(`[AlternativeScraper.scrapeDirectly] HTML length: ${html.length} characters`);
        
        const parseStart = Date.now();
        const pageProducts = this.parseShopifyProducts(html);
        const parseTime = Date.now() - parseStart;
        console.log(`[AlternativeScraper.scrapeDirectly] Page ${currentPage} parsing completed in ${parseTime}ms, found ${pageProducts.length} products`);
        
        if (pageProducts.length === 0) {
          console.log(`[AlternativeScraper.scrapeDirectly] No products found on page ${currentPage}, stopping pagination`);
          hasNextPage = false;
        } else {
          allProducts.push(...pageProducts);
          
          // Check if there's a next page link
          hasNextPage = html.includes(`?page=${currentPage + 1}`) || 
                       html.includes(`&page=${currentPage + 1}`) ||
                       html.includes(`rel="next"`);
          
          if (hasNextPage) {
            currentPage++;
            // Add a small delay between requests to be respectful
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
      } catch (error) {
        console.error(`[AlternativeScraper.scrapeDirectly] ❌ Error on page ${currentPage}:`, error);
        break;
      }
    }
    
    console.log(`[AlternativeScraper.scrapeDirectly] Total products scraped: ${allProducts.length} from ${currentPage} page(s)`);
    return allProducts;
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

    // Extract unit from various sources
    const unit = AlternativeScraper.extractUnit($element, name, priceText);
    

    return {
      name,
      price,
      unit,
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
          const name = json.name || '';
          const priceText = json.offers?.price || json.price || '0';
          products.push({
            name,
            price: this.parsePrice(priceText.toString()),
            unit: AlternativeScraper.extractUnit($('body'), name, priceText.toString()),
            inStock: json.offers?.availability?.includes('InStock'),
            sku: json.sku,
            description: json.description,
          });
        } else if (json['@graph']) {
          // Handle arrays of products
          json['@graph'].forEach((item: any) => {
            if (item['@type'] === 'Product') {
              const name = item.name || '';
              const priceText = item.offers?.price || item.price || '0';
              products.push({
                name,
                price: this.parsePrice(priceText.toString()),
                unit: AlternativeScraper.extractUnit($('body'), name, priceText.toString()),
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

  /**
   * Extract unit from element, product name, and price text
   */
  static extractUnit($element: any, productName: string, priceText: string): string {
    
    // First, check for explicit unit selectors
    const unitSelectors = [
      '.m-product-card__unit',      // Canterbury Timbers specific
      '.product-unit',
      '.unit',
      '[class*="unit"]',
      '.price-unit',
    ];
    
    for (const selector of unitSelectors) {
      const unitText = $element.find(selector).first().text().trim();
      if (unitText) {
        const normalized = AlternativeScraper.normalizeUnit(unitText);
        if (normalized) {
          return normalized;
        }
        // If normalizeUnit returns empty string (e.g., for "Unit price"), continue checking
      }
    }

    // Check if price text contains unit info (e.g., "$25.99 per m", "$15.50/LM")
    const priceWithUnit = priceText.toLowerCase();
    if (priceWithUnit.includes('per m') || priceWithUnit.includes('/m') || 
        priceWithUnit.includes('per metre') || priceWithUnit.includes('per meter') ||
        priceWithUnit.includes('/lm') || priceWithUnit.includes('linear')) {
      return 'LM';
    }
    
    // Check product name for explicit unit indicators
    const nameLower = productName.toLowerCase();
    
    // Check for explicit "per metre" or similar in product name
    if (nameLower.includes('per metre') || nameLower.includes('per meter') || 
        nameLower.includes('per m') || nameLower.includes('/m')) {
      return 'LM';
    }
    
    // Special case: ALL panel products should be EA (whether timber panels or sheet panels)
    if (nameLower.includes('panel')) {
      return 'EA';
    }
    
    // Timber products that are typically sold by linear meter
    const linearPatterns = [
      // LVL and engineered products
      /lvl/,
      /smartframe/,
      /meyspan/,
      /termispan/,
      /hyspan/,
      // Dimensional lumber patterns
      /\d+\s*x\s*\d+.*(?:pine|hardwood|treated|timber|dar|rough|h[234])/,
      /(?:pine|hardwood|treated|timber|dar|rough|h[234]).*\d+\s*x\s*\d+/,
      // Specific timber types sold by length
      /moulding/,
      /decking/,
      /framing/,
      /structural/,
      /sleeper/,
      /post/,
      /stud/,
      /joist/,
      /rafter/,
      /bearer/,
      /batten/,
      /rail/,
      /architrave/,
      /skirting/,
      /scotia/,
      /quad/,
      /capping/,
      /handrail/,
      /newel/,
      /jamb/,
      /dar\s+\d+/,              // DAR (Dressed All Round) with dimensions
    ];
    
    // Check if product name matches any linear patterns
    for (const pattern of linearPatterns) {
      if (pattern.test(nameLower)) {
        return 'LM';
      }
    }
    
    // Sheet products (sold by each/sheet)
    // Check for sheet products - typically have dimensions like 2400x1200 or 1800x900
    const sheetPatterns = [
      /plywood/,
      /mdf/,
      /particle\s*board/,
      /osb/,
      /sheet/,
      /panel.*\d{4}x\d{3,4}/,   // "panel" with large dimensions (e.g., 2400x1200)
      /board.*\d{4}x\d{3,4}/,    // "board" with large dimensions
    ];
    
    for (const pattern of sheetPatterns) {
      if (pattern.test(nameLower)) {
        return 'EA';
      }
    }
    
    // Check the entire element text for unit indicators
    const elementText = $element.text().toLowerCase();
    if (elementText.includes('linear metre') || elementText.includes('linear meter') ||
        elementText.includes('/lm') || elementText.includes('per m')) {
      return 'LM';
    }

    // Default to EA (each) if no specific unit found
    return 'EA';
  }

  /**
   * Normalize unit text to standard format
   */
  static normalizeUnit(unitText: string): string {
    const unit = unitText.toLowerCase().trim();
    
    // Skip generic "unit price" text - this is not a real unit
    if (unit.includes('unit price') || unit === 'unit') {
      return '';
    }
    
    // Linear meter variations
    if (unit.includes('linear') || unit.includes('metre') || unit.includes('meter') || 
        unit === 'm' || unit === 'lm' || unit.includes('/m')) {
      return 'LM';
    }
    
    // Each/sheet variations
    if (unit.includes('each') || unit === 'ea' || unit.includes('sheet') || 
        unit.includes('piece') || unit.includes('pc')) {
      return 'EA';
    }
    
    // Pack variations
    if (unit.includes('pack') || unit.includes('pk')) {
      return 'PACK';
    }
    
    // Weight variations
    if (unit.includes('kg') || unit.includes('kilogram')) {
      return 'KG';
    }
    
    // Volume variations
    if (unit.includes('litre') || unit.includes('liter') || unit === 'l') {
      return 'L';
    }
    
    // Default to EA if unclear
    return 'EA';
  }
}