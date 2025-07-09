export interface SupplierCategory {
  name: string;
  path: string;
  subcategories?: Record<string, string>;
}

export interface SupplierSelectors {
  products: string;
  name: string;
  price: string;
  sku?: string;
  unit?: string;
  stock?: string;
  category?: string;
  description?: string;
  image?: string;
}

export interface SupplierConfig {
  name: string;
  baseUrl: string;
  categories: Record<string, SupplierCategory>;
  selectors: SupplierSelectors;
  priceFormat?: {
    currency?: string;
    decimal?: string;
    thousands?: string;
  };
  pagination?: {
    nextButton?: string;
    pageParam?: string;
    maxPages?: number;
  };
}

export const supplierConfigs: Record<string, SupplierConfig> = {
  bunnings: {
    name: 'Bunnings',
    baseUrl: 'https://www.bunnings.com.au',
    categories: {
      timber: {
        name: 'Timber',
        path: '/building-hardware/timber',
        subcategories: {
          structural: '/building-hardware/timber/structural-timber',
          treated: '/building-hardware/timber/treated-pine',
          hardwood: '/building-hardware/timber/hardwood-timber',
          mouldings: '/building-hardware/timber/mouldings',
          sheets: '/building-hardware/timber/sheet-materials',
        },
      },
      hardware: {
        name: 'Hardware',
        path: '/building-hardware/screws-fasteners-hardware',
        subcategories: {
          screws: '/building-hardware/screws-fasteners-hardware/screws',
          nails: '/building-hardware/screws-fasteners-hardware/nails',
          bolts: '/building-hardware/screws-fasteners-hardware/bolts',
          brackets: '/building-hardware/screws-fasteners-hardware/brackets',
        },
      },
      concrete: {
        name: 'Concrete',
        path: '/building-hardware/cement-concrete',
        subcategories: {
          cement: '/building-hardware/cement-concrete/cement',
          premix: '/building-hardware/cement-concrete/premix-concrete',
          sand: '/building-hardware/cement-concrete/sand',
        },
      },
      plumbing: {
        name: 'Plumbing',
        path: '/bathroom-plumbing/plumbing',
        subcategories: {
          pipes: '/bathroom-plumbing/plumbing/pipe-fittings',
          copper: '/bathroom-plumbing/plumbing/copper-fittings',
          pvc: '/bathroom-plumbing/plumbing/pvc-pipe-fittings',
        },
      },
    },
    selectors: {
      products: '[data-locator="product-card"]',
      name: '[data-locator="product-title"]',
      price: '[data-price]',
      sku: '[data-locator="product-code"]',
      unit: '.price-unit',
      stock: '[data-locator="product-availability"]',
      image: '[data-locator="product-image"] img',
      description: '[data-locator="product-description"]',
    },
    priceFormat: {
      currency: '$',
      decimal: '.',
      thousands: ',',
    },
    pagination: {
      nextButton: '[data-locator="pagination-next"]',
      pageParam: 'page',
      maxPages: 10,
    },
  },
  
  tradelink: {
    name: 'Tradelink',
    baseUrl: 'https://www.tradelink.com.au',
    categories: {
      plumbing: {
        name: 'Plumbing Supplies',
        path: '/products/plumbing-supplies',
        subcategories: {
          valves: '/products/plumbing-supplies/valves',
          tapware: '/products/plumbing-supplies/tapware',
          drainage: '/products/plumbing-supplies/drainage',
        },
      },
      bathroom: {
        name: 'Bathroom',
        path: '/products/bathroom',
        subcategories: {
          toilets: '/products/bathroom/toilets',
          basins: '/products/bathroom/basins',
          showers: '/products/bathroom/showers',
        },
      },
      hot_water: {
        name: 'Hot Water',
        path: '/products/hot-water',
        subcategories: {
          systems: '/products/hot-water/hot-water-systems',
          accessories: '/products/hot-water/hot-water-accessories',
        },
      },
    },
    selectors: {
      products: '.product-item',
      name: '.product-item__title',
      price: '.product-item__price-value',
      sku: '.product-item__code',
      unit: '.product-item__unit',
      stock: '.product-item__stock-status',
      category: '.breadcrumb__item--current',
    },
    priceFormat: {
      currency: '$',
      decimal: '.',
      thousands: ',',
    },
  },
  
  reece: {
    name: 'Reece',
    baseUrl: 'https://www.reece.com.au',
    categories: {
      plumbing: {
        name: 'Plumbing',
        path: '/plumbing/c/c1',
        subcategories: {
          pipework: '/plumbing/pipework/c/c1_1',
          valves: '/plumbing/valves-actuators/c/c1_2',
          tools: '/plumbing/plumbing-tools/c/c1_3',
        },
      },
      bathroom: {
        name: 'Bathroom',
        path: '/bathroom/c/c2',
        subcategories: {
          toilets: '/bathroom/toilets/c/c2_1',
          tapware: '/bathroom/tapware/c/c2_2',
          vanities: '/bathroom/vanities/c/c2_3',
        },
      },
      hvac: {
        name: 'HVAC-R',
        path: '/hvac-r/c/c3',
        subcategories: {
          heating: '/hvac-r/heating/c/c3_1',
          cooling: '/hvac-r/cooling/c/c3_2',
          ventilation: '/hvac-r/ventilation/c/c3_3',
        },
      },
    },
    selectors: {
      products: '[data-testid="product-card"]',
      name: '[data-testid="product-card-title"]',
      price: '[data-testid="product-card-price"]',
      sku: '[data-testid="product-card-sku"]',
      unit: '[data-testid="product-card-unit"]',
      stock: '[data-testid="product-card-availability"]',
      image: '[data-testid="product-card-image"] img',
    },
    priceFormat: {
      currency: '$',
      decimal: '.',
      thousands: ',',
    },
    pagination: {
      nextButton: '[data-testid="pagination-next"]',
      pageParam: 'page',
      maxPages: 20,
    },
  },
};

// Helper functions for supplier configurations
export function getSupplierConfig(supplier: string): SupplierConfig | null {
  return supplierConfigs[supplier.toLowerCase()] || null;
}

export function getCategoryUrls(
  supplier: string, 
  category?: string,
  includeSubcategories = true
): string[] {
  const config = getSupplierConfig(supplier);
  if (!config) return [];

  const urls: string[] = [];
  const baseUrl = config.baseUrl;

  if (!category) {
    // Return all category URLs
    Object.values(config.categories).forEach(cat => {
      urls.push(baseUrl + cat.path);
      if (includeSubcategories && cat.subcategories) {
        Object.values(cat.subcategories).forEach(subPath => {
          urls.push(baseUrl + subPath);
        });
      }
    });
  } else {
    // Return specific category URLs
    const categoryConfig = config.categories[category.toLowerCase()];
    if (categoryConfig) {
      urls.push(baseUrl + categoryConfig.path);
      if (includeSubcategories && categoryConfig.subcategories) {
        Object.values(categoryConfig.subcategories).forEach(subPath => {
          urls.push(baseUrl + subPath);
        });
      }
    }
  }

  return urls;
}

export function getAllSuppliers(): string[] {
  return Object.keys(supplierConfigs);
}

export function getSupplierCategories(supplier: string): string[] {
  const config = getSupplierConfig(supplier);
  return config ? Object.keys(config.categories) : [];
}