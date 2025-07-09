import fs from 'fs/promises';
import path from 'path';
import * as XLSX from 'xlsx';

export interface ParsedFileContent {
  text: string;
  type: string;
  metadata?: {
    pages?: number;
    sheets?: string[];
    rows?: number;
    scale?: string;
    drawing_type?: 'floor_plan' | 'elevation' | 'section' | 'detail' | 'site_plan' | 'unknown';
    dimensions_found?: number;
    elements_detected?: string[];
  };
}

/**
 * Parse various file types and extract text content
 */
export async function parseFile(filePath: string): Promise<ParsedFileContent> {
  const ext = path.extname(filePath).toLowerCase();
  
  try {
    switch (ext) {
      case '.pdf':
        return await parsePDF(filePath);
      
      case '.xlsx':
      case '.xls':
        return await parseExcel(filePath);
      
      case '.csv':
        return await parseCSV(filePath);
      
      case '.docx':
        // For now, we'll return a placeholder for DOCX
        // You could add mammoth.js or another DOCX parser if needed
        return {
          text: 'DOCX parsing not yet implemented. Please use PDF or Excel format.',
          type: 'docx'
        };
      
      default:
        throw new Error(`Unsupported file type: ${ext}`);
    }
  } catch (error) {
    console.error(`Error parsing file ${filePath}:`, error);
    throw error;
  }
}

async function parsePDF(filePath: string): Promise<ParsedFileContent> {
  try {
    // Dynamic import to avoid build issues
    const pdfParse = (await import('pdf-parse')).default;
    const dataBuffer = await fs.readFile(filePath);
    const data = await pdfParse(dataBuffer);
    
    // Enhanced drawing analysis
    const drawingAnalysis = analyzeDrawingContent(data.text);
    
    return {
      text: data.text,
      type: 'pdf',
      metadata: {
        pages: data.numpages,
        scale: drawingAnalysis.scale,
        drawing_type: drawingAnalysis.drawing_type,
        dimensions_found: drawingAnalysis.dimensions_found,
        elements_detected: drawingAnalysis.elements_detected
      }
    };
  } catch (error) {
    console.error('Error parsing PDF:', error);
    // Fallback if pdf-parse fails
    return {
      text: 'PDF parsing failed. Please try uploading an Excel or CSV file instead.',
      type: 'pdf',
      metadata: {
        pages: 0,
        drawing_type: 'unknown',
        dimensions_found: 0,
        elements_detected: []
      }
    };
  }
}

async function parseExcel(filePath: string): Promise<ParsedFileContent> {
  const workbook = XLSX.readFile(filePath);
  const sheetNames = workbook.SheetNames;
  let fullText = '';
  let totalRows = 0;
  
  // Process each sheet
  sheetNames.forEach(sheetName => {
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    fullText += `\n=== Sheet: ${sheetName} ===\n`;
    
    // Convert each row to text
    jsonData.forEach((row) => {
      if (Array.isArray(row) && row.some(cell => cell !== null && cell !== undefined && cell !== '')) {
        fullText += row.map(cell => String(cell ?? '')).join('\t') + '\n';
        totalRows++;
      }
    });
  });
  
  return {
    text: fullText.trim(),
    type: 'excel',
    metadata: {
      sheets: sheetNames,
      rows: totalRows
    }
  };
}

async function parseCSV(filePath: string): Promise<ParsedFileContent> {
  const content = await fs.readFile(filePath, 'utf-8');
  
  // Simple CSV parsing - for production, consider using a CSV parser library
  const lines = content.split('\n').filter(line => line.trim());
  const rows = lines.length;
  
  return {
    text: content,
    type: 'csv',
    metadata: {
      rows
    }
  };
}

/**
 * Analyze drawing content to extract architectural information
 */
function analyzeDrawingContent(text: string): {
  scale: string;
  drawing_type: 'floor_plan' | 'elevation' | 'section' | 'detail' | 'site_plan' | 'unknown';
  dimensions_found: number;
  elements_detected: string[];
} {
  const lowerText = text.toLowerCase();
  
  // Detect scale
  let scale = 'unknown';
  const scalePatterns = [
    /scale\s*[:\-]?\s*1\s*[:\-]\s*(\d+)/i,
    /1\s*[:\-]\s*(\d+)/i,
    /@\s*1\s*[:\-]\s*(\d+)/i
  ];
  
  for (const pattern of scalePatterns) {
    const match = text.match(pattern);
    if (match) {
      scale = `1:${match[1]}`;
      break;
    }
  }
  
  // Detect drawing type
  let drawing_type: 'floor_plan' | 'elevation' | 'section' | 'detail' | 'site_plan' | 'unknown' = 'unknown';
  
  if (lowerText.includes('floor plan') || lowerText.includes('ground floor') || lowerText.includes('first floor')) {
    drawing_type = 'floor_plan';
  } else if (lowerText.includes('elevation') || lowerText.includes('front view') || lowerText.includes('side view')) {
    drawing_type = 'elevation';
  } else if (lowerText.includes('section') || lowerText.includes('cross section')) {
    drawing_type = 'section';
  } else if (lowerText.includes('detail') || lowerText.includes('enlarged')) {
    drawing_type = 'detail';
  } else if (lowerText.includes('site plan') || lowerText.includes('survey')) {
    drawing_type = 'site_plan';
  }
  
  // Count dimensions found
  const dimensionPatterns = [
    /\d+(?:\.\d+)?\s*mm/gi,
    /\d+(?:\.\d+)?\s*m(?!\w)/gi,
    /\d+(?:\.\d+)?\s*x\s*\d+(?:\.\d+)?/gi,
    /\d+(?:\.\d+)?\s*m²/gi,
    /\d+(?:\.\d+)?\s*sqm/gi
  ];
  
  let dimensions_found = 0;
  dimensionPatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      dimensions_found += matches.length;
    }
  });
  
  // Detect building elements
  const elementPatterns = {
    'walls': /\b(wall|partition|stud|brick|block)\b/gi,
    'doors': /\b(door|entrance|entry|opening)\b/gi,
    'windows': /\b(window|glazing|glass|opening)\b/gi,
    'stairs': /\b(stair|step|landing|handrail)\b/gi,
    'roof': /\b(roof|rafter|truss|ridge|gutter)\b/gi,
    'floor': /\b(floor|slab|joist|bearer|deck)\b/gi,
    'ceiling': /\b(ceiling|cornice|bulkhead)\b/gi,
    'kitchen': /\b(kitchen|bench|cupboard|pantry)\b/gi,
    'bathroom': /\b(bathroom|toilet|shower|basin|bath)\b/gi,
    'bedroom': /\b(bedroom|bed|wardrobe)\b/gi,
    'living': /\b(living|lounge|family|dining)\b/gi,
    'garage': /\b(garage|carport|car space)\b/gi,
    'balcony': /\b(balcony|deck|verandah|patio)\b/gi,
    'structural': /\b(beam|column|lintel|pier|footing)\b/gi
  };
  
  const elements_detected: string[] = [];
  
  Object.entries(elementPatterns).forEach(([element, pattern]) => {
    const matches = text.match(pattern);
    if (matches && matches.length > 0) {
      elements_detected.push(element);
    }
  });
  
  return {
    scale,
    drawing_type,
    dimensions_found,
    elements_detected
  };
}

/**
 * Extract BOQ-specific information from parsed text
 */
export function extractBOQItems(text: string): string {
  // This is a simple extraction - you might want to enhance this
  // with more sophisticated parsing based on your BOQ format
  
  const lines = text.split('\n');
  const boqLines: string[] = [];
  
  lines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.match(/^(page|sheet|date|total)/i)) {
      // Look for lines that might contain quantities and items
      if (trimmed.match(/\d+/) || trimmed.match(/\b(m²|m2|lm|sqm|each|ea|pcs|pieces)\b/i)) {
        boqLines.push(trimmed);
      }
    }
  });
  
  return boqLines.join('\n');
}