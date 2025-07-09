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
    
    for (const url of urls) {
      try {
        await this.delay(this.rateLimitDelay);
        
        const result = await errorHandler.withRetry(
          async () => {
            const res = await this.firecrawl.scrapeUrl(url, {
              formats: ['html', 'markdown'],
              waitFor: 3000,
              onlyMainContent: false,
            });
            
            if (!res.success || (!res.html && !res.markdown)) {
              throw new Error(`Failed to scrape ${url}: No content returned`);
            }
            
            return res;
          },
          { supplier: config.name, url }
        );

        // Try HTML parsing first, fallback to markdown
        let parsedProducts: ScrapedProduct[] = [];
        if (result.html) {
          parsedProducts = this.parseProducts(result.html, config);
        }
        
        // If no products found with HTML, try markdown parsing
        if (parsedProducts.length === 0 && result.markdown) {
          console.log(`No products found with HTML, trying markdown for ${url}`);
          parsedProducts = this.parseProductsFromMarkdown(result.markdown, config);
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

  private parseProductsFromMarkdown(markdown: string, _config: SupplierConfig): ScrapedProduct[] {
    const products: ScrapedProduct[] = [];
    
    try {
      // Split markdown into sections and look for product patterns
      const lines = markdown.split('\n');
      let currentProduct: Partial<ScrapedProduct> = {};
      
      for (const line of lines) {
        // Look for price patterns
        const priceMatch = line.match(/\$\s?([\d,]+\.?\d*)/);
        if (priceMatch) {
          const price = this.parsePrice(priceMatch[0]);
          if (price > 0 && currentProduct.name) {
            currentProduct.price = price;
          }
        }
        
        // Look for product names (usually in headers or bold)
        if (line.match(/^#{1,3}\s/) || line.match(/^\*\*.*\*\*$/)) {
          if (currentProduct.name && currentProduct.price) {
            products.push({
              name: currentProduct.name,
              price: currentProduct.price,
              unit: currentProduct.unit || 'EA',
              inStock: currentProduct.inStock ?? true,
              description: currentProduct.description,
              category: currentProduct.category,
              sku: currentProduct.sku,
            });
          }
          currentProduct = {
            name: line.replace(/^#{1,3}\s/, '').replace(/\*\*/g, '').trim()
          };
        }
        
        // Look for SKU patterns
        const skuMatch = line.match(/SKU:?\s*([A-Z0-9\-]+)/i);
        if (skuMatch) {
          currentProduct.sku = skuMatch[1];
        }
      }
      
      // Don't forget the last product
      if (currentProduct.name && currentProduct.price) {
        products.push({
          name: currentProduct.name,
          price: currentProduct.price,
          unit: currentProduct.unit || 'EA',
          inStock: currentProduct.inStock ?? true,
          description: currentProduct.description,
          category: currentProduct.category,
          sku: currentProduct.sku,
        });
      }
    } catch (error) {
      console.error('Error parsing markdown:', error);
    }
    
    console.log(`Parsed ${products.length} products from markdown`);
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
    firecrawlInstance = new FirecrawlService(apiKey);
  }
  return firecrawlInstance;
}