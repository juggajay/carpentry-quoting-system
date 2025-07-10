export function enhancePromptWithDrawingContext(
  originalScope: string,
  drawingAnalyses: any[]
): string {
  if (!drawingAnalyses || drawingAnalyses.length === 0) {
    return originalScope;
  }

  let enhancedScope = originalScope + '\n\n--- DRAWING INFORMATION ---\n\n';

  drawingAnalyses.forEach((drawing, index) => {
    enhancedScope += `Drawing ${index + 1}: ${drawing.sheet_type}\n`;
    enhancedScope += `Scale: ${drawing.scale}\n`;
    
    if (drawing.dimensions_extracted && drawing.dimensions_extracted.length > 0) {
      enhancedScope += '\nKey Dimensions:\n';
      drawing.dimensions_extracted.forEach((dim: any) => {
        enhancedScope += `- ${dim.description}: ${dim.value}${dim.unit}\n`;
      });
    }
    
    if (drawing.elements_found && drawing.elements_found.length > 0) {
      enhancedScope += '\nElements Found:\n';
      const elementCounts: any = {};
      drawing.elements_found.forEach((elem: any) => {
        const key = elem.type;
        if (!elementCounts[key]) elementCounts[key] = 0;
        elementCounts[key] += elem.quantity;
      });
      
      Object.entries(elementCounts).forEach(([type, count]) => {
        enhancedScope += `- ${type}: ${count}\n`;
      });
    }
    
    if (drawing.notes && drawing.notes.length > 0) {
      enhancedScope += '\nNotes:\n';
      drawing.notes.forEach((note: string) => {
        enhancedScope += `- ${note}\n`;
      });
    }
    
    enhancedScope += '\n';
  });

  return enhancedScope;
}

export function generateDrawingQuestions(drawingAnalyses: any[]): string[] {
  const questions: string[] = [];
  
  drawingAnalyses.forEach((drawing) => {
    // Check for missing scale
    if (drawing.scale === 'unknown') {
      questions.push('What is the scale of the architectural drawings?');
    }
    
    // Check for low element count
    if (!drawing.elements_found || drawing.elements_found.length < 5) {
      questions.push(`The ${drawing.sheet_type} drawing seems to have limited information extracted. Can you provide clearer drawings or specify the main elements?`);
    }
    
    // Check for missing dimensions
    if (!drawing.dimensions_extracted || drawing.dimensions_extracted.length === 0) {
      questions.push(`No dimensions were found in the ${drawing.sheet_type}. What are the overall dimensions of the project?`);
    }
  });
  
  // Add general drawing questions
  if (drawingAnalyses.length > 0) {
    questions.push('Are there any specific details in the drawings that should be considered for the estimate?');
    questions.push('Do the drawings show all required construction details, or are there additional specifications?');
  }
  
  return [...new Set(questions)]; // Remove duplicates
}

export function extractMeasurementsFromDrawing(drawingText: string): {
  area?: number;
  perimeter?: number;
  height?: number;
  roomSizes: Record<string, number>;
} {
  const measurements: any = {
    roomSizes: {}
  };
  
  // Extract overall area
  const areaMatch = drawingText.match(/(?:total\s*)?area\s*[:=]\s*(\d+(?:\.\d+)?)\s*(?:m2|sqm|m²)/i);
  if (areaMatch) {
    measurements.area = parseFloat(areaMatch[1]);
  }
  
  // Extract room sizes
  const roomPatterns = [
    /(\w+(?:\s+\w+)?)\s*[:=]\s*(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)/gi,
    /(\w+(?:\s+\w+)?)\s*[:=]\s*(\d+(?:\.\d+)?)\s*(?:m2|sqm|m²)/gi,
  ];
  
  roomPatterns.forEach(pattern => {
    const matches = drawingText.matchAll(pattern);
    for (const match of matches) {
      const roomName = match[1].toLowerCase();
      if (match[3]) {
        // Width x Length format
        const area = parseFloat(match[2]) * parseFloat(match[3]);
        measurements.roomSizes[roomName] = area;
      } else {
        // Direct area format
        measurements.roomSizes[roomName] = parseFloat(match[2]);
      }
    }
  });
  
  // Extract ceiling height
  const heightMatch = drawingText.match(/(?:ceiling\s*)?height\s*[:=]\s*(\d+(?:\.\d+)?)\s*(?:m|mm)/i);
  if (heightMatch) {
    const value = parseFloat(heightMatch[1]);
    measurements.height = heightMatch[0].includes('mm') ? value / 1000 : value;
  }
  
  return measurements;
}