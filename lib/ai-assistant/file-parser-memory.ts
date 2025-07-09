import * as XLSX from 'xlsx';

export interface ParsedFileContent {
  text: string;
  type: string;
  metadata?: {
    pages?: number;
    sheets?: string[];
    rows?: number;
    warning?: string;
    error?: string;
  };
}

/**
 * Parse various file types from buffer/base64 without file system
 */
export async function parseFileFromBuffer(
  buffer: Buffer,
  filename: string
): Promise<ParsedFileContent> {
  const ext = filename.toLowerCase().split('.').pop();
  
  console.log('[FileParser] Parsing file:', {
    filename,
    extension: ext,
    bufferSize: buffer.length
  });
  
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
    console.log('[FileParser] Starting PDF parse, buffer size:', buffer.length);
    
    // Dynamic import to avoid build issues
    const pdfParse = (await import('pdf-parse')).default;
    const data = await pdfParse(buffer);
    
    console.log('[FileParser] PDF parse complete:', {
      pages: data.numpages,
      textLength: data.text?.length || 0,
      hasText: !!data.text && data.text.trim().length > 0
    });
    
    // Check if we got any text
    if (!data.text || data.text.trim().length === 0) {
      console.log('PDF parse returned no text - might be a scanned PDF');
      return {
        text: '',
        type: 'pdf',
        metadata: {
          pages: data.numpages || 0,
          warning: 'No text extracted - PDF might be scanned/image-based'
        }
      };
    }
    
    console.log('[FileParser] PDF parsed successfully:', {
      pages: data.numpages,
      characters: data.text.length,
      preview: data.text.substring(0, 200) + '...'
    });
    
    return {
      text: data.text,
      type: 'pdf',
      metadata: {
        pages: data.numpages
      }
    };
  } catch (error) {
    console.error('Error parsing PDF:', error);
    // Log more details about the error
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    return {
      text: '',
      type: 'pdf',
      metadata: {
        pages: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
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
  // Return the full text for AI to parse - it's better at understanding context
  // Just do some basic cleaning
  
  console.log('[FileParser] Extracting BOQ items from text of length:', text.length);
  
  const lines = text.split('\n');
  const cleanedLines: string[] = [];
  
  lines.forEach(line => {
    const trimmed = line.trim();
    // Remove empty lines and obvious headers/footers
    if (trimmed && 
        !trimmed.match(/^page\s*\d+/i) && 
        !trimmed.match(/^copyright/i) &&
        !trimmed.match(/^confidential/i) &&
        trimmed.length > 2) {
      cleanedLines.push(trimmed);
    }
  });
  
  // Return cleaned text, preserving structure for AI to parse
  const result = cleanedLines.join('\n');
  console.log('[FileParser] BOQ extraction complete:', {
    originalLength: text.length,
    cleanedLength: result.length,
    linesRemoved: lines.length - cleanedLines.length
  });
  return result;
}