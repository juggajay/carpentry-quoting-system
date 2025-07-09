import { NextRequest, NextResponse } from 'next/server';
import { seniorEstimatorProcessor } from '@/lib/ai-assistant/senior-estimator-processor';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing Senior Estimator Agent...');
    
    // Test 1: Simple scope parsing
    const simpleScope = "Supply and install 19mm F11 structural plywood to kitchen ceiling. Area approximately 25 sqm.";
    
    const result = await seniorEstimatorProcessor.processEstimationRequest({
      scope_text: simpleScope,
      project_type: 'residential',
      location: 'NSW, Australia'
    });
    
    const testResults = {
      test_name: 'Senior Estimator Agent Test',
      success: true,
      scope_analysis: {
        items_extracted: result.scope_analysis.extractedItems.length,
        ambiguities_found: result.scope_analysis.ambiguities.length,
        overall_confidence: result.scope_analysis.confidence.score,
        completeness: result.scope_analysis.completeness
      },
      quote_items: result.quote_items.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        confidence: item.confidence.score
      })),
      questions: result.questions.map(q => ({
        priority: q.priority,
        question: q.question,
        type: q.type
      })),
      confidence_summary: {
        high_confidence_items: result.confidence_summary.high_confidence_items,
        medium_confidence_items: result.confidence_summary.medium_confidence_items,
        low_confidence_items: result.confidence_summary.low_confidence_items,
        items_requiring_review: result.confidence_summary.items_requiring_review
      },
      should_proceed: result.should_proceed,
      estimated_duration: result.estimated_duration,
      next_steps: result.next_steps,
      nsw_compliance_notes: result.scope_analysis.nsw_compliance_notes || []
    };
    
    return NextResponse.json(testResults);
    
  } catch (error) {
    console.error('❌ Senior Estimator test failed:', error);
    
    return NextResponse.json({
      test_name: 'Senior Estimator Agent Test',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { scope_text, project_type, location } = await request.json();
    
    console.log('🧪 Testing Senior Estimator with custom scope...');
    
    const result = await seniorEstimatorProcessor.processEstimationRequest({
      scope_text: scope_text || "Supply and install timber framing for residential extension, including posts, beams, and roof structure.",
      project_type: project_type || 'residential',
      location: location || 'NSW, Australia'
    });
    
    const testResults = {
      test_name: 'Custom Scope Test',
      success: true,
      input: {
        scope_text,
        project_type,
        location
      },
      results: {
        scope_analysis: {
          items_extracted: result.scope_analysis.extractedItems.length,
          ambiguities_found: result.scope_analysis.ambiguities.length,
          overall_confidence: result.scope_analysis.confidence.score,
          completeness: result.scope_analysis.completeness
        },
        quote_items: result.quote_items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          confidence: item.confidence.score,
          source: item.sourceReference
        })),
        questions: result.questions.map(q => ({
          priority: q.priority,
          question: q.question,
          type: q.type,
          confidence_impact: q.confidence_impact
        })),
        confidence_summary: result.confidence_summary,
        should_proceed: result.should_proceed,
        estimated_duration: result.estimated_duration,
        next_steps: result.next_steps,
        audit_trail: {
          decisions_made: result.audit_trail.actions.length,
          questions_asked: result.audit_trail.questions_asked.length,
          assumptions_made: result.audit_trail.assumptions_made.length
        }
      }
    };
    
    return NextResponse.json(testResults);
    
  } catch (error) {
    console.error('❌ Custom scope test failed:', error);
    
    return NextResponse.json({
      test_name: 'Custom Scope Test',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}