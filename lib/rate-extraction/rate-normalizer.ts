import { Unit } from '@prisma/client';
import { normalizeUnit, categorizeActivity, isReasonableRate } from './rate-patterns';

export interface ExtractedRate {
  activity: string;
  unit: Unit;
  rate: number;
  category: string;
  confidence: number;
  source?: string;
  context?: string;
}

export interface NormalizedRate extends ExtractedRate {
  description?: string;
  isValid: boolean;
  validationErrors: string[];
}

export class RateNormalizer {
  normalize(extractedRates: ExtractedRate[]): NormalizedRate[] {
    return extractedRates.map(rate => this.normalizeRate(rate));
  }

  private normalizeRate(rate: ExtractedRate): NormalizedRate {
    const validationErrors: string[] = [];
    
    // Validate rate value
    if (!isReasonableRate(rate.rate, rate.unit)) {
      validationErrors.push(`Rate $${rate.rate}/${rate.unit} is outside reasonable range`);
    }
    
    // Clean up activity name
    const cleanedActivity = this.cleanActivityName(rate.activity);
    
    // Generate description if not provided
    const description = rate.context || `${cleanedActivity} - ${rate.unit}`;
    
    return {
      ...rate,
      activity: cleanedActivity,
      description,
      isValid: validationErrors.length === 0,
      validationErrors
    };
  }

  private cleanActivityName(activity: string): string {
    return activity
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/^[-•*]\s*/, '') // Remove bullet points
      .replace(/\s*[-–—]\s*$/, '') // Remove trailing dashes
      .replace(/^\d+\.\s*/, '') // Remove numbering
      .replace(/^[A-Z]\.\s*/, '') // Remove letter numbering
      .split(/\s+/)
      .map((word, index) => {
        if (index === 0) {
          return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        }
        return word.toLowerCase();
      })
      .join(' ');
  }

  deduplicate(rates: NormalizedRate[]): NormalizedRate[] {
    const uniqueRates = new Map<string, NormalizedRate>();
    
    rates.forEach(rate => {
      const key = `${rate.activity}-${rate.unit}`;
      const existing = uniqueRates.get(key);
      
      if (!existing || rate.confidence > existing.confidence) {
        uniqueRates.set(key, rate);
      }
    });
    
    return Array.from(uniqueRates.values());
  }

  groupByCategory(rates: NormalizedRate[]): Record<string, NormalizedRate[]> {
    return rates.reduce((grouped, rate) => {
      const category = rate.category || 'general';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(rate);
      return grouped;
    }, {} as Record<string, NormalizedRate[]>);
  }

  calculateCompositeRate(laborDays: number, laborCost: number, quantity: number, unit: Unit): number | null {
    if (quantity <= 0 || laborCost <= 0) {
      return null;
    }

    // Calculate rate per unit
    const ratePerUnit = laborCost / quantity;
    
    // For hourly rates, convert from days if needed
    if (unit === 'HR' && laborDays > 0) {
      // Assume 8 hour work day
      const totalHours = laborDays * 8;
      return laborCost / totalHours;
    }
    
    return ratePerUnit;
  }
}