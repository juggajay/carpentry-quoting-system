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
  
  blacktown: {
    name: 'Blacktown Building Supplies',
    baseUrl: 'https://blacktownbuildingsupplies.com.au',
    categories: {
      timber: {
        name: 'Timber',
        path: '/product-category/timber/',
        subcategories: {
          structural: '/product-category/timber/structural-timber/',
          treated: '/product-category/timber/treated-pine/',
          hardwood: '/product-category/timber/hardwood/',
          mouldings: '/product-category/timber/mouldings/',
        },
      },
      hardware: {
        name: 'Hardware',
        path: '/product-category/hardware/',
        subcategories: {
          fasteners: '/product-category/hardware/fasteners/',
          tools: '/product-category/hardware/tools/',
          safety: '/product-category/hardware/safety/',
        },
      },
      building_materials: {
        name: 'Building Materials',
        path: '/product-category/building-materials/',
        subcategories: {
          insulation: '/product-category/building-materials/insulation/',
          plasterboard: '/product-category/building-materials/plasterboard/',
          cement: '/product-category/building-materials/cement-products/',
        },
      },
      tools: {
        name: 'Tools',
        path: '/product-category/tools/',
        subcategories: {
          power_tools: '/product-category/tools/power-tools/',
          hand_tools: '/product-category/tools/hand-tools/',
          accessories: '/product-category/tools/accessories/',
        },
      },
    },
    selectors: {
      products: '.product, .product-item',
      name: '.product-title, .woocommerce-loop-product__title',
      price: '.price, .amount',
      sku: '.sku, .product-sku',
      unit: '.product-unit, .unit',
      stock: '.stock, .in-stock',
      image: '.product-image img, .attachment-woocommerce_thumbnail',
      description: '.product-description, .woocommerce-product-details__short-description',
    },
    priceFormat: {
      currency: '$',
      decimal: '.',
      thousands: ',',
    },
  },
  
  canterbury: {
    name: 'Canterbury Timbers',
    baseUrl: 'https://www.canterburytimbers.com.au',
    categories: {
      timber: {
        name: 'All Timber',
        path: '/collections/timber-all',
        subcategories: {
          decking: '/collections/decking',
          flooring: '/collections/flooring',
          structural: '/collections/structural-timber',
        },
      },
    },
    selectors: {
      products: '.m-product-item',
      name: '.m-product-card__name, .m-product-card__title',
      price: '.m-price-item--sale, .m-price-item--regular, .m-price-item',
      sku: '.m-product-card__vendor',
      unit: '.m-product-card__unit',
      stock: '.m-product-card__availability',
      image: '.m-product-card__media img',
      description: '.m-product-card__description',
    },
    priceFormat: {
      currency: '$',
      decimal: '.',
      thousands: ',',
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