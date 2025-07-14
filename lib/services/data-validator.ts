import DOMPurify from 'isomorphic-dompurify';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitized?: any;
}

export class DataValidator {
  /**
   * Validate and sanitize material data before database insertion
   */
  static validateMaterial(data: any): ValidationResult {
    const errors: string[] = [];
    const sanitized: any = {};

    // Required fields
    if (!data.name || typeof data.name !== 'string') {
      errors.push('Name is required and must be a string');
    } else {
      sanitized.name = this.sanitizeString(data.name, 255);
    }

    if (!data.supplier || typeof data.supplier !== 'string') {
      errors.push('Supplier is required and must be a string');
    } else {
      sanitized.supplier = this.sanitizeString(data.supplier, 100);
    }

    if (!data.unit || typeof data.unit !== 'string') {
      errors.push('Unit is required and must be a string');
    } else {
      const validUnits = ['EA', 'LM', 'SQM', 'KG', 'L', 'PACK', 'BOX', 'ROLL', 'SHEET', 'BAG', 'HR', 'DAY'];
      sanitized.unit = data.unit.toUpperCase();
      if (!validUnits.includes(sanitized.unit)) {
        errors.push(`Invalid unit. Must be one of: ${validUnits.join(', ')}`);
      }
    }

    // Price validation
    if (data.pricePerUnit === undefined || data.pricePerUnit === null) {
      errors.push('Price per unit is required');
    } else {
      const price = parseFloat(data.pricePerUnit);
      if (isNaN(price) || price < 0) {
        errors.push('Price must be a positive number');
      } else if (price > 999999.99) {
        errors.push('Price exceeds maximum allowed value');
      } else {
        sanitized.pricePerUnit = Math.round(price * 100) / 100; // Round to 2 decimals
      }
    }

    // Optional fields
    if (data.description) {
      sanitized.description = this.sanitizeHTML(data.description, 1000);
    }

    if (data.sku) {
      sanitized.sku = this.sanitizeSKU(data.sku);
    }

    if (data.category) {
      sanitized.category = this.sanitizeString(data.category, 50);
    }

    if (data.notes) {
      sanitized.notes = this.sanitizeString(data.notes, 500);
    }

    // Boolean fields
    sanitized.gstInclusive = Boolean(data.gstInclusive);
    sanitized.inStock = Boolean(data.inStock);

    return {
      isValid: errors.length === 0,
      errors,
      sanitized: errors.length === 0 ? sanitized : undefined,
    };
  }

  /**
   * Sanitize a string by removing dangerous characters and limiting length
   */
  static sanitizeString(input: string, maxLength: number): string {
    if (!input) return '';
    
    // Remove control characters and trim
    let sanitized = input
      .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Remove control characters
      .trim();

    // Limit length
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }

    return sanitized;
  }

  /**
   * Sanitize HTML content to prevent XSS
   */
  static sanitizeHTML(input: string, maxLength: number): string {
    if (!input) return '';

    // Use DOMPurify to clean HTML
    const cleaned = DOMPurify.sanitize(input, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br', 'p'],
      ALLOWED_ATTR: [],
    });

    return this.sanitizeString(cleaned, maxLength);
  }

  /**
   * Sanitize SKU to ensure it's safe for database storage
   */
  static sanitizeSKU(sku: string): string {
    if (!sku) return '';
    
    // Allow only alphanumeric, hyphens, and underscores
    return sku
      .replace(/[^a-zA-Z0-9\-_]/g, '')
      .substring(0, 100);
  }

  /**
   * Validate batch of materials
   */
  static validateBatch(materials: any[]): {
    valid: any[];
    invalid: Array<{ data: any; errors: string[] }>;
  } {
    const valid: any[] = [];
    const invalid: Array<{ data: any; errors: string[] }> = [];

    for (const material of materials) {
      const result = this.validateMaterial(material);
      if (result.isValid && result.sanitized) {
        valid.push(result.sanitized);
      } else {
        invalid.push({ data: material, errors: result.errors });
      }
    }

    return { valid, invalid };
  }

  /**
   * Validate URL for safety
   */
  static isValidUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      // Only allow http and https protocols
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  }

  /**
   * Validate supplier name against whitelist
   */
  static isValidSupplier(supplier: string): boolean {
    const validSuppliers = ['bunnings', 'blacktown', 'canterbury', 'custom'];
    return validSuppliers.includes(supplier.toLowerCase());
  }
}