export interface MaterialPrice {
  material: string;
  price: number;
  unit: string;
  supplier: string;
  lastUpdated: Date;
  inStock: boolean;
  sourceUrl?: string;
}