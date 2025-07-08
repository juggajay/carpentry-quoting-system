import * as cheerio from 'cheerio';
import { SCRAPER_SOURCES, ScraperConfig } from './scraper-config';
import { MaterialPrice } from './index';

export class MaterialWebScraper {
  private config: ScraperConfig;

  constructor(config: ScraperConfig) {
    this.config = config;
  }

  // Expose the source configuration
  public getSourceConfig() {
    return this.getSource();
  }

  // New method to parse HTML without fetching
  public async parseHtml(html: string, searchTerm: string, source: { 
    name: string;
    baseUrl: string;
    searchPath: string;
    selectors: {
      productList: string;
      price: string;
      title: string;
      unit: string;
    };
  }): Promise<MaterialPrice[]> {
    const results: MaterialPrice[] = [];
    const $ = cheerio.load(html);
    
    // Extract products using the selectors
    const products = $(source.selectors.productList);
    
    if (products.length === 0) {
      console.log(`No products found for "${searchTerm}"`);
      return results;
    }
    
    // Take first 3 results max per search term
    products.slice(0, 3).each((i, el) => {
      try {
        const $el = $(el);
        const priceText = $el.find(source.selectors.price).text().trim();
        const title = $el.find(source.selectors.title).text().trim();
        const unitText = $el.find(source.selectors.unit).text().trim();
        
        // Parse price - remove currency symbols and non-numeric chars
        const price = this.parsePrice(priceText);
        if (!price || !title) return;
        
        results.push({
          material: title,
          price: price,
          unit: this.normalizeUnit(unitText),
          supplier: source.name || 'Unknown',
          lastUpdated: new Date(),
          inStock: true,
          sourceUrl: source.baseUrl || ''
        });
      } catch (error) {
        console.error('Error parsing product:', error);
      }
    });

    return results;
  }

  // Expose mock prices for fallback
  public async getMockPrices(searchTerms: string[]): Promise<MaterialPrice[]> {
    const results: MaterialPrice[] = [];
    for (const term of searchTerms) {
      const mockPrice = this.getMockPrice(term);
      if (mockPrice) {
        results.push(mockPrice);
      }
    }
    return results;
  }

  async scrapePrices(searchTerms: string[]): Promise<MaterialPrice[]> {
    const results: MaterialPrice[] = [];
    const source = this.getSource();

    for (const term of searchTerms) {
      try {
        const url = `${source.baseUrl}${source.searchPath}${encodeURIComponent(term)}`;
        
        // Fetch the HTML
        const response = await fetch(url);
        if (!response.ok) {
          console.error(`Failed to fetch ${url}: ${response.status}`);
          continue;
        }
        
        const html = await response.text();
        const $ = cheerio.load(html);
        
        // Extract products using the selectors
        const products = $(source.selectors.productList);
        
        if (products.length === 0) {
          console.log(`No products found for "${term}"`);
          // Fall back to mock data for testing
          const mockPrice = this.getMockPrice(term);
          if (mockPrice) {
            results.push(mockPrice);
          }
          continue;
        }
        
        // Take first 3 results max per search term
        products.slice(0, 3).each((i, el) => {
          try {
            const $el = $(el);
            const priceText = $el.find(source.selectors.price).text().trim();
            const title = $el.find(source.selectors.title).text().trim();
            const unitText = $el.find(source.selectors.unit).text().trim();
            
            // Parse price - remove currency symbols and non-numeric chars
            const price = this.parsePrice(priceText);
            if (!price || !title) return;
            
            results.push({
              material: title,
              price: price,
              unit: this.normalizeUnit(unitText),
              supplier: source.name,
              lastUpdated: new Date(),
              inStock: true,
              sourceUrl: url
            });
          } catch (error) {
            console.error('Error parsing product:', error);
          }
        });
      } catch (error) {
        console.error(`Error scraping ${term}:`, error);
        // Fall back to mock data on error
        const mockPrice = this.getMockPrice(term);
        if (mockPrice) {
          results.push(mockPrice);
        }
      }
    }

    return results;
  }

  private getSource() {
    if (this.config.source === 'customUrl') {
      return {
        name: 'Custom Supplier',
        baseUrl: this.config.customUrl || '',
        searchPath: '',
        selectors: this.config.customSelectors || SCRAPER_SOURCES.customUrl.selectors,
      };
    }
    return {
      ...SCRAPER_SOURCES[this.config.source],
      name: SCRAPER_SOURCES[this.config.source].name
    };
  }

  private parsePrice(priceText: string): number | null {
    // Remove currency symbols and extract number
    const cleanPrice = priceText.replace(/[^0-9.]/g, '');
    const price = parseFloat(cleanPrice);
    return isNaN(price) ? null : price;
  }

  private normalizeUnit(unitText: string): string {
    const unit = unitText.toLowerCase().trim();
    
    // Map common unit variations
    if (unit.includes('each') || unit === 'ea') return 'EA';
    if (unit.includes('meter') || unit.includes('metre') || unit === 'm') return 'LM';
    if (unit.includes('sheet')) return 'EA';
    if (unit.includes('pack')) return 'PACK';
    if (unit.includes('kg')) return 'KG';
    if (unit.includes('litre') || unit === 'l') return 'L';
    
    // Default to EA if unclear
    return 'EA';
  }

  // Temporary mock data for testing when scraping fails
  private getMockPrice(searchTerm: string): MaterialPrice | null {
    const mockPrices: Record<string, { price: number; unit: string; material: string }> = {
      '90x45 pine': { price: 8.50, unit: 'LM', material: '90x45 Pine Framing Timber' },
      '90x35 pine': { price: 6.80, unit: 'LM', material: '90x35 Pine Framing Timber' },
      'plywood': { price: 45.90, unit: 'EA', material: '12mm Structural Plywood Sheet 2400x1200' },
      '12mm plywood': { price: 45.90, unit: 'EA', material: '12mm Structural Plywood Sheet 2400x1200' },
      'mdf': { price: 38.90, unit: 'EA', material: '16mm MDF Sheet 2400x1200' },
      '16mm mdf': { price: 38.90, unit: 'EA', material: '16mm MDF Sheet 2400x1200' },
      'liquid nails': { price: 12.50, unit: 'EA', material: 'Liquid Nails 320g Construction Adhesive' },
      'screws': { price: 18.90, unit: 'PACK', material: 'Timber Screws 8g x 50mm (500 Pack)' },
      'timber screws': { price: 18.90, unit: 'PACK', material: 'Timber Screws 8g x 50mm (500 Pack)' },
      'nails': { price: 15.40, unit: 'PACK', material: 'Bullet Head Nails 75mm (1kg)' },
      'pine': { price: 8.50, unit: 'LM', material: '90x45 Pine Framing Timber' },
      'cement': { price: 9.90, unit: 'EA', material: 'General Purpose Cement 20kg' },
      'insulation': { price: 32.50, unit: 'PACK', material: 'R2.0 Wall Insulation Batts' },
      'paint': { price: 68.90, unit: 'EA', material: 'Interior Paint Low Sheen 4L White' },
    };

    const key = searchTerm.toLowerCase();
    
    // Try exact match first
    if (mockPrices[key]) {
      return {
        material: mockPrices[key].material,
        price: mockPrices[key].price,
        unit: mockPrices[key].unit,
        supplier: 'Bunnings Warehouse (Mock Data)',
        lastUpdated: new Date(),
        inStock: true,
      };
    }
    
    // Try partial match
    const found = Object.keys(mockPrices).find(k => key.includes(k) || k.includes(key));
    
    if (found) {
      return {
        material: mockPrices[found].material,
        price: mockPrices[found].price,
        unit: mockPrices[found].unit,
        supplier: 'Bunnings Warehouse (Mock Data)',
        lastUpdated: new Date(),
        inStock: true,
      };
    }
    
    // Return a generic result if no match
    return {
      material: `${searchTerm} - Generic Material`,
      price: 25.00,
      unit: 'EA',
      supplier: 'Bunnings Warehouse (Mock Data)',
      lastUpdated: new Date(),
      inStock: true,
    };
  }
}