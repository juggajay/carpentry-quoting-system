import * as XLSX from 'xlsx';
import { Unit } from '@prisma/client';
import { ExtractedRate, RateNormalizer } from './rate-normalizer';
import { normalizeUnit, categorizeActivity, RATE_PATTERNS } from './rate-patterns';

type CellValue = string | number | boolean | null | undefined;

interface LaborEntry {
  activity: string;
  days: number;
  rate?: number;
  total?: number;
}

interface MaterialEntry {
  description: string;
  quantity: number;
  unit: string;
}

export class ExcelProcessor {
  private normalizer: RateNormalizer;

  constructor() {
    this.normalizer = new RateNormalizer();
  }

  async processFile(buffer: Buffer, fileName: string): Promise<ExtractedRate[]> {
    try {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const extractedRates: ExtractedRate[] = [];

      // Process each sheet
      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const sheetRates = this.processSheet(sheet, sheetName, fileName);
        extractedRates.push(...sheetRates);
      }

      return extractedRates;
    } catch (error) {
      console.error('Error processing Excel file:', error);
      throw new Error('Failed to process Excel file');
    }
  }

  private processSheet(sheet: XLSX.WorkSheet, sheetName: string, fileName: string): ExtractedRate[] {
    const extractedRates: ExtractedRate[] = [];
    
    // Convert sheet to JSON - header: 1 returns array of arrays
    const data = XLSX.utils.sheet_to_json<CellValue[]>(sheet, { 
      header: 1, 
      raw: false,
      defval: ''
    }) as CellValue[][];

    // Look for different extraction patterns
    const tradeBreakupRates = this.extractFromTradeBreakup(data, sheetName, fileName);
    const directRates = this.extractDirectRates(data, sheetName, fileName);
    const laborSectionRates = this.extractFromLaborSection(data, sheetName, fileName);

    extractedRates.push(...tradeBreakupRates, ...directRates, ...laborSectionRates);

    return extractedRates;
  }

  private extractFromTradeBreakup(data: CellValue[][], sheetName: string, fileName: string): ExtractedRate[] {
    const rates: ExtractedRate[] = [];
    let inTradeBreakup = false;
    const laborEntries: LaborEntry[] = [];
    const materialQuantities: Map<string, MaterialEntry> = new Map();

    // First pass: collect material quantities
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length === 0) continue;

      // Look for material sections
      if (this.isMaterialRow(row)) {
        const material = this.extractMaterialInfo(row);
        if (material) {
          materialQuantities.set(material.description.toLowerCase(), material);
        }
      }
    }

    // Second pass: extract labor information
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length === 0) continue;

      const firstCell = String(row[0] || '').toLowerCase();
      
      // Check if we're in trade breakup section
      if (firstCell.includes('trade breakup') || firstCell.includes('carpentry labour')) {
        inTradeBreakup = true;
        continue;
      }

      // Exit trade breakup on new section
      if (inTradeBreakup && this.isNewSection(firstCell)) {
        inTradeBreakup = false;
      }

      // Extract labor entries
      if (inTradeBreakup) {
        const laborEntry = this.extractLaborEntry(row);
        if (laborEntry) {
          laborEntries.push(laborEntry);
        }
      }
    }

    // Calculate composite rates
    for (const labor of laborEntries) {
      // Try to match with material quantities
      const matchedMaterial = this.findMatchingMaterial(labor.activity, materialQuantities);
      
      if (matchedMaterial && labor.total) {
        const unit = normalizeUnit(matchedMaterial.unit) as Unit;
        const rate = this.normalizer.calculateCompositeRate(
          labor.days,
          labor.total,
          matchedMaterial.quantity,
          unit
        );

        if (rate) {
          rates.push({
            activity: labor.activity,
            unit,
            rate,
            category: categorizeActivity(labor.activity),
            confidence: 0.8,
            source: fileName,
            context: `From ${sheetName} - ${labor.days} days for ${matchedMaterial.quantity} ${matchedMaterial.unit}`
          });
        }
      }

      // Also extract hourly rate if available
      if (labor.rate) {
        rates.push({
          activity: `${labor.activity} - Hourly`,
          unit: 'HR' as Unit,
          rate: labor.rate,
          category: categorizeActivity(labor.activity),
          confidence: 0.9,
          source: fileName,
          context: `From ${sheetName} - Direct hourly rate`
        });
      }
    }

    return rates;
  }

  private extractDirectRates(data: CellValue[][], sheetName: string, fileName: string): ExtractedRate[] {
    const rates: ExtractedRate[] = [];
    
    for (const row of data) {
      if (!row || row.length === 0) continue;

      const rowText = row.join(' ');
      
      // Try each rate pattern
      for (const [patternName, pattern] of Object.entries(RATE_PATTERNS)) {
        const matches = [...rowText.matchAll(pattern)];
        
        for (const match of matches) {
          const rate = parseFloat(match[1]);
          const activity = this.extractActivityFromRow(row, match.index || 0);
          
          if (activity && rate > 0) {
            const unit = this.getUnitFromPattern(patternName);
            
            rates.push({
              activity,
              unit: unit as Unit,
              rate,
              category: categorizeActivity(activity),
              confidence: 0.7,
              source: fileName,
              context: `From ${sheetName} - Direct rate extraction`
            });
          }
        }
      }
    }

    return rates;
  }

  private extractFromLaborSection(data: CellValue[][], sheetName: string, fileName: string): ExtractedRate[] {
    const rates: ExtractedRate[] = [];
    let inLaborSection = false;

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length === 0) continue;

      const firstCell = String(row[0] || '').toLowerCase();
      
      // Check for labor section headers
      if (firstCell.includes('labor') || firstCell.includes('labour') || 
          firstCell.includes('carpenter') || firstCell.includes('rates')) {
        inLaborSection = true;
        continue;
      }

      if (inLaborSection && this.isNewSection(firstCell)) {
        inLaborSection = false;
      }

      if (inLaborSection) {
        // Look for rate patterns in the row
        for (let j = 0; j < row.length; j++) {
          const cell = String(row[j] || '');
          const rateMatch = cell.match(/\$?(\d+(?:\.\d{2})?)/);
          
          if (rateMatch && j > 0) {
            const rate = parseFloat(rateMatch[1]);
            const activity = String(row[0] || '').trim();
            
            if (activity && rate > 0 && rate < 1000) { // Reasonable rate check
              // Determine unit from context
              const unit = this.determineUnitFromContext(row, j);
              
              rates.push({
                activity,
                unit: unit as Unit,
                rate,
                category: categorizeActivity(activity),
                confidence: 0.6,
                source: fileName,
                context: `From ${sheetName} - Labor section`
              });
            }
          }
        }
      }
    }

    return rates;
  }

  private isMaterialRow(row: CellValue[]): boolean {
    const desc = String(row[0] || '').toLowerCase();
    const hasQuantity = row.some((cell, index) => {
      if (index === 0) return false;
      const val = String(cell || '');
      return !isNaN(parseFloat(val)) && parseFloat(val) > 0;
    });
    
    return hasQuantity && !desc.includes('labor') && !desc.includes('labour');
  }

  private extractMaterialInfo(row: CellValue[]): MaterialEntry | null {
    const description = String(row[0] || '').trim();
    
    // Look for quantity and unit in subsequent cells
    for (let i = 1; i < row.length; i++) {
      const cell = String(row[i] || '');
      const quantityMatch = cell.match(/^(\d+(?:\.\d+)?)\s*([a-zA-Z]+)?/);
      
      if (quantityMatch) {
        const quantity = parseFloat(quantityMatch[1]);
        const unit = quantityMatch[2] || this.findUnitInRow(row, i);
        
        if (quantity > 0 && unit) {
          return { description, quantity, unit };
        }
      }
    }
    
    return null;
  }

  private extractLaborEntry(row: CellValue[]): LaborEntry | null {
    const activity = String(row[0] || '').trim();
    if (!activity || activity.length < 3) return null;

    let days = 0;
    let rate = 0;
    let total = 0;

    // Look for days, rate, and total in the row
    for (let i = 1; i < row.length; i++) {
      const cell = String(row[i] || '').toLowerCase();
      const numericValue = parseFloat(cell.replace(/[$,]/g, ''));
      
      if (cell.includes('day') && !isNaN(numericValue)) {
        days = numericValue;
      } else if (cell.includes('rate') && !isNaN(numericValue)) {
        rate = numericValue;
      } else if (!isNaN(numericValue) && numericValue > 100) {
        // Likely a total if it's a larger number
        total = numericValue;
      }
    }

    if (days > 0 || rate > 0 || total > 0) {
      return { activity, days, rate, total };
    }

    return null;
  }

  private findMatchingMaterial(activity: string, materials: Map<string, MaterialEntry>): MaterialEntry | null {
    const activityLower = activity.toLowerCase();
    
    // Direct match
    if (materials.has(activityLower)) {
      return materials.get(activityLower)!;
    }

    // Partial match
    for (const [desc, material] of materials) {
      if (activityLower.includes(desc) || desc.includes(activityLower)) {
        return material;
      }
    }

    // Keyword match
    const keywords = activityLower.split(/\s+/);
    for (const [desc, material] of materials) {
      if (keywords.some(keyword => desc.includes(keyword))) {
        return material;
      }
    }

    return null;
  }

  private isNewSection(text: string): boolean {
    const sectionKeywords = ['total', 'subtotal', 'materials', 'summary', 'notes'];
    return sectionKeywords.some(keyword => text.includes(keyword));
  }

  private extractActivityFromRow(row: CellValue[], rateIndex: number): string {
    // Look for activity description before the rate
    for (let i = 0; i < Math.min(rateIndex, row.length); i++) {
      const cell = String(row[i] || '').trim();
      if (cell && cell.length > 3 && !cell.match(/^\d+$/)) {
        return cell;
      }
    }
    return '';
  }

  private getUnitFromPattern(patternName: string): string {
    const unitMap: Record<string, string> = {
      hourlyRate: 'HR',
      dailyRate: 'DAY',
      squareMeter: 'SQM',
      linearMeter: 'LM',
      eachRate: 'EA'
    };
    return unitMap[patternName] || 'EA';
  }

  private determineUnitFromContext(row: CellValue[], valueIndex: number): string {
    // Check cells around the value for unit indicators
    for (let i = Math.max(0, valueIndex - 2); i < Math.min(row.length, valueIndex + 2); i++) {
      const cell = String(row[i] || '').toLowerCase();
      
      if (cell.includes('hour') || cell.includes('hr')) return 'HR';
      if (cell.includes('day')) return 'DAY';
      if (cell.includes('m2') || cell.includes('sqm')) return 'SQM';
      if (cell.includes('lm') || cell.includes('linear')) return 'LM';
      if (cell.includes('each') || cell.includes('ea')) return 'EA';
    }
    
    return 'EA'; // Default
  }

  private findUnitInRow(row: CellValue[], startIndex: number): string {
    for (let i = startIndex; i < Math.min(row.length, startIndex + 3); i++) {
      const cell = String(row[i] || '').toLowerCase();
      
      if (cell.includes('m2') || cell.includes('m²')) return 'm2';
      if (cell.includes('lm')) return 'lm';
      if (cell.includes('ea') || cell.includes('each')) return 'ea';
      if (cell.includes('no')) return 'no';
    }
    
    return 'ea'; // Default
  }
}