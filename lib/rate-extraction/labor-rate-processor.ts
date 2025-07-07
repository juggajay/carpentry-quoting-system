import { ExcelProcessor } from './excel-processor';
import { PdfProcessor } from './pdf-processor';
import { RateNormalizer, ExtractedRate, NormalizedRate } from './rate-normalizer';

export interface ProcessingResult {
  success: boolean;
  rates: NormalizedRate[];
  errors: string[];
  stats: {
    totalExtracted: number;
    validRates: number;
    invalidRates: number;
    byCategory: Record<string, number>;
  };
}

export class LaborRateProcessor {
  private excelProcessor: ExcelProcessor;
  private pdfProcessor: PdfProcessor;
  private normalizer: RateNormalizer;

  constructor() {
    this.excelProcessor = new ExcelProcessor();
    this.pdfProcessor = new PdfProcessor();
    this.normalizer = new RateNormalizer();
  }

  async processFile(
    buffer: Buffer,
    fileName: string,
    fileType: 'excel' | 'pdf'
  ): Promise<ProcessingResult> {
    const errors: string[] = [];
    let extractedRates: ExtractedRate[] = [];

    try {
      // Extract rates based on file type
      if (fileType === 'excel') {
        extractedRates = await this.excelProcessor.processFile(buffer, fileName);
      } else if (fileType === 'pdf') {
        extractedRates = await this.pdfProcessor.processFile(buffer, fileName);
      } else {
        throw new Error('Unsupported file type');
      }

      // Normalize and validate rates
      const normalizedRates = this.normalizer.normalize(extractedRates);
      
      // Deduplicate rates
      const deduplicatedRates = this.normalizer.deduplicate(normalizedRates);
      
      // Group by category for stats
      const groupedRates = this.normalizer.groupByCategory(deduplicatedRates);
      
      // Calculate statistics
      const stats = {
        totalExtracted: extractedRates.length,
        validRates: deduplicatedRates.filter(r => r.isValid).length,
        invalidRates: deduplicatedRates.filter(r => !r.isValid).length,
        byCategory: Object.entries(groupedRates).reduce((acc, [category, rates]) => {
          acc[category] = rates.length;
          return acc;
        }, {} as Record<string, number>)
      };

      // Collect validation errors
      deduplicatedRates.forEach(rate => {
        if (!rate.isValid) {
          errors.push(`${rate.activity}: ${rate.validationErrors.join(', ')}`);
        }
      });

      return {
        success: true,
        rates: deduplicatedRates,
        errors,
        stats
      };
    } catch (error) {
      console.error('Error processing file:', error);
      errors.push(error instanceof Error ? error.message : 'Unknown error occurred');
      
      return {
        success: false,
        rates: [],
        errors,
        stats: {
          totalExtracted: 0,
          validRates: 0,
          invalidRates: 0,
          byCategory: {}
        }
      };
    }
  }

  async processMultipleFiles(
    files: Array<{ buffer: Buffer; fileName: string; fileType: 'excel' | 'pdf' }>
  ): Promise<ProcessingResult> {
    const allRates: NormalizedRate[] = [];
    const allErrors: string[] = [];
    let totalExtracted = 0;

    // Process each file
    for (const file of files) {
      const result = await this.processFile(file.buffer, file.fileName, file.fileType);
      
      if (result.success) {
        allRates.push(...result.rates);
        totalExtracted += result.stats.totalExtracted;
      }
      
      allErrors.push(...result.errors);
    }

    // Deduplicate across all files
    const deduplicatedRates = this.normalizer.deduplicate(allRates);
    
    // Group by category
    const groupedRates = this.normalizer.groupByCategory(deduplicatedRates);
    
    // Calculate final statistics
    const stats = {
      totalExtracted,
      validRates: deduplicatedRates.filter(r => r.isValid).length,
      invalidRates: deduplicatedRates.filter(r => !r.isValid).length,
      byCategory: Object.entries(groupedRates).reduce((acc, [category, rates]) => {
        acc[category] = rates.length;
        return acc;
      }, {} as Record<string, number>)
    };

    return {
      success: allErrors.length === 0 || deduplicatedRates.length > 0,
      rates: deduplicatedRates,
      errors: allErrors,
      stats
    };
  }

  filterRatesByConfidence(rates: NormalizedRate[], minConfidence: number = 0.5): NormalizedRate[] {
    return rates.filter(rate => rate.confidence >= minConfidence);
  }

  getRatesByCategory(rates: NormalizedRate[], category: string): NormalizedRate[] {
    return rates.filter(rate => rate.category === category);
  }

  sortRatesByConfidence(rates: NormalizedRate[]): NormalizedRate[] {
    return [...rates].sort((a, b) => b.confidence - a.confidence);
  }

  formatRateForDisplay(rate: NormalizedRate): string {
    const confidencePercent = Math.round(rate.confidence * 100);
    return `${rate.activity} - $${rate.rate}/${rate.unit} (${confidencePercent}% confidence)`;
  }
}