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
    'LVL Engineered Timber': ['lvl', 'gl15c', 'gl13c', 'gl17c', 'hyspan'],
    'Framing': ['stud', 'plate', 'bearer', 'joist', 'lintel', 'beam'],
    'Cladding': ['weatherboard', 'hardiplank', 'cladding', 'villa', 'linea'],
    'Decking': ['deck', 'decking', 'merbau', 'spotted gum', 'composite'],
    'Sheet Materials': ['plywood', 'mdf', 'particle', 'osb', 'hardboard'],
    'Flooring': ['flooring', 'tongue and groove', 't&g', 'parquet'],
    'Fencing': ['fence', 'paling', 'plinth', 'rail', 'post'],
    'Structural': ['glulam', 'engineered', 'h2', 'h3'],
    'Timber': ['pine', 'radiata', 'treated pine', 'mgp', 'hardwood', 'oak'],
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
    'h2f treated': 'H2F Treated',
    'h2 treated': 'H2 Treated',
    'h1 treated': 'H1 Treated'
  };
  
  // Handle special formatting for structural beams
  const beamMatch = cleaned.match(/(\d+)\s*x\s*(\d+)\s*(H[123])?\s*(GL\d+C?)?\s*(Pine|Timber)?\s*(Beam|Joist|Bearer)?/i);
  if (beamMatch) {
    const parts = [];
    parts.push(`${beamMatch[1]}x${beamMatch[2]}`);
    if (beamMatch[3]) parts.push(beamMatch[3].toUpperCase());
    if (beamMatch[4]) parts.push(beamMatch[4].toUpperCase());
    if (beamMatch[5]) parts.push(beamMatch[5]);
    if (beamMatch[6]) parts.push(beamMatch[6]);
    cleaned = parts.join(' ');
  }
  
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
export function generateSKU(title: string, supplier?: string): string {
  // Try to extract meaningful parts from the title for SKU
  const parts = title.match(/(\d+x\d+|\d+mm)/gi);
  const h2h3 = title.match(/\b(H[123])\b/i);
  const gl = title.match(/\b(GL\d+C?)\b/i);
  
  if (parts || h2h3 || gl) {
    // Build SKU from meaningful parts
    const skuParts = [];
    if (gl) skuParts.push(gl[1].toUpperCase());
    if (parts) skuParts.push(parts[0].toUpperCase());
    if (h2h3) skuParts.push(h2h3[1].toUpperCase());
    
    if (skuParts.length > 0) {
      return skuParts.join('-');
    }
  }
  
  // Fallback to generic SKU
  const cleaned = title.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const hash = cleaned.substring(0, 8);
  const supplierPrefix = supplier ? supplier.substring(0, 3).toUpperCase() : 'GEN';
  return `${supplierPrefix}-${hash}`;
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
  
  const supplierName = getSupplierName(supplier);
  
  return {
    name: cleanProductName(product.title),
    sku: product.metadata.sku || generateSKU(product.title, supplierName),
    supplier: supplierName,
    unit: mapUnit(product.metadata.unit, product.title),
    pricePerUnit: parsePrice(product.price, quantity),
    gstInclusive: true, // Australian suppliers include GST
    category: categorizeProduct(product.title),
    inStock: product.metadata.availability ?? true,
    description: product.metadata.description || null,
    notes: `Imported from ${supplierName} on ${new Date().toLocaleDateString()}`,
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