import { Unit, ItemType } from '@prisma/client';

export interface Material {
  id: string;
  name: string;
  description?: string;
  sku?: string;
  unit: Unit;
  pricePerUnit: number;
  category?: string;
  supplier?: string;
  inStock?: boolean;
}

export interface LaborRate {
  id: string;
  title: string;
  level?: string;
  baseRate: number;
  loadedRate: number;
  saturdayRate?: number;
  sundayRate?: number;
  effectiveDate: Date;
}

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unit: Unit;
  unitPrice: number;
  total: number;
  itemType: ItemType;
  materialId?: string;
  laborRateId?: string;
}

export interface LineItemUpdate {
  description?: string;
  quantity?: number;
  unit?: Unit;
  unitPrice?: number;
  total?: number;
  itemType?: ItemType;
  materialId?: string;
  laborRateId?: string;
}