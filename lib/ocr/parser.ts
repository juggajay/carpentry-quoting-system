interface ParsedLineItem {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
}

interface ParseResult {
  items: ParsedLineItem[];
  confidence: number;
  metadata: {
    totalAmount?: number;
    dateFound?: string;
    companyName?: string;
  };
}

export class QuoteParser {
  private static readonly PRICE_REGEX = /\$?\d{1,3}(?:,\d{3})*(?:\.\d{2})?/g;
  private static readonly QUANTITY_REGEX = /\b(\d+(?:\.\d+)?)\s*(pcs?|pieces?|sheets?|units?|ea|each|ft|feet|lbs?|pounds?|kg|kilograms?|m|meters?|sqft|sf)\b/gi;
  private static readonly DATE_REGEX = /\b(\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|\d{4}[-/]\d{1,2}[-/]\d{1,2}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4})\b/gi;

  static parse(text: string): ParseResult {
    const lines = text.split('\n').filter(line => line.trim());
    const items: ParsedLineItem[] = [];
    let totalConfidence = 0;
    let itemCount = 0;

    // Extract metadata
    const metadata: ParseResult['metadata'] = {};
    
    // Find dates
    const dateMatches = text.match(this.DATE_REGEX);
    if (dateMatches && dateMatches.length > 0) {
      metadata.dateFound = dateMatches[0];
    }

    // Find total amount (usually the largest price)
    const priceMatches = text.match(this.PRICE_REGEX) || [];
    const prices = priceMatches.map(p => parseFloat(p.replace(/[$,]/g, '')));
    if (prices.length > 0) {
      metadata.totalAmount = Math.max(...prices);
    }

    // Process each line for potential line items
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const item = this.parseLineItem(line, lines, i);
      
      if (item) {
        items.push(item);
        totalConfidence += item.confidence || 0.8;
        itemCount++;
      }
    }

    const averageConfidence = itemCount > 0 ? totalConfidence / itemCount : 0.5;

    return {
      items,
      confidence: averageConfidence,
      metadata,
    };
  }

  private static parseLineItem(
    line: string,
    allLines: string[],
    currentIndex: number
  ): (ParsedLineItem & { confidence?: number }) | null {
    // Skip lines that are too short or don't contain relevant info
    if (line.length < 10) return null;

    // Extract quantity and unit
    const quantityMatch = line.match(this.QUANTITY_REGEX);
    let quantity = 1;
    let unit = "each";
    
    if (quantityMatch) {
      quantity = parseFloat(quantityMatch[1]);
      unit = quantityMatch[2].toLowerCase();
    }

    // Extract prices (unit price and total)
    const priceMatches = line.match(this.PRICE_REGEX) || [];
    const prices = priceMatches.map(p => parseFloat(p.replace(/[$,]/g, '')));
    
    if (prices.length < 1) {
      // Check next line for prices
      if (currentIndex + 1 < allLines.length) {
        const nextLine = allLines[currentIndex + 1];
        const nextPrices = (nextLine.match(this.PRICE_REGEX) || [])
          .map(p => parseFloat(p.replace(/[$,]/g, '')));
        prices.push(...nextPrices);
      }
    }

    if (prices.length === 0) return null;

    // Determine unit price and total
    let unitPrice = 0;
    let total = 0;

    if (prices.length === 1) {
      // Only one price found, assume it's the total
      total = prices[0];
      unitPrice = quantity > 0 ? total / quantity : total;
    } else if (prices.length >= 2) {
      // Multiple prices, try to determine which is unit and which is total
      // Usually, the larger value is the total
      const sorted = prices.sort((a, b) => a - b);
      unitPrice = sorted[0];
      total = sorted[sorted.length - 1];
      
      // Verify the math makes sense
      const calculatedTotal = unitPrice * quantity;
      if (Math.abs(calculatedTotal - total) > 0.01) {
        // Math doesn't add up, adjust
        if (Math.abs(calculatedTotal - sorted[1]) < 0.01) {
          total = sorted[1];
        }
      }
    }

    // Extract description (remove quantity, unit, and prices from line)
    let description = line;
    
    // Remove quantity and unit
    if (quantityMatch) {
      description = description.replace(quantityMatch[0], '');
    }
    
    // Remove prices
    priceMatches.forEach(price => {
      description = description.replace(price, '');
    });
    
    // Clean up description
    description = description
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s-]/g, '')
      .trim();

    if (!description || description.length < 3) return null;

    return {
      description,
      quantity,
      unit,
      unitPrice,
      total,
      confidence: this.calculateConfidence(description, prices.length),
    };
  }

  private static calculateConfidence(description: string, priceCount: number): number {
    let confidence = 0.5;

    // Increase confidence based on description quality
    if (description.length > 10) confidence += 0.2;
    if (description.split(' ').length > 1) confidence += 0.1;
    
    // Increase confidence if we found multiple prices
    if (priceCount >= 2) confidence += 0.2;

    return Math.min(confidence, 0.95);
  }

  static normalizeUnit(unit: string): string {
    const unitMap: { [key: string]: string } = {
      'pc': 'pieces',
      'pcs': 'pieces',
      'piece': 'pieces',
      'ea': 'each',
      'ft': 'feet',
      'foot': 'feet',
      'lb': 'pounds',
      'lbs': 'pounds',
      'kg': 'kilograms',
      'm': 'meters',
      'meter': 'meters',
      'sf': 'sqft',
      'sheet': 'sheets',
    };

    const normalized = unit.toLowerCase();
    return unitMap[normalized] || normalized;
  }
}