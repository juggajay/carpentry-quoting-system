import * as XLSX from 'xlsx';

export interface ParsedFileContent {
  text: string;
  type: string;
  metadata?: {
    pages?: number;
    sheets?: string[];
    rows?: number;
  };
}

/**
 * Parse various file types from buffer/base64 without file system
 */
export async function parseFileFromBuffer(
  buffer: Buffer,
  filename: string,
  mimeType: string
): Promise<ParsedFileContent> {
  const ext = filename.toLowerCase().split('.').pop();
  
  try {
    switch (ext) {
      case 'pdf':
        return await parsePDFFromBuffer(buffer);
      
      case 'xlsx':
      case 'xls':
        return parseExcelFromBuffer(buffer);
      
      case 'csv':
        return parseCSVFromBuffer(buffer);
      
      case 'docx':
        return {
          text: 'DOCX parsing not yet implemented. Please use PDF or Excel format.',
          type: 'docx'
        };
      
      default:
        throw new Error(`Unsupported file type: ${ext}`);
    }
  } catch (error) {
    console.error(`Error parsing file ${filename}:`, error);
    throw error;
  }
}

async function parsePDFFromBuffer(buffer: Buffer): Promise<ParsedFileContent> {
  try {
    // Dynamic import to avoid build issues
    const pdfParse = (await import('pdf-parse')).default;
    const data = await pdfParse(buffer);
    
    return {
      text: data.text,
      type: 'pdf',
      metadata: {
        pages: data.numpages
      }
    };
  } catch (error) {
    console.error('Error parsing PDF:', error);
    return {
      text: 'PDF parsing failed. Please try uploading an Excel or CSV file instead.',
      type: 'pdf',
      metadata: {
        pages: 0
      }
    };
  }
}

function parseExcelFromBuffer(buffer: Buffer): ParsedFileContent {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
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

function parseCSVFromBuffer(buffer: Buffer): ParsedFileContent {
  const content = buffer.toString('utf-8');
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
 * Extract BOQ-specific information from parsed text
 */
export function extractBOQItems(text: string): string {
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