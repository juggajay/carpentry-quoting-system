import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    // Get the latest analysis for this session
    const analysis = await db.estimatorAnalysis.findFirst({
      where: { sessionId },
      orderBy: { createdAt: 'desc' },
      include: {
        session: {
          include: {
            user: true
          }
        }
      }
    });

    if (!analysis || analysis.session.user.clerkId !== userId) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
    }

    // Extract summary from the analysis
    const scopeAnalysis = analysis.scopeAnalysis as any;
    const drawingAnalyses = analysis.drawingAnalyses as any;
    const quoteItems = analysis.quoteItems as any;

    // Build a comprehensive summary
    const summary = {
      fileCount: drawingAnalyses?.length || 0,
      pageCount: drawingAnalyses?.reduce((sum: number, d: any) => sum + (d.metadata?.pages || 1), 0) || 0,
      drawingType: detectDrawingType(drawingAnalyses),
      elementsFound: extractUniqueElements(scopeAnalysis, drawingAnalyses),
      textContent: extractTextPreview(drawingAnalyses),
      confidence: calculateOverallConfidence(quoteItems),
      recommendations: generateRecommendations(scopeAnalysis, drawingAnalyses)
    };

    return NextResponse.json({ summary });

  } catch (error) {
    console.error('Analysis summary error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analysis summary' },
      { status: 500 }
    );
  }
}

function detectDrawingType(drawingAnalyses: any[]): string {
  if (!drawingAnalyses || drawingAnalyses.length === 0) {
    return 'No drawings uploaded';
  }

  const types = drawingAnalyses.map(d => d.metadata?.drawing_type || 'unknown');
  const uniqueTypes = [...new Set(types)];
  
  if (uniqueTypes.length === 1 && uniqueTypes[0] === 'unknown') {
    return 'Architectural drawings (visual content - text extraction limited)';
  }
  
  return uniqueTypes.join(', ');
}

function extractUniqueElements(scopeAnalysis: any, drawingAnalyses: any[]): string[] {
  const elements = new Set<string>();
  
  // From scope analysis
  if (scopeAnalysis?.extractedItems) {
    scopeAnalysis.extractedItems.forEach((item: any) => {
      if (item.category && item.category !== 'unknown') {
        elements.add(item.category);
      }
    });
  }
  
  // From drawing analyses
  drawingAnalyses?.forEach(d => {
    if (d.metadata?.elements_detected) {
      d.metadata.elements_detected.forEach((elem: string) => {
        if (elem && elem !== 'unknown') {
          elements.add(elem);
        }
      });
    }
  });
  
  return Array.from(elements).slice(0, 10); // Limit to 10 elements
}

function extractTextPreview(drawingAnalyses: any[]): string {
  if (!drawingAnalyses || drawingAnalyses.length === 0) {
    return '';
  }
  
  // Get the first non-empty text content
  for (const analysis of drawingAnalyses) {
    if (analysis.text && analysis.text.length > 50) {
      return analysis.text.substring(0, 200).replace(/\s+/g, ' ').trim();
    }
  }
  
  return 'Minimal text content found - appears to be primarily visual drawings';
}

function calculateOverallConfidence(quoteItems: any[]): number {
  if (!quoteItems || quoteItems.length === 0) {
    return 0;
  }
  
  const totalConfidence = quoteItems.reduce((sum: number, item: any) => {
    return sum + (item.confidence?.score || 0);
  }, 0);
  
  return Math.round(totalConfidence / quoteItems.length);
}

function generateRecommendations(scopeAnalysis: any, drawingAnalyses: any[]): string[] {
  const recommendations: string[] = [];
  
  // Check if minimal text was extracted
  const hasMinimalText = drawingAnalyses?.every(d => 
    !d.text || d.text.length < 500
  );
  
  if (hasMinimalText) {
    recommendations.push('Describe the construction scope in the chat for better results');
    recommendations.push('Upload BOQ or specification documents if available');
  }
  
  // Check confidence levels
  const lowConfidenceCount = scopeAnalysis?.extractedItems?.filter((item: any) => 
    item.confidence?.score < 70
  ).length || 0;
  
  if (lowConfidenceCount > 5) {
    recommendations.push(`Answer the ${lowConfidenceCount} clarification questions to improve accuracy`);
  }
  
  // Check for missing elements
  if (!scopeAnalysis?.extractedItems || scopeAnalysis.extractedItems.length < 5) {
    recommendations.push('Provide more details about specific work items needed');
  }
  
  return recommendations;
}