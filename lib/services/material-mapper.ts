interface FirecrawlProduct {
  title: string;
  price: string;
  url: string;
  metadata: {
    sku?: string;
    availability?: boolean;
    unit?: string;
    description?: string;
  };
}

export interface Material {
  id: string;
  name: string;
  description: string | null;
  sku: string | null;
  supplier: string | null;
  unit: string;
  pricePerUnit: number;
  gstInclusive: boolean;
  category: string | null;
  inStock: boolean;
  notes: string | null;
  userId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Parse price and normalize to per unit
export function parsePrice(price: string | number | undefined, quantity: number = 1): number {
  if (!price && price !== 0) return 0;
  
  const priceStr = typeof price === 'number' ? price.toString() : price;
  const basePrice = parseFloat(priceStr.replace(/[$,]/g, ''));
  
  if (isNaN(basePrice)) return 0;
  
  return Number((basePrice / quantity).toFixed(2));
}

// Extract quantity from product titles
export function extractQuantityFromTitle(title: string): number {
  // Match patterns like "2.4m", "3.6m", "4.8m", "5.4 metres"
  const patterns = [
    /(\d+\.?\d*)\s*m(?:etres?)?/i,  // Matches m or metres
    /(\d+\.?\d*)\s*(?:length|lng)/i, // Matches length
    /(\d+\.?\d*)\s*(?:pack|pk)/i     // Matches pack sizes
  ];
  
  for (const pattern of patterns) {
    const match = title.match(pattern);
    if (match) return parseFloat(match[1]);
  }
  return 1; // Default to 1 if no quantity found
}

// Map supplier units to your database units
export function mapUnit(supplierUnit: string | undefined, title: string): string {
  if (!supplierUnit) {
    // Infer from title if no unit provided
    if (title.toLowerCase().includes('sheet')) return 'EA';
    if (title.toLowerCase().includes('sqm') || title.toLowerCase().includes('m²')) return 'SQM';
    if (title.toLowerCase().includes('pack')) return 'PACK';
    return 'LM'; // Default for timber
  }
  
  const unitMap: Record<string, string> = {
    'length': 'LM',
    'lineal metre': 'LM',
    'linear metre': 'LM',
    'metre': 'LM',
    'm': 'LM',
    'each': 'EA',
    'sheet': 'EA',
    'piece': 'EA',
    'square metre': 'SQM',
    'sqm': 'SQM',
    'm²': 'SQM',
    'pack': 'PACK',
    'bundle': 'PACK',
    'bag': 'BAG',
    'litre': 'L',
    'kilogram': 'KG',
    'kg': 'KG'
  };
  
  return unitMap[supplierUnit.toLowerCase()] || 'EA';
}

// Categorize products based on title/description
export function categorizeProduct(title: string): string {
  const categories: Record<string, string[]> = {
    'Framing': ['stud', 'plate', 'bearer', 'joist', 'lintel', 'beam'],
    'Cladding': ['weatherboard', 'hardiplank', 'cladding', 'villa', 'linea'],
    'Decking': ['deck', 'decking', 'merbau', 'spotted gum', 'composite'],
    'Sheet Materials': ['plywood', 'mdf', 'particle', 'osb', 'hardboard'],
    'Flooring': ['flooring', 'tongue and groove', 't&g', 'parquet'],
    'Fencing': ['fence', 'paling', 'plinth', 'rail', 'post'],
    'Structural': ['lvl', 'glulam', 'engineered', 'hyspan', 'h2', 'h3'],
    'Pine': ['pine', 'radiata', 'treated pine', 'mgp'],
    'Hardwood': ['hardwood', 'oak', 'blackbutt', 'jarrah', 'ironbark'],
    'Mouldings': ['moulding', 'architrave', 'skirting', 'scotia', 'quad'],
    'Hardware': ['screw', 'nail', 'bolt', 'bracket', 'joist hanger'],
    'Insulation': ['insulation', 'batts', 'glasswool', 'polyester'],
    'Concrete': ['concrete', 'cement', 'sand', 'aggregate', 'mesh']
  };
  
  const lowerTitle = title.toLowerCase();
  
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => lowerTitle.includes(keyword))) {
      return category;
    }
  }
  
  return 'Other';
}

// Clean product names
export function cleanProductName(title: string): string {
  // Remove common suffixes and clean up
  let cleaned = title
    .replace(/\s*-\s*\d+\.?\d*\s*m(?:etres?)?\s*$/i, '') // Remove length suffixes
    .replace(/\s*\([^)]*\)\s*$/g, '') // Remove content in parentheses at end
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();
  
  // Standardize common terms
  const replacements: Record<string, string> = {
    'treated radiata pine': 'Treated Pine',
    'rad pine': 'Radiata Pine',
    'struct pine': 'Structural Pine',
    'h3 treated': 'H3 Treated',
    'h2f treated': 'H2F Treated'
  };
  
  const lowerCleaned = cleaned.toLowerCase();
  for (const [find, replace] of Object.entries(replacements)) {
    if (lowerCleaned.includes(find)) {
      const regex = new RegExp(find, 'gi');
      cleaned = cleaned.replace(regex, replace);
    }
  }
  
  return cleaned;
}

// Generate SKU if not provided
export function generateSKU(title: string): string {
  const cleaned = title.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const hash = cleaned.substring(0, 8);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `GEN-${hash}-${random}`;
}

// Map supplier codes to proper names
function getSupplierName(supplier: string): string {
  const supplierMap: Record<string, string> = {
    'bunnings': 'Bunnings',
    'blacktown': 'Blacktown Building Supplies',
    'canterbury': 'Canterbury Timbers',
    'custom': 'Custom Supplier'
  };
  return supplierMap[supplier.toLowerCase()] || supplier;
}

export function transformToMaterial(
  product: FirecrawlProduct, 
  supplier: string,
  userId?: string
): Partial<Material> {
  const quantity = extractQuantityFromTitle(product.title);
  
  return {
    name: cleanProductName(product.title),
    sku: product.metadata.sku || generateSKU(product.title),
    supplier: getSupplierName(supplier),
    unit: mapUnit(product.metadata.unit, product.title),
    pricePerUnit: parsePrice(product.price, quantity),
    gstInclusive: true, // Australian suppliers include GST
    category: categorizeProduct(product.title),
    inStock: product.metadata.availability ?? true,
    description: product.metadata.description || null,
    notes: `Imported from ${getSupplierName(supplier)} on ${new Date().toLocaleDateString()}`,
    userId: userId || null,
  };
}

// Batch transformation with validation
export function transformBatch(
  products: FirecrawlProduct[], 
  supplier: string,
  userId?: string
): Partial<Material>[] {
  return products
    .map(product => {
      try {
        const material = transformToMaterial(product, supplier, userId);
        // Validate required fields
        if (!material.name || material.pricePerUnit === 0) {
          console.warn('Invalid product data:', product);
          return null;
        }
        return material;
      } catch (error) {
        console.error('Error transforming product:', error, product);
        return null;
      }
    })
    .filter((material): material is Partial<Material> => material !== null);
}

// Deduplicate materials by SKU
export function deduplicateMaterials(materials: Partial<Material>[]): Partial<Material>[] {
  const seen = new Map<string, Partial<Material>>();
  
  for (const material of materials) {
    const key = material.sku || material.name;
    if (!key) continue;
    
    const existing = seen.get(key);
    if (!existing || (material.updatedAt && existing.updatedAt && 
        material.updatedAt > existing.updatedAt)) {
      seen.set(key, material);
    }
  }
  
  return Array.from(seen.values());
}