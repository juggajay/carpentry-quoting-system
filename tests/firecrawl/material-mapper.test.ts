import { describe, it, expect } from 'vitest';
import {
  parsePrice,
  extractQuantityFromTitle,
  mapUnit,
  categorizeProduct,
  cleanProductName,
  generateSKU,
  transformToMaterial,
} from '@/lib/services/material-mapper';

describe('Material Mapper Tests', () => {
  describe('parsePrice', () => {
    it('should parse basic prices', () => {
      expect(parsePrice('$10.50')).toBe(10.50);
      expect(parsePrice('$1,250.00')).toBe(1250.00);
      expect(parsePrice('25.99')).toBe(25.99);
    });

    it('should handle price per quantity', () => {
      expect(parsePrice('$24.00', 2.4)).toBe(10.00);
      expect(parsePrice('$36.00', 3)).toBe(12.00);
    });

    it('should handle invalid prices', () => {
      expect(parsePrice('invalid')).toBe(0);
      expect(parsePrice('')).toBe(0);
    });
  });

  describe('extractQuantityFromTitle', () => {
    it('should extract metre quantities', () => {
      expect(extractQuantityFromTitle('Pine Stud 70x35mm - 2.4m')).toBe(2.4);
      expect(extractQuantityFromTitle('Treated Pine 90x45 3.6 metres')).toBe(3.6);
      expect(extractQuantityFromTitle('Hardwood Decking 5.4m Length')).toBe(5.4);
    });

    it('should extract pack quantities', () => {
      expect(extractQuantityFromTitle('Screws 8g x 50mm (100 pack)')).toBe(100);
      expect(extractQuantityFromTitle('Nails 75mm 2.5kg pk')).toBe(2.5);
    });

    it('should return 1 for no quantity', () => {
      expect(extractQuantityFromTitle('Standard Pine Board')).toBe(1);
      expect(extractQuantityFromTitle('Plywood Sheet')).toBe(1);
    });
  });

  describe('mapUnit', () => {
    it('should map supplier units correctly', () => {
      expect(mapUnit('lineal metre', '')).toBe('LM');
      expect(mapUnit('each', '')).toBe('EA');
      expect(mapUnit('square metre', '')).toBe('SQM');
      expect(mapUnit('kg', '')).toBe('KG');
      expect(mapUnit('pack', '')).toBe('PACK');
    });

    it('should infer unit from title when not provided', () => {
      expect(mapUnit(undefined, 'Plywood Sheet 2400x1200')).toBe('EA');
      expect(mapUnit(undefined, 'Carpet 4m x 3m (12 sqm)')).toBe('SQM');
      expect(mapUnit(undefined, 'Screws 100 pack')).toBe('PACK');
      expect(mapUnit(undefined, 'Pine Stud 2.4m')).toBe('LM');
    });
  });

  describe('categorizeProduct', () => {
    it('should categorize timber products', () => {
      expect(categorizeProduct('Pine Stud 70x35mm')).toBe('Pine');
      expect(categorizeProduct('H3 Treated Pine Post')).toBe('Structural');
      expect(categorizeProduct('Merbau Decking 90x19mm')).toBe('Decking');
      expect(categorizeProduct('Structural Plywood 17mm')).toBe('Sheet Materials');
    });

    it('should categorize hardware products', () => {
      expect(categorizeProduct('Galvanised Screws 8g x 50mm')).toBe('Hardware');
      expect(categorizeProduct('Joist Hanger 90x45')).toBe('Hardware');
      expect(categorizeProduct('Hex Bolt M12 x 100mm')).toBe('Hardware');
    });

    it('should categorize plumbing products', () => {
      expect(categorizeProduct('Copper Pipe 15mm x 3m')).toBe('Plumbing');
      expect(categorizeProduct('Ball Valve 20mm')).toBe('Plumbing');
      expect(categorizeProduct('PVC Drain 90mm')).toBe('Plumbing');
    });

    it('should return Other for unknown products', () => {
      expect(categorizeProduct('Random Product Name')).toBe('Other');
    });
  });

  describe('cleanProductName', () => {
    it('should remove length suffixes', () => {
      expect(cleanProductName('Pine Stud 70x35 - 2.4m')).toBe('Pine Stud 70x35');
      expect(cleanProductName('Treated Pine 90x45 3.6 metres')).toBe('Treated Pine 90x45');
    });

    it('should standardize common terms', () => {
      expect(cleanProductName('H3 TREATED PINE POST')).toBe('H3 Treated PINE POST');
      expect(cleanProductName('rad pine stud')).toBe('Radiata Pine stud');
    });

    it('should clean up spacing', () => {
      expect(cleanProductName('Pine   Stud    70x35')).toBe('Pine Stud 70x35');
    });
  });

  describe('generateSKU', () => {
    it('should generate valid SKUs', () => {
      const sku = generateSKU('Pine Stud 70x35');
      expect(sku).toMatch(/^GEN-[A-Z0-9]{8}-[A-Z0-9]{4}$/);
    });

    it('should handle special characters', () => {
      const sku = generateSKU('Pine/Stud (70x35)');
      expect(sku).toMatch(/^GEN-PINESTUD70-[A-Z0-9]{4}$/);
    });
  });

  describe('transformToMaterial', () => {
    it('should transform product correctly', () => {
      const product = {
        title: 'Pine Stud 70x35mm - 2.4m',
        price: '$24.00',
        url: 'https://example.com/product',
        metadata: {
          sku: 'PS7035-24',
          availability: true,
          unit: 'length',
          description: 'Structural pine stud',
        },
      };

      const material = transformToMaterial(product, 'Bunnings', 'user123');

      expect(material.name).toBe('Pine Stud 70x35mm');
      expect(material.sku).toBe('PS7035-24');
      expect(material.supplier).toBe('Bunnings');
      expect(material.unit).toBe('LM');
      expect(material.pricePerUnit).toBe(10.00); // $24 / 2.4m
      expect(material.gstInclusive).toBe(true);
      expect(material.category).toBe('Pine');
      expect(material.inStock).toBe(true);
      expect(material.userId).toBe('user123');
    });

    it('should handle missing metadata', () => {
      const product = {
        title: 'Basic Product',
        price: '$50.00',
        url: '',
        metadata: {},
      };

      const material = transformToMaterial(product, 'Supplier');

      expect(material.name).toBe('Basic Product');
      expect(material.sku).toMatch(/^GEN-/);
      expect(material.pricePerUnit).toBe(50.00);
      expect(material.unit).toBe('LM');
      expect(material.inStock).toBe(true);
    });
  });
});