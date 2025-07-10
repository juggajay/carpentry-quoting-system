import { OpenAI } from 'openai';

export interface DrawingAnalysisResult {
  pageAnalyses: PageAnalysis[];
  extractedElements: ExtractedElement[];
  measurements: Measurement[];
  rooms: Room[];
  overallSummary: string;
  confidence: number;
}

export interface PageAnalysis {
  pageNumber: number;
  drawingType: string;
  scale: string;
  title: string;
  elements: ExtractedElement[];
  measurements: Measurement[];
  imageData?: string; // Base64 encoded image
}

export interface ExtractedElement {
  type: 'wall' | 'door' | 'window' | 'fixture' | 'dimension' | 'text' | 'symbol';
  description: string;
  location?: { x: number; y: number };
  size?: { width: number; height: number };
  quantity: number;
  confidence: number;
}

export interface Measurement {
  type: 'linear' | 'area' | 'angle';
  value: number;
  unit: string;
  description: string;
  elements: string[]; // Related elements
}

export interface Room {
  name: string;
  area: number;
  perimeter: number;
  elements: ExtractedElement[];
}

export class DrawingAnalyzer {
  private openai: OpenAI;
  
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async analyzeDrawing(_pdfBuffer: Buffer): Promise<DrawingAnalysisResult> {
    try {
      // Convert PDF pages to images
      const pageImages = await this.extractImagesFromPDF(_pdfBuffer);
      
      // Analyze each page
      const pageAnalyses: PageAnalysis[] = [];
      
      for (let i = 0; i < pageImages.length; i++) {
        const analysis = await this.analyzePageWithVision(pageImages[i], i + 1);
        pageAnalyses.push(analysis);
      }
      
      // Aggregate results
      const result = this.aggregateAnalyses(pageAnalyses);
      
      return result;
    } catch (error) {
      console.error('Error analyzing drawing:', error);
      throw error;
    }
  }

  private async extractImagesFromPDF(pdfBuffer: Buffer): Promise<string[]> {
    // This is a placeholder - in production, you'd use pdf.js or similar
    // to convert PDF pages to images
    console.log('Extracting images from PDF...');
    
    // For now, return empty array
    // In real implementation, this would convert each PDF page to a base64 image
    return [];
  }

  private async analyzePageWithVision(imageBase64: string, pageNumber: number): Promise<PageAnalysis> {
    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4-vision-preview",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this architectural drawing and extract:
                1. Drawing type (floor plan, elevation, section, detail)
                2. Scale (e.g., 1:100, 1:50)
                3. All visible dimensions with measurements
                4. Building elements (walls, doors, windows, fixtures)
                5. Room names and areas if visible
                6. Any text annotations
                
                Provide the response in JSON format with:
                - drawingType: string
                - scale: string
                - title: string
                - elements: array of {type, description, quantity}
                - measurements: array of {type, value, unit, description}
                - rooms: array of {name, area}
                - annotations: array of strings`
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`
                }
              }
            ]
          }
        ],
        max_tokens: 4096
      });

      const content = response.choices[0].message.content;
      const analysisData = JSON.parse(content || '{}');

      return {
        pageNumber,
        drawingType: analysisData.drawingType || 'unknown',
        scale: analysisData.scale || 'unknown',
        title: analysisData.title || `Page ${pageNumber}`,
        elements: this.convertElements(analysisData.elements || []),
        measurements: this.convertMeasurements(analysisData.measurements || []),
        imageData: imageBase64
      };
    } catch (error) {
      console.error(`Error analyzing page ${pageNumber}:`, error);
      return {
        pageNumber,
        drawingType: 'unknown',
        scale: 'unknown',
        title: `Page ${pageNumber}`,
        elements: [],
        measurements: []
      };
    }
  }

  private convertElements(rawElements: any[]): ExtractedElement[] {
    return rawElements.map(elem => ({
      type: this.mapElementType(elem.type),
      description: elem.description || elem.type,
      quantity: elem.quantity || 1,
      confidence: 0.8 // Default confidence
    }));
  }

  private mapElementType(type: string): ExtractedElement['type'] {
    const typeMap: Record<string, ExtractedElement['type']> = {
      'wall': 'wall',
      'door': 'door',
      'window': 'window',
      'fixture': 'fixture',
      'dimension': 'dimension',
      'text': 'text',
      'symbol': 'symbol'
    };
    return typeMap[type.toLowerCase()] || 'symbol';
  }

  private convertMeasurements(rawMeasurements: any[]): Measurement[] {
    return rawMeasurements.map(m => ({
      type: m.type || 'linear',
      value: parseFloat(m.value) || 0,
      unit: m.unit || 'mm',
      description: m.description || '',
      elements: m.elements || []
    }));
  }

  private aggregateAnalyses(pageAnalyses: PageAnalysis[]): DrawingAnalysisResult {
    const allElements: ExtractedElement[] = [];
    const allMeasurements: Measurement[] = [];
    const rooms: Room[] = [];
    
    // Aggregate from all pages
    pageAnalyses.forEach(page => {
      allElements.push(...page.elements);
      allMeasurements.push(...page.measurements);
    });
    
    // Group elements by type and deduplicate
    const elementGroups = this.groupAndDeduplicateElements(allElements);
    
    // Calculate overall summary
    const summary = this.generateSummary(pageAnalyses, elementGroups);
    
    return {
      pageAnalyses,
      extractedElements: elementGroups,
      measurements: allMeasurements,
      rooms,
      overallSummary: summary,
      confidence: this.calculateOverallConfidence(pageAnalyses)
    };
  }

  private groupAndDeduplicateElements(elements: ExtractedElement[]): ExtractedElement[] {
    const grouped = new Map<string, ExtractedElement>();
    
    elements.forEach(elem => {
      const key = `${elem.type}-${elem.description}`;
      if (grouped.has(key)) {
        const existing = grouped.get(key)!;
        existing.quantity += elem.quantity;
      } else {
        grouped.set(key, { ...elem });
      }
    });
    
    return Array.from(grouped.values());
  }

  private generateSummary(pageAnalyses: PageAnalysis[], elements: ExtractedElement[]): string {
    const drawingTypes = [...new Set(pageAnalyses.map(p => p.drawingType))];
    const elementCounts = elements.reduce((acc, elem) => {
      acc[elem.type] = (acc[elem.type] || 0) + elem.quantity;
      return acc;
    }, {} as Record<string, number>);
    
    let summary = `Analyzed ${pageAnalyses.length} drawing page(s).\n`;
    summary += `Drawing types: ${drawingTypes.join(', ')}\n`;
    summary += `Elements found:\n`;
    
    Object.entries(elementCounts).forEach(([type, count]) => {
      summary += `- ${type}: ${count}\n`;
    });
    
    return summary;
  }

  private calculateOverallConfidence(pageAnalyses: PageAnalysis[]): number {
    if (pageAnalyses.length === 0) return 0;
    
    const totalElements = pageAnalyses.reduce((sum, page) => 
      sum + page.elements.length + page.measurements.length, 0
    );
    
    // Basic confidence calculation
    if (totalElements > 50) return 0.9;
    if (totalElements > 20) return 0.8;
    if (totalElements > 10) return 0.7;
    if (totalElements > 5) return 0.6;
    return 0.5;
  }
}

// Enhanced text-based analysis for when vision API is not available
export function enhancedTextAnalysis(pdfText: string): Partial<DrawingAnalysisResult> {
  const elements: ExtractedElement[] = [];
  const measurements: Measurement[] = [];
  
  // Extract dimensions (e.g., "3000", "2400x1200", "3.6m")
  const dimensionPatterns = [
    /(\d+)\s*x\s*(\d+)/gi,  // 3000 x 2400
    /(\d+(?:\.\d+)?)\s*m/gi, // 3.6m
    /(\d+)\s*mm/gi,          // 3000mm
    /(\d+)Ø/gi,              // 100Ø (diameter)
  ];
  
  dimensionPatterns.forEach(pattern => {
    const matches = pdfText.matchAll(pattern);
    for (const match of matches) {
      measurements.push({
        type: 'linear',
        value: parseFloat(match[1]),
        unit: match[0].includes('m') && !match[0].includes('mm') ? 'm' : 'mm',
        description: match[0],
        elements: []
      });
    }
  });
  
  // Extract room names
  const roomPatterns = [
    /(?:BEDROOM|BED)\s*\d*/gi,
    /(?:BATHROOM|BATH|WC|TOILET)/gi,
    /(?:KITCHEN|KIT)/gi,
    /(?:LIVING|LOUNGE|FAMILY)/gi,
    /(?:DINING|DIN)/gi,
    /(?:GARAGE|GAR)/gi,
    /(?:LAUNDRY|LNDY)/gi,
    /(?:ENTRY|FOYER)/gi,
    /(?:CORRIDOR|HALL)/gi,
  ];
  
  const rooms: Room[] = [];
  roomPatterns.forEach(pattern => {
    const matches = pdfText.matchAll(pattern);
    for (const match of matches) {
      rooms.push({
        name: match[0],
        area: 0, // Would need to extract from nearby text
        perimeter: 0,
        elements: []
      });
    }
  });
  
  // Extract elements
  const elementPatterns = {
    door: /(?:DOOR|DR|D\d+)/gi,
    window: /(?:WINDOW|WIN|W\d+)/gi,
    wall: /(?:WALL|PARTITION)/gi,
  };
  
  Object.entries(elementPatterns).forEach(([type, pattern]) => {
    const matches = pdfText.matchAll(pattern);
    for (const match of matches) {
      elements.push({
        type: type as any,
        description: match[0],
        quantity: 1,
        confidence: 0.6
      });
    }
  });
  
  return {
    extractedElements: elements,
    measurements,
    rooms,
    overallSummary: `Text analysis found ${elements.length} elements, ${measurements.length} measurements, ${rooms.length} rooms`,
    confidence: 0.5
  };
}

export const drawingAnalyzer = new DrawingAnalyzer();