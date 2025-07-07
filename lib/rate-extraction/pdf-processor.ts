import pdfParse from 'pdf-parse';
import { Unit } from '@prisma/client';
import { ExtractedRate } from './rate-normalizer';
import { RATE_PATTERNS, normalizeUnit, categorizeActivity } from './rate-patterns';

interface RateContext {
  before: string;
  match: string;
  after: string;
  fullLine: string;
}

export class PdfProcessor {
  async processFile(buffer: Buffer, fileName: string): Promise<ExtractedRate[]> {
    try {
      const pdfData = await pdfParse(buffer);
      const text = pdfData.text;
      
      return this.extractRatesFromText(text, fileName);
    } catch (error) {
      console.error('Error processing PDF file:', error);
      throw new Error('Failed to process PDF file');
    }
  }

  private extractRatesFromText(text: string, fileName: string): ExtractedRate[] {
    const extractedRates: ExtractedRate[] = [];
    const lines = text.split('\n');
    
    // Process each line
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Try each rate pattern
      for (const [patternName, pattern] of Object.entries(RATE_PATTERNS)) {
        const matches = [...line.matchAll(pattern)];
        
        for (const match of matches) {
          const rate = parseFloat(match[1]);
          const context = this.extractContext(lines, i, match);
          const activity = this.extractActivity(context);
          
          if (activity && rate > 0) {
            const unit = this.getUnitFromPattern(patternName);
            
            extractedRates.push({
              activity,
              unit: unit as Unit,
              rate,
              category: categorizeActivity(activity),
              confidence: this.calculateConfidence(context, patternName),
              source: fileName,
              context: context.fullLine
            });
          }
        }
      }
      
      // Also look for structured rate tables
      const tableRates = this.extractFromRateTable(lines, i, fileName);
      extractedRates.push(...tableRates);
    }
    
    // Look for labor sections
    const laborSectionRates = this.extractFromLaborSections(text, fileName);
    extractedRates.push(...laborSectionRates);
    
    return extractedRates;
  }

  private extractContext(lines: string[], lineIndex: number, match: RegExpMatchArray): RateContext {
    const line = lines[lineIndex];
    const matchIndex = match.index || 0;
    
    return {
      before: line.substring(0, matchIndex).trim(),
      match: match[0],
      after: line.substring(matchIndex + match[0].length).trim(),
      fullLine: line.trim()
    };
  }

  private extractActivity(context: RateContext): string {
    // Try to extract activity from before the rate
    if (context.before) {
      // Remove common prefixes
      const cleaned = context.before
        .replace(/^[-•*]\s*/, '')
        .replace(/^\d+\.\s*/, '')
        .replace(/^[A-Z]\.\s*/, '')
        .trim();
      
      if (cleaned.length > 3) {
        return cleaned;
      }
    }
    
    // Try after the rate
    if (context.after) {
      const cleaned = context.after
        .replace(/^for\s+/, '')
        .replace(/^-\s*/, '')
        .trim();
      
      if (cleaned.length > 3) {
        return cleaned;
      }
    }
    
    // Use full line as last resort
    return context.fullLine
      .replace(context.match, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private extractFromRateTable(lines: string[], startIndex: number, fileName: string): ExtractedRate[] {
    const rates: ExtractedRate[] = [];
    const line = lines[startIndex];
    
    // Check if this looks like a table header
    if (!this.isTableHeader(line)) {
      return rates;
    }
    
    // Extract column positions
    const columns = this.identifyColumns(line);
    
    // Process subsequent rows
    for (let i = startIndex + 1; i < Math.min(startIndex + 20, lines.length); i++) {
      const row = lines[i];
      
      // Stop if we hit an empty line or new section
      if (!row.trim() || this.isNewSection(row)) {
        break;
      }
      
      const extractedRow = this.extractTableRow(row, columns, fileName);
      if (extractedRow) {
        rates.push(extractedRow);
      }
    }
    
    return rates;
  }

  private extractFromLaborSections(text: string, fileName: string): ExtractedRate[] {
    const rates: ExtractedRate[] = [];
    
    // Find labor sections
    const laborSectionPattern = /(?:labor|labour|carpenter|trade\s*rates?|hourly\s*rates?|daily\s*rates?)[:\s]*\n([^]+?)(?:\n\n|\n(?:total|subtotal|materials))/gi;
    const sections = [...text.matchAll(laborSectionPattern)];
    
    for (const section of sections) {
      const sectionText = section[1];
      const sectionRates = this.extractRatesFromText(sectionText, fileName);
      
      // Boost confidence for rates found in dedicated sections
      sectionRates.forEach(rate => {
        rate.confidence = Math.min(rate.confidence * 1.2, 1.0);
      });
      
      rates.push(...sectionRates);
    }
    
    return rates;
  }

  private isTableHeader(line: string): boolean {
    const headerKeywords = ['description', 'rate', 'price', 'cost', 'activity', 'item', 'labor', 'labour'];
    const lineLower = line.toLowerCase();
    
    return headerKeywords.filter(keyword => lineLower.includes(keyword)).length >= 2;
  }

  private identifyColumns(headerLine: string): { activity: number; rate: number; unit?: number } | null {
    const lineLower = headerLine.toLowerCase();
    
    // Simple column identification based on keywords
    const activityIndex = Math.max(
      lineLower.indexOf('description'),
      lineLower.indexOf('activity'),
      lineLower.indexOf('item')
    );
    
    const rateIndex = Math.max(
      lineLower.indexOf('rate'),
      lineLower.indexOf('price'),
      lineLower.indexOf('cost')
    );
    
    const unitIndex = lineLower.indexOf('unit');
    
    if (activityIndex >= 0 && rateIndex >= 0) {
      return {
        activity: activityIndex,
        rate: rateIndex,
        unit: unitIndex >= 0 ? unitIndex : undefined
      };
    }
    
    return null;
  }

  private extractTableRow(row: string, columns: any, fileName: string): ExtractedRate | null {
    if (!columns) return null;
    
    // Try to extract based on column positions
    const parts = row.split(/\s{2,}|\t/); // Split by multiple spaces or tabs
    
    if (parts.length < 2) return null;
    
    const activity = parts[0]?.trim();
    let rateStr = '';
    let unit = 'EA';
    
    // Find the rate value
    for (let i = 1; i < parts.length; i++) {
      const part = parts[i];
      const rateMatch = part.match(/\$?(\d+(?:\.\d{2})?)/);
      
      if (rateMatch) {
        rateStr = rateMatch[1];
        
        // Check for unit in the same part
        const unitMatch = part.match(/\/\s*([a-zA-Z]+)/);
        if (unitMatch) {
          unit = normalizeUnit(unitMatch[1]);
        }
        break;
      }
    }
    
    if (activity && rateStr) {
      const rate = parseFloat(rateStr);
      
      if (rate > 0) {
        return {
          activity,
          unit: unit as Unit,
          rate,
          category: categorizeActivity(activity),
          confidence: 0.8,
          source: fileName,
          context: row.trim()
        };
      }
    }
    
    return null;
  }

  private isNewSection(line: string): boolean {
    const sectionKeywords = ['total', 'subtotal', 'materials', 'summary', 'notes', 'conditions'];
    const lineLower = line.toLowerCase();
    
    return sectionKeywords.some(keyword => lineLower.startsWith(keyword));
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

  private calculateConfidence(context: RateContext, patternName: string): number {
    let confidence = 0.5; // Base confidence
    
    // Boost confidence based on context quality
    if (context.before.length > 10) confidence += 0.1;
    if (context.before.match(/^[A-Z]/)) confidence += 0.1; // Starts with capital
    if (!context.before.match(/[^a-zA-Z0-9\s-]/)) confidence += 0.1; // No special chars
    
    // Pattern-specific boosts
    if (patternName === 'hourlyRate' && context.before.toLowerCase().includes('hour')) {
      confidence += 0.2;
    }
    if (patternName === 'dailyRate' && context.before.toLowerCase().includes('day')) {
      confidence += 0.2;
    }
    
    // Check for labor-related keywords
    const laborKeywords = ['carpenter', 'labor', 'labour', 'installation', 'framing', 'fitting'];
    if (laborKeywords.some(keyword => context.fullLine.toLowerCase().includes(keyword))) {
      confidence += 0.1;
    }
    
    return Math.min(confidence, 1.0);
  }
}