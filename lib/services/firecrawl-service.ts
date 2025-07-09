import FirecrawlApp from 'firecrawl';
import * as cheerio from 'cheerio';
import { errorHandler } from './firecrawl-error-handler';
import { getSupplierConfig } from './supplier-configs';

interface ScrapedProduct {
  name: string;
  description?: string;
  sku?: string;
  price?: number;
  unit?: string;
  inStock?: boolean;
  category?: string;
}

export interface ScraperConfig {
  supplier: 'bunnings' | 'blacktown' | 'canterbury' | 'custom';
  category?: string;
  customUrl?: string;
  options: {
    updateExisting: boolean;
    importNew: boolean;
    includeGST: boolean;
  };
}

interface SupplierConfig {
  name: string;
  baseUrl: string;
  selectors: {
    products: string;
    name: string;
    price: string;
    sku?: string;
    unit?: string;
    stock?: string;
    category?: string;
    description?: string;
  };
}

export class FirecrawlService {
  private firecrawl: FirecrawlApp;
  private rateLimitDelay = 1000; // 1 second between requests
  
  constructor(apiKey: string) {
    this.firecrawl = new FirecrawlApp({ apiKey });
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private parsePrice(priceText: string): number {
    const cleanPrice = priceText.replace(/[^0-9.]/g, '');
    return parseFloat(cleanPrice) || 0;
  }

  private parseUnit(unitText: string): string {
    const upperUnit = unitText.toUpperCase();
    if (upperUnit.includes('EA')) return 'EA';
    if (upperUnit.includes('LM') || upperUnit.includes('LINEAR')) return 'LM';
    if (upperUnit.includes('SQM') || upperUnit.includes('M2')) return 'SQM';
    if (upperUnit.includes('KG')) return 'KG';
    if (upperUnit.includes('L') || upperUnit.includes('LITRE')) return 'L';
    return 'EA'; // default
  }

  async scrapeSupplier(config: SupplierConfig, urls: string[]): Promise<ScrapedProduct[]> {
    const products: ScrapedProduct[] = [];
    console.log(`[FirecrawlService] Starting scrape for ${config.name} with ${urls.length} URLs`);
    
    for (const url of urls) {
      try {
        console.log(`[FirecrawlService] Scraping URL: ${url}`);
        await this.delay(this.rateLimitDelay);
        
        const result = await errorHandler.withRetry(
          async () => {
            console.log(`[FirecrawlService] Calling Firecrawl API for ${url}`);
            const res = await this.firecrawl.scrapeUrl(url, {
              formats: ['markdown', 'html'],
              waitFor: 5000,
              onlyMainContent: true,
              timeout: 25000,
            });
            
            console.log(`[FirecrawlService] Firecrawl response:`, { 
              success: res.success, 
              hasHtml: !!(res as any).html, 
              hasMarkdown: !!(res as any).markdown,
              htmlLength: (res as any).html?.length || 0 
            });
            
            if (!res.success || (!(res as any).html && !(res as any).markdown)) {
              throw new Error(`Failed to scrape ${url}: No content returned`);
            }
            
            return res;
          },
          { supplier: config.name, url }
        );

        // Try markdown parsing first for Canterbury (simpler and faster)
        let parsedProducts: ScrapedProduct[] = [];
        if ((result as any).markdown) {
          console.log(`Parsing markdown for ${url}`);
          parsedProducts = this.parseProductsFromMarkdown((result as any).markdown, config);
        }
        
        // If no products found with markdown, try HTML parsing
        if (parsedProducts.length === 0 && (result as any).html) {
          console.log(`No products found with markdown, trying HTML for ${url}`);
          parsedProducts = this.parseProducts((result as any).html, config);
        }
        products.push(...parsedProducts);
        
      } catch (error) {
        console.error(`Error scraping ${url}:`, error);
        errorHandler.handleApiError(error, { supplier: config.name, url });
      }
    }
    
    return products;
  }

  private parseProducts(html: string, config: SupplierConfig): ScrapedProduct[] {
    const products: ScrapedProduct[] = [];
    
    try {
      const $ = cheerio.load(html);
      
      const productElements = $(config.selectors.products);
      console.log(`Found ${productElements.length} product elements for ${config.name}`);
      
      productElements.each((_, element) => {
        try {
          const $element = $(element);
          
          const product: ScrapedProduct = {
            name: $element.find(config.selectors.name).first().text().trim() || '',
            price: this.parsePrice(
              $element.find(config.selectors.price).first().text() || '0'
            ),
          };

          if (config.selectors.sku) {
            product.sku = $element.find(config.selectors.sku).first().text().trim();
          }

          if (config.selectors.unit) {
            const unitText = $element.find(config.selectors.unit).first().text() || '';
            product.unit = this.parseUnit(unitText);
          } else {
            product.unit = 'EA'; // Default unit
          }

          if (config.selectors.stock) {
            const stockText = $element.find(config.selectors.stock).first().text() || '';
            product.inStock = !stockText.toLowerCase().includes('out of stock');
          } else {
            product.inStock = true; // Default to in stock
          }

          if (config.selectors.category) {
            product.category = $element.find(config.selectors.category).first().text().trim();
          }

          if (config.selectors.description) {
            product.description = $element.find(config.selectors.description).first().text().trim();
          }

          // Log for debugging
          if (!product.name) {
            console.log('No product name found, trying alternate selector:', $element.text().substring(0, 100));
          }

          if (product.name && product.price && product.price > 0) {
            products.push(product);
          }
        } catch (error) {
          console.error('Error parsing individual product:', error);
        }
      });
      
    } catch (error) {
      console.error('Error parsing HTML with cheerio:', error);
    }
    
    console.log(`Parsed ${products.length} products from HTML`);
    return products;
  }

  private parseProductsFromMarkdown(markdown: string, config: SupplierConfig): ScrapedProduct[] {
    const products: ScrapedProduct[] = [];
    
    try {
      // Split by common product separators
      const sections = markdown.split(/\n(?=#{1,3}\s|^[-*]\s|\[)/);
      
      for (const section of sections) {
        const lines = section.split('\n').filter(line => line.trim());
        if (lines.length === 0) continue;
        
        const product: Partial<ScrapedProduct> = {};
        
        for (const line of lines) {
          // Extract product name from headers, links, or bold text
          if (!product.name) {
            if (line.match(/^#{1,3}\s/)) {
              product.name = line.replace(/^#{1,3}\s/, '').replace(/[\[\]()]/g, '').trim();
            } else if (line.match(/^\[([^\]]+)\]/)) {
              const match = line.match(/^\[([^\]]+)\]/);
              if (match) product.name = match[1].trim();
            } else if (line.match(/^\*\*([^*]+)\*\*/)) {
              const match = line.match(/^\*\*([^*]+)\*\*/);
              if (match) product.name = match[1].trim();
            } else if (line.match(/^[-*]\s+(.+)/) && !product.name) {
              const match = line.match(/^[-*]\s+(.+)/);
              if (match) product.name = match[1].replace(/\$[\d,]+\.?\d*.*$/, '').trim();
            }
          }
          
          // Look for price patterns
          const priceMatch = line.match(/\$\s?([\d,]+\.?\d*)/);
          if (priceMatch) {
            const price = this.parsePrice(priceMatch[0]);
            if (price > 0) {
              product.price = price;
              
              // Try to extract unit from price line
              const unitMatch = line.match(/per\s+(\w+)|\/(\w+)/i);
              if (unitMatch) {
                const unitText = unitMatch[1] || unitMatch[2];
                product.unit = this.parseUnit(unitText);
              }
            }
          }
          
          // Look for SKU patterns
          const skuMatch = line.match(/(?:SKU|Code|Item|Product\s*#?):?\s*([A-Z0-9\-]+)/i);
          if (skuMatch) {
            product.sku = skuMatch[1];
          }
          
          // Look for stock status
          if (line.match(/in\s*stock|available/i)) {
            product.inStock = true;
          } else if (line.match(/out\s*of\s*stock|unavailable/i)) {
            product.inStock = false;
          }
        }
        
        // Add product if we have name and price
        if (product.name && product.price) {
          products.push({
            name: product.name.substring(0, 255), // Limit length
            price: product.price,
            unit: product.unit || 'EA',
            inStock: product.inStock ?? true,
            description: product.description,
            category: config.name,
            sku: product.sku || this.generateSKU(product.name, config.name),
          });
        }
      }
    } catch (error) {
      console.error('Error parsing markdown:', error);
    }
    
    console.log(`[Markdown Parser] Found ${products.length} products from ${config.name}`);
    return products;
  }
  
  private generateSKU(name: string, supplier: string): string {
    const prefix = supplier.substring(0, 3).toUpperCase();
    const namePart = name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 6).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${namePart}-${random}`;
  }

  // Supplier-specific scrapers
  async scrapeBunnings(urls: string[]): Promise<ScrapedProduct[]> {
    const supplierConfig = getSupplierConfig('bunnings');
    if (!supplierConfig) {
      throw new Error('Bunnings configuration not found');
    }
    
    const config: SupplierConfig = {
      name: supplierConfig.name,
      baseUrl: supplierConfig.baseUrl,
      selectors: supplierConfig.selectors,
    };
    
    return this.scrapeSupplier(config, urls);
  }

  async scrapeBlacktown(urls: string[]): Promise<ScrapedProduct[]> {
    const supplierConfig = getSupplierConfig('blacktown');
    if (!supplierConfig) {
      throw new Error('Blacktown Building Supplies configuration not found');
    }
    
    const config: SupplierConfig = {
      name: supplierConfig.name,
      baseUrl: supplierConfig.baseUrl,
      selectors: supplierConfig.selectors,
    };
    
    return this.scrapeSupplier(config, urls);
  }

  async scrapeCanterbury(urls: string[]): Promise<ScrapedProduct[]> {
    const supplierConfig = getSupplierConfig('canterbury');
    if (!supplierConfig) {
      throw new Error('Canterbury Timbers configuration not found');
    }
    
    const config: SupplierConfig = {
      name: supplierConfig.name,
      baseUrl: supplierConfig.baseUrl,
      selectors: supplierConfig.selectors,
    };
    
    return this.scrapeSupplier(config, urls);
  }

  // Scrape with configuration
  async scrapeWithConfig(config: ScraperConfig, urls: string[]): Promise<ScrapedProduct[]> {
    let products: ScrapedProduct[] = [];
    
    switch (config.supplier) {
      case 'bunnings':
        products = await this.scrapeBunnings(urls);
        break;
      case 'blacktown':
        products = await this.scrapeBlacktown(urls);
        break;
      case 'canterbury':
        products = await this.scrapeCanterbury(urls);
        break;
      case 'custom':
        if (!config.customUrl) {
          throw new Error('Custom URL required for custom supplier');
        }
        // For custom suppliers, use generic scraping
        const customConfig: SupplierConfig = {
          name: 'Custom',
          baseUrl: config.customUrl,
          selectors: {
            products: '.product, .item, [data-product]',
            name: '.title, .name, h2, h3',
            price: '.price, .cost, [data-price]',
            sku: '.sku, .code, [data-sku]',
            unit: '.unit, .uom, [data-unit]',
            stock: '.stock, .availability, [data-stock]',
          },
        };
        products = await this.scrapeSupplier(customConfig, urls);
        break;
    }
    
    // Filter by category if specified
    if (config.category && products.length > 0) {
      products = products.filter(p => 
        p.category?.toLowerCase().includes(config.category!.toLowerCase())
      );
    }
    
    // Adjust prices based on GST setting
    if (!config.options.includeGST && products.length > 0) {
      products = products.map(p => ({
        ...p,
        price: p.price ? p.price / 1.1 : p.price // Remove 10% GST
      }));
    }
    
    return products;
  }

  // Batch scraping with error handling
  async batchScrape(
    supplier: 'bunnings' | 'blacktown' | 'canterbury',
    urls: string[],
    batchSize = 5
  ): Promise<ScrapedProduct[]> {
    const allProducts: ScrapedProduct[] = [];
    
    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize);
      console.log(`Processing batch ${i / batchSize + 1} of ${Math.ceil(urls.length / batchSize)}`);
      
      let products: ScrapedProduct[] = [];
      switch (supplier) {
        case 'bunnings':
          products = await this.scrapeBunnings(batch);
          break;
        case 'blacktown':
          products = await this.scrapeBlacktown(batch);
          break;
        case 'canterbury':
          products = await this.scrapeCanterbury(batch);
          break;
      }
      
      allProducts.push(...products);
      
      // Longer delay between batches
      if (i + batchSize < urls.length) {
        await this.delay(this.rateLimitDelay * 3);
      }
    }
    
    return allProducts;
  }
}

// Export singleton instance
let firecrawlInstance: FirecrawlService | null = null;

export function getFirecrawlService(): FirecrawlService {
  if (!firecrawlInstance) {
    const apiKey = process.env.FIRECRAWL_API_KEY;
    if (!apiKey) {
      throw new Error('FIRECRAWL_API_KEY environment variable is required');
    }
    console.log('[FirecrawlService] Initializing with API key:', apiKey.substring(0, 10) + '...');
    firecrawlInstance = new FirecrawlService(apiKey);
  }
  return firecrawlInstance;
}