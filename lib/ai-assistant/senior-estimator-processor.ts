import { 
  ScopeAnalysis, 
  ScopeItem, 
  DrawingAnalysis, 
  BuildingElement, 
  EstimatorQuestion, 
  EstimationDecision, 
  AuditTrail, 
  QuoteItem, 
  GeneratedQuote, 
  ConfidenceLevel,
  getConfidenceLevel 
} from './types';

import { scopeParser } from './scope-parser';
import { measurementFramework, MeasurementContext } from './measurement-framework';
import { questionGenerator, QuestionContext } from './question-generator';
import { ParsedFileContent } from './file-parser';

export interface EstimationRequest {
  scope_text: string;
  drawing_files?: ParsedFileContent[];
  project_type?: 'residential' | 'commercial' | 'industrial';
  location?: string;
  client_preferences?: Record<string, any>;
  session_id?: string;
  user_id?: string;
}

export interface EstimationResult {
  scope_analysis: ScopeAnalysis;
  drawing_analyses: DrawingAnalysis[];
  questions: EstimatorQuestion[];
  quote_items: QuoteItem[];
  generated_quote?: GeneratedQuote;
  should_proceed: boolean;
  confidence_summary: {
    overall_confidence: ConfidenceLevel;
    high_confidence_items: number;
    medium_confidence_items: number;
    low_confidence_items: number;
    items_requiring_review: number;
  };
  audit_trail: AuditTrail;
  next_steps: string[];
  estimated_duration: string;
}

export class SeniorEstimatorProcessor {
  private static instance: SeniorEstimatorProcessor;
  
  private constructor() {}
  
  static getInstance(): SeniorEstimatorProcessor {
    if (!SeniorEstimatorProcessor.instance) {
      SeniorEstimatorProcessor.instance = new SeniorEstimatorProcessor();
    }
    return SeniorEstimatorProcessor.instance;
  }
  
  async processEstimationRequest(request: EstimationRequest): Promise<EstimationResult> {
    const startTime = Date.now();
    const auditTrail: AuditTrail = {
      id: crypto.randomUUID(),
      quote_id: request.session_id || crypto.randomUUID(),
      actions: [],
      questions_asked: [],
      assumptions_made: [],
      confidence_summary: {
        overall_confidence: getConfidenceLevel(0),
        high_confidence_items: 0,
        medium_confidence_items: 0,
        low_confidence_items: 0,
        items_requiring_review: 0
      },
      created_at: new Date()
    };
    
    try {
      // Step 1: Parse and analyze the scope
      console.log('🔍 Step 1: Analyzing scope...');
      
      // If we have drawings, enhance the scope with drawing information
      let enhancedScope = request.scope_text;
      if (request.drawing_files && request.drawing_files.length > 0) {
        const { enhancePromptWithDrawingContext } = await import('./drawing-prompt-enhancer');
        // Do a preliminary analysis to get drawing info
        const preliminaryDrawings = await this.analyzeDrawings(request.drawing_files);
        enhancedScope = enhancePromptWithDrawingContext(request.scope_text, preliminaryDrawings);
      }
      
      const scopeAnalysis = await scopeParser.parseScope(enhancedScope);
      
      auditTrail.actions.push({
        id: crypto.randomUUID(),
        scope_item_id: 'scope_analysis',
        decision_type: 'method_choice',
        reasoning: 'Parsed scope into structured items using pattern recognition',
        alternatives_considered: ['Manual parsing', 'Simple text analysis'],
        confidence_factors: [`${scopeAnalysis.extractedItems.length} items extracted`, `${scopeAnalysis.ambiguities.length} ambiguities found`],
        risk_assessment: scopeAnalysis.ambiguities.length > 0 ? 'Medium - requires clarification' : 'Low - clear scope',
        timestamp: new Date()
      });
      
      // Step 2: Analyze drawings if provided
      console.log('📐 Step 2: Analyzing drawings...');
      const drawingAnalyses = await this.analyzeDrawings(request.drawing_files || []);
      
      if (drawingAnalyses.length > 0) {
        auditTrail.actions.push({
          id: crypto.randomUUID(),
          scope_item_id: 'drawing_analysis',
          decision_type: 'method_choice',
          reasoning: 'Analyzed architectural drawings for building elements and dimensions',
          alternatives_considered: ['Skip drawing analysis', 'Manual measurement'],
          confidence_factors: [`${drawingAnalyses.length} drawings analyzed`, `${drawingAnalyses.reduce((sum, d) => sum + d.elements_found.length, 0)} elements found`],
          risk_assessment: 'Low - drawing data available',
          timestamp: new Date()
        });
      }
      
      // Step 3: Generate building elements from drawings
      console.log('🏗️ Step 3: Extracting building elements...');
      const allBuildingElements = this.extractBuildingElements(drawingAnalyses);
      
      // Step 4: Calculate quantities for each scope item
      console.log('📊 Step 4: Calculating quantities...');
      const quoteItems: QuoteItem[] = [];
      const estimationDecisions: EstimationDecision[] = [];
      
      for (const scopeItem of scopeAnalysis.extractedItems) {
        const relevantElements = allBuildingElements.filter(element => 
          this.isElementRelevantToScope(element, scopeItem)
        );
        
        const measurementContext: MeasurementContext = {
          scope_item: scopeItem,
          building_elements: relevantElements,
          drawing_scale: drawingAnalyses[0]?.scale,
          location_context: request.location,
          building_type: request.project_type || 'residential',
          construction_method: this.inferConstructionMethod(scopeItem, relevantElements)
        };
        
        try {
          const measurementResult = await measurementFramework.calculateQuantity(measurementContext);
          
          const quoteItem: QuoteItem = {
            id: crypto.randomUUID(),
            description: scopeItem.description,
            quantity: measurementResult.quantity,
            unit: measurementResult.unit,
            unitPrice: 0, // To be priced later
            totalPrice: 0,
            confidence: measurementResult.confidence,
            sourceReference: `${relevantElements.length} elements on drawings`
          };
          
          quoteItems.push(quoteItem);
          
          // Record estimation decision
          estimationDecisions.push({
            id: crypto.randomUUID(),
            scope_item_id: scopeItem.id,
            decision_type: 'quantity_calculation',
            reasoning: measurementResult.calculation_method,
            alternatives_considered: ['Provisional allowance', 'Manual calculation'],
            confidence_factors: measurementResult.assumptions,
            risk_assessment: measurementResult.confidence.score >= 85 ? 'Low' : 'Medium - requires review',
            standards_reference: measurementResult.australian_standards_notes?.join('; '),
            timestamp: new Date()
          });
          
        } catch (error) {
          console.error(`Error calculating quantity for ${scopeItem.description}:`, error);
          
          // Create fallback quote item
          const fallbackItem: QuoteItem = {
            id: crypto.randomUUID(),
            description: scopeItem.description,
            quantity: 1,
            unit: 'item',
            unitPrice: 0,
            totalPrice: 0,
            confidence: getConfidenceLevel(0, ['Calculation failed - requires manual review']),
            sourceReference: 'Calculation error'
          };
          
          quoteItems.push(fallbackItem);
          
          auditTrail.assumptions_made.push(`Failed to calculate quantity for ${scopeItem.description} - using placeholder`);
        }
      }
      
      // Step 5: Generate questions for items below confidence threshold
      console.log('❓ Step 5: Generating questions...');
      const allQuestions: EstimatorQuestion[] = [];
      
      for (const scopeItem of scopeAnalysis.extractedItems) {
        if (scopeItem.confidence.score < 85) {
          const questionContext: QuestionContext = {
            scope_item: scopeItem,
            building_elements: allBuildingElements,
            ambiguities: scopeAnalysis.ambiguities.filter(a => a.item_id === scopeItem.id),
            drawing_references: drawingAnalyses.map(d => d.file_name),
            project_type: request.project_type,
            location: request.location
          };
          
          const questionResult = await questionGenerator.generateQuestions(questionContext);
          allQuestions.push(...questionResult.questions);
        }
      }
      
      // Step 6: Calculate confidence summary
      console.log('📈 Step 6: Calculating confidence summary...');
      const confidenceSummary = this.calculateConfidenceSummary(quoteItems);
      
      // Step 7: Determine if we should proceed
      const shouldProceed = this.shouldProceedWithEstimation(quoteItems, allQuestions);
      
      // Step 8: Generate quote if confidence is sufficient
      let generatedQuote: GeneratedQuote | undefined;
      if (shouldProceed) {
        generatedQuote = this.generateQuote(quoteItems, request);
      }
      
      // Step 9: Prepare audit trail
      auditTrail.actions.push(...estimationDecisions);
      auditTrail.questions_asked = allQuestions;
      auditTrail.confidence_summary = confidenceSummary;
      
      // Step 10: Generate next steps
      const nextSteps = this.generateNextSteps(quoteItems, allQuestions, shouldProceed);
      
      // Calculate estimated duration
      const processingTime = Date.now() - startTime;
      const estimatedDuration = this.calculateEstimatedDuration(quoteItems.length, allQuestions.length);
      
      console.log(`✅ Estimation complete in ${processingTime}ms`);
      
      return {
        scope_analysis: scopeAnalysis,
        drawing_analyses: drawingAnalyses,
        questions: allQuestions,
        quote_items: quoteItems,
        generated_quote: generatedQuote,
        should_proceed: shouldProceed,
        confidence_summary: confidenceSummary,
        audit_trail: auditTrail,
        next_steps: nextSteps,
        estimated_duration: estimatedDuration
      };
      
    } catch (error) {
      console.error('Error in estimation process:', error);
      
      // Return error result
      return {
        scope_analysis: {
          id: crypto.randomUUID(),
          originalScope: request.scope_text,
          extractedItems: [],
          ambiguities: [],
          completeness: 0,
          confidence: getConfidenceLevel(0, ['Processing error occurred'])
        },
        drawing_analyses: [],
        questions: [],
        quote_items: [],
        should_proceed: false,
        confidence_summary: {
          overall_confidence: getConfidenceLevel(0, ['Processing error']),
          high_confidence_items: 0,
          medium_confidence_items: 0,
          low_confidence_items: 0,
          items_requiring_review: 0
        },
        audit_trail: auditTrail,
        next_steps: ['Fix processing error', 'Try again with simpler scope'],
        estimated_duration: '0 minutes'
      };
    }
  }
  
  private async analyzeDrawings(drawingFiles: ParsedFileContent[]): Promise<DrawingAnalysis[]> {
    const analyses: DrawingAnalysis[] = [];
    
    for (const file of drawingFiles) {
      if (file.type === 'pdf' && file.metadata) {
        const analysis: DrawingAnalysis = {
          id: crypto.randomUUID(),
          file_name: file.text.substring(0, 50) + '...' || 'Unknown',
          sheet_type: file.metadata.drawing_type || 'unknown',
          scale: file.metadata.scale || 'unknown',
          dimensions_extracted: [],
          elements_found: [],
          scope_matches: [],
          confidence: getConfidenceLevel(
            file.metadata.dimensions_found && file.metadata.dimensions_found > 0 ? 75 : 40,
            [`${file.metadata.dimensions_found || 0} dimensions found`, `${file.metadata.elements_detected?.length || 0} elements detected`]
          ),
          notes: [`Drawing type: ${file.metadata.drawing_type}`, `Scale: ${file.metadata.scale}`]
        };
        
        // Extract dimensions from enhanced analysis
        if (file.metadata.measurements) {
          analysis.dimensions_extracted = file.metadata.measurements.map((m: any) => ({
            id: crypto.randomUUID(),
            value: m.value,
            unit: m.unit,
            description: m.description,
            location: m.description,
            confidence: getConfidenceLevel(70, ['Extracted from drawing'])
          }));
        }
        
        // Convert detected elements to building elements
        if (file.metadata.elements_detected) {
          analysis.elements_found = file.metadata.elements_detected.map(elementType => ({
            id: crypto.randomUUID(),
            type: this.mapElementType(elementType),
            location: elementType,
            quantity: 1,
            unit: 'each',
            confidence: getConfidenceLevel(60, ['Detected from drawing text'])
          }));
        }
        
        // Add enhanced elements if available
        if (file.metadata.enhanced_analysis?.extractedElements) {
          const enhancedElements = file.metadata.enhanced_analysis.extractedElements.map((elem: any) => ({
            id: crypto.randomUUID(),
            type: elem.type,
            location: elem.description,
            quantity: elem.quantity,
            unit: 'each',
            confidence: getConfidenceLevel(elem.confidence * 100, ['Enhanced drawing analysis'])
          }));
          analysis.elements_found.push(...enhancedElements);
        }
        
        // Add room information to notes
        if (file.metadata.rooms && file.metadata.rooms.length > 0 && analysis.notes) {
          analysis.notes.push(`Rooms found: ${file.metadata.rooms.map((r: any) => r.name).join(', ')}`);
        }
        
        analyses.push(analysis);
      }
    }
    
    return analyses;
  }
  
  private extractBuildingElements(drawings: DrawingAnalysis[]): BuildingElement[] {
    const elements: BuildingElement[] = [];
    
    for (const drawing of drawings) {
      elements.push(...drawing.elements_found);
    }
    
    return elements;
  }
  
  private isElementRelevantToScope(element: BuildingElement, scopeItem: ScopeItem): boolean {
    const scopeDesc = scopeItem.description.toLowerCase();
    const elementType = element.type.toLowerCase();
    const elementLocation = element.location.toLowerCase();
    
    // Direct type matches
    if (scopeDesc.includes(elementType)) return true;
    
    // Category matches
    if (scopeDesc.includes('wall') && elementType === 'wall') return true;
    if (scopeDesc.includes('door') && elementType === 'door') return true;
    if (scopeDesc.includes('window') && elementType === 'window') return true;
    if (scopeDesc.includes('floor') && elementType === 'floor') return true;
    if (scopeDesc.includes('ceiling') && elementType === 'ceiling') return true;
    if (scopeDesc.includes('roof') && elementType === 'roof') return true;
    
    // Location matches
    if (scopeItem.location && elementLocation.includes(scopeItem.location.toLowerCase())) {
      return true;
    }
    
    // Material/construction matches
    if (scopeDesc.includes('timber') && elementLocation.includes('structural')) return true;
    if (scopeDesc.includes('concrete') && elementLocation.includes('structural')) return true;
    if (scopeDesc.includes('steel') && elementLocation.includes('structural')) return true;
    
    return false;
  }
  
  private inferConstructionMethod(scopeItem: ScopeItem, _elements: BuildingElement[]): 'timber_frame' | 'steel_frame' | 'concrete' | 'masonry' {
    const description = scopeItem.description.toLowerCase();
    
    if (description.includes('timber') || description.includes('wood')) return 'timber_frame';
    if (description.includes('steel')) return 'steel_frame';
    if (description.includes('concrete')) return 'concrete';
    if (description.includes('brick') || description.includes('block')) return 'masonry';
    
    // Default to timber frame for residential
    return 'timber_frame';
  }
  
  private mapElementType(elementType: string): BuildingElement['type'] {
    const typeMap: Record<string, BuildingElement['type']> = {
      'walls': 'wall',
      'doors': 'door',
      'windows': 'window',
      'stairs': 'other',
      'roof': 'roof',
      'floor': 'floor',
      'ceiling': 'ceiling',
      'kitchen': 'other',
      'bathroom': 'other',
      'bedroom': 'other',
      'living': 'other',
      'garage': 'other',
      'balcony': 'other',
      'structural': 'beam'
    };
    
    return typeMap[elementType] || 'other';
  }
  
  private calculateConfidenceSummary(quoteItems: QuoteItem[]): {
    overall_confidence: ConfidenceLevel;
    high_confidence_items: number;
    medium_confidence_items: number;
    low_confidence_items: number;
    items_requiring_review: number;
  } {
    if (quoteItems.length === 0) {
      return {
        overall_confidence: getConfidenceLevel(0, ['No items to analyze']),
        high_confidence_items: 0,
        medium_confidence_items: 0,
        low_confidence_items: 0,
        items_requiring_review: 0
      };
    }
    
    const highConfidenceItems = quoteItems.filter(item => item.confidence.score >= 85).length;
    const mediumConfidenceItems = quoteItems.filter(item => item.confidence.score >= 70 && item.confidence.score < 85).length;
    const lowConfidenceItems = quoteItems.filter(item => item.confidence.score >= 40 && item.confidence.score < 70).length;
    const itemsRequiringReview = quoteItems.filter(item => item.confidence.score < 40).length;
    
    const averageConfidence = quoteItems.reduce((sum, item) => sum + item.confidence.score, 0) / quoteItems.length;
    
    const overallConfidence = getConfidenceLevel(
      averageConfidence,
      [`${highConfidenceItems} high confidence items`, `${mediumConfidenceItems} medium confidence items`, `${lowConfidenceItems} low confidence items`],
      itemsRequiringReview > 0 ? [`${itemsRequiringReview} items require review`] : undefined
    );
    
    return {
      overall_confidence: overallConfidence,
      high_confidence_items: highConfidenceItems,
      medium_confidence_items: mediumConfidenceItems,
      low_confidence_items: lowConfidenceItems,
      items_requiring_review: itemsRequiringReview
    };
  }
  
  private shouldProceedWithEstimation(quoteItems: QuoteItem[], questions: EstimatorQuestion[]): boolean {
    // Check if we have any items
    if (quoteItems.length === 0) return false;
    
    // Check if we have too many high-priority questions
    const highPriorityQuestions = questions.filter(q => q.priority === 'high').length;
    if (highPriorityQuestions > 3) return false;
    
    // Check overall confidence
    const averageConfidence = quoteItems.reduce((sum, item) => sum + item.confidence.score, 0) / quoteItems.length;
    if (averageConfidence < 70) return false;
    
    // Check if we have too many items requiring review
    const itemsRequiringReview = quoteItems.filter(item => item.confidence.score < 40).length;
    if (itemsRequiringReview > quoteItems.length * 0.3) return false; // More than 30% need review
    
    return true;
  }
  
  private generateQuote(quoteItems: QuoteItem[], request: EstimationRequest): GeneratedQuote {
    const confidenceSummary = this.calculateConfidenceSummary(quoteItems);
    
    return {
      id: crypto.randomUUID(),
      projectName: this.extractProjectName(request.scope_text),
      items: quoteItems,
      summary: {
        totalItems: quoteItems.length,
        highConfidence: confidenceSummary.high_confidence_items,
        mediumConfidence: confidenceSummary.medium_confidence_items,
        lowConfidence: confidenceSummary.low_confidence_items,
        needsReview: confidenceSummary.items_requiring_review,
        readyForPricing: confidenceSummary.high_confidence_items + confidenceSummary.medium_confidence_items
      },
      subtotal: 0, // To be calculated after pricing
      tax: 0,
      total: 0,
      status: 'draft',
      createdAt: new Date()
    };
  }
  
  private extractProjectName(scopeText: string): string {
    // Try to extract project name from scope text
    const lines = scopeText.split('\n');
    const firstLine = lines[0].trim();
    
    if (firstLine.length > 0 && firstLine.length < 100) {
      return firstLine;
    }
    
    // Look for project/job/site references
    const projectMatch = scopeText.match(/(?:project|job|site)[:\s]+([^\n]+)/i);
    if (projectMatch) {
      return projectMatch[1].trim();
    }
    
    return 'Construction Estimate';
  }
  
  private generateNextSteps(quoteItems: QuoteItem[], questions: EstimatorQuestion[], shouldProceed: boolean): string[] {
    const steps: string[] = [];
    
    if (questions.length > 0) {
      const highPriorityQuestions = questions.filter(q => q.priority === 'high').length;
      const mediumPriorityQuestions = questions.filter(q => q.priority === 'medium').length;
      
      steps.push(`Answer ${highPriorityQuestions} high-priority questions`);
      if (mediumPriorityQuestions > 0) {
        steps.push(`Review ${mediumPriorityQuestions} medium-priority questions`);
      }
    }
    
    const itemsNeedingReview = quoteItems.filter(item => item.confidence.score < 70).length;
    if (itemsNeedingReview > 0) {
      steps.push(`Review ${itemsNeedingReview} items with low confidence`);
    }
    
    if (shouldProceed) {
      steps.push('Price materials using current supplier rates');
      steps.push('Apply labor rates for NSW construction');
      steps.push('Add margins and finalize quote');
    } else {
      steps.push('Resolve questions and uncertainties before pricing');
    }
    
    const itemsWithoutPricing = quoteItems.filter(item => item.unitPrice === 0).length;
    if (itemsWithoutPricing > 0) {
      steps.push(`Price ${itemsWithoutPricing} items using materials database`);
    }
    
    return steps;
  }
  
  private calculateEstimatedDuration(itemCount: number, questionCount: number): string {
    // Base time for processing
    let minutes = 5;
    
    // Add time based on complexity
    minutes += itemCount * 0.5; // 30 seconds per item
    minutes += questionCount * 2; // 2 minutes per question
    
    // Round to nearest 5 minutes
    minutes = Math.ceil(minutes / 5) * 5;
    
    if (minutes < 60) {
      return `${minutes} minutes`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours} hour${hours > 1 ? 's' : ''}`;
    }
  }
}

export const seniorEstimatorProcessor = SeniorEstimatorProcessor.getInstance();