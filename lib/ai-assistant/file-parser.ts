import fs from 'fs/promises';
import path from 'path';
import pdfParse from 'pdf-parse';
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
  const dataBuffer = await fs.readFile(filePath);
  const data = await pdfParse(dataBuffer);
  
  return {
    text: data.text,
    type: 'pdf',
    metadata: {
      pages: data.numpages
    }
  };
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
    jsonData.forEach((row: any) => {
      if (Array.isArray(row) && row.some(cell => cell !== null && cell !== undefined && cell !== '')) {
        fullText += row.join('\t') + '\n';
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