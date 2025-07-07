import { z } from 'zod';

// Define available scraping sources
export const SCRAPER_SOURCES = {
  bunnings: {
    name: 'Bunnings Warehouse',
    baseUrl: 'https://www.bunnings.com.au',
    searchPath: '/search/products?q=',
    requiresProxy: false,
    selectors: {
      productList: '.product-list article',
      price: '[data-testid="product-price"]',
      title: '[data-testid="product-title"]',
      unit: '.product-price-unit',
    },
  },
  customUrl: {
    name: 'Custom URL',
    baseUrl: '', // User provides
    searchPath: '',
    requiresProxy: false,
    selectors: {
      // User can configure these
      productList: '',
      price: '',
      title: '',
      unit: '',
    },
  },
};

export type ScraperSource = keyof typeof SCRAPER_SOURCES;

// Configuration schema
export const ScraperConfigSchema = z.object({
  source: z.enum(['bunnings', 'customUrl']),
  customUrl: z.string().optional(),
  customSelectors: z.object({
    productList: z.string(),
    price: z.string(),
    title: z.string(),
    unit: z.string(),
  }).optional(),
  materials: z.array(z.string()).optional(), // Specific materials to search for
});

export type ScraperConfig = z.infer<typeof ScraperConfigSchema>;