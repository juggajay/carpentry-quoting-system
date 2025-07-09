import FirecrawlApp from 'firecrawl';
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
  supplier: 'bunnings' | 'tradelink' | 'reece' | 'custom';
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
    
    for (const url of urls) {
      try {
        await this.delay(this.rateLimitDelay);
        
        const result = await errorHandler.withRetry(
          async () => {
            const res = await this.firecrawl.scrapeUrl(url, {
              formats: ['html'],
              waitFor: 2000,
            });
            
            if (!res.success || !res.html) {
              throw new Error(`Failed to scrape ${url}: No content returned`);
            }
            
            return res;
          },
          { supplier: config.name, url }
        );

        const parsedProducts = result.html ? this.parseProducts(result.html, config) : [];
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
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      const productElements = doc.querySelectorAll(config.selectors.products);
      
      productElements.forEach(element => {
        try {
          const product: ScrapedProduct = {
            name: element.querySelector(config.selectors.name)?.textContent?.trim() || '',
            price: this.parsePrice(
              element.querySelector(config.selectors.price)?.textContent || '0'
            ),
          };

          if (config.selectors.sku) {
            product.sku = element.querySelector(config.selectors.sku)?.textContent?.trim();
          }

          if (config.selectors.unit) {
            const unitText = element.querySelector(config.selectors.unit)?.textContent || '';
            product.unit = this.parseUnit(unitText);
          }

          if (config.selectors.stock) {
            const stockText = element.querySelector(config.selectors.stock)?.textContent || '';
            product.inStock = !stockText.toLowerCase().includes('out of stock');
          }

          if (config.selectors.category) {
            product.category = element.querySelector(config.selectors.category)?.textContent?.trim();
          }

          if (config.selectors.description) {
            product.description = element.querySelector(config.selectors.description)?.textContent?.trim();
          }

          if (product.name && product.price) {
            products.push(product);
          }
        } catch (error) {
          console.error('Error parsing product:', error);
        }
      });
      
    } catch (error) {
      console.error('Error parsing HTML:', error);
    }
    
    return products;
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

  async scrapeTradelink(urls: string[]): Promise<ScrapedProduct[]> {
    const supplierConfig = getSupplierConfig('tradelink');
    if (!supplierConfig) {
      throw new Error('Tradelink configuration not found');
    }
    
    const config: SupplierConfig = {
      name: supplierConfig.name,
      baseUrl: supplierConfig.baseUrl,
      selectors: supplierConfig.selectors,
    };
    
    return this.scrapeSupplier(config, urls);
  }

  async scrapeReece(urls: string[]): Promise<ScrapedProduct[]> {
    const supplierConfig = getSupplierConfig('reece');
    if (!supplierConfig) {
      throw new Error('Reece configuration not found');
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
      case 'tradelink':
        products = await this.scrapeTradelink(urls);
        break;
      case 'reece':
        products = await this.scrapeReece(urls);
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
    supplier: 'bunnings' | 'tradelink' | 'reece',
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
        case 'tradelink':
          products = await this.scrapeTradelink(batch);
          break;
        case 'reece':
          products = await this.scrapeReece(batch);
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
    firecrawlInstance = new FirecrawlService(apiKey);
  }
  return firecrawlInstance;
}