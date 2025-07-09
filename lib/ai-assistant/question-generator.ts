import { 
  EstimatorQuestion, 
  QuestionOption, 
  ScopeItem, 
  Ambiguity, 
  BuildingElement, 
  ConfidenceLevel 
} from './types';

export interface QuestionContext {
  scope_item: ScopeItem;
  building_elements: BuildingElement[];
  ambiguities: Ambiguity[];
  drawing_references?: string[];
  project_type?: 'residential' | 'commercial' | 'industrial';
  location?: string;
}

export interface QuestionGenerationResult {
  questions: EstimatorQuestion[];
  should_proceed: boolean;
  confidence_threshold_met: boolean;
  blocking_issues: string[];
}

export class QuestionGenerator {
  private static instance: QuestionGenerator;
  
  // NSW-specific material standards and options
  private readonly nswMaterialStandards = {
    timber: {
      structural: ['F5', 'F7', 'F8', 'F11', 'F14', 'F17'],
      cladding: ['DAR Pine', 'Spotted Gum', 'Blackbutt', 'Merbau', 'Fibre Cement'],
      flooring: ['Spotted Gum', 'Blackbutt', 'Jarrah', 'Bamboo', 'Engineered Timber'],
      framing: ['MGP10', 'MGP12', 'MGP15', 'LVL', 'H1.2', 'H2.5', 'H3.2']
    },
    concrete: {
      residential: ['N20', 'N25', 'N32'],
      commercial: ['N32', 'N40', 'N50'],
      reinforcement: ['SL92', 'SL102', 'SL82', 'N12', 'N16', 'N20']
    },
    steel: {
      structural: ['300PLUS', 'C350L0', 'C450L0'],
      roofing: ['COLORBOND', 'ZINCALUME', 'Galvanised'],
      framing: ['C350L0', 'C450L0', 'Galvanised RHS']
    },
    insulation: {
      bulk: ['R1.5', 'R2.5', 'R3.5', 'R5.0', 'R6.0'],
      reflective: ['Single sided', 'Double sided', 'Perforated'],
      board: ['EPS', 'XPS', 'PIR', 'Polyester']
    }
  };

  // Common NSW construction methods
  private readonly nswConstructionMethods = {
    wall_framing: ['Timber frame', 'Steel frame', 'Concrete block', 'Brick veneer'],
    roof_construction: ['Timber truss', 'Steel truss', 'Rafter/beam', 'Concrete slab'],
    floor_construction: ['Concrete slab', 'Suspended timber', 'Steel frame', 'Concrete suspended'],
    cladding_systems: ['Weatherboard', 'Fibre cement', 'Brick', 'Stone', 'Metal', 'Render']
  };

  private constructor() {}

  static getInstance(): QuestionGenerator {
    if (!QuestionGenerator.instance) {
      QuestionGenerator.instance = new QuestionGenerator();
    }
    return QuestionGenerator.instance;
  }

  async generateQuestions(context: QuestionContext): Promise<QuestionGenerationResult> {
    const questions: EstimatorQuestion[] = [];
    const blockingIssues: string[] = [];
    
    // Check if confidence threshold is met
    const confidenceThresholdMet = context.scope_item.confidence.score >= 85;
    
    // Generate questions based on ambiguities
    for (const ambiguity of context.ambiguities) {
      const question = await this.generateQuestionFromAmbiguity(ambiguity, context);
      questions.push(question);
      
      if (ambiguity.priority === 'high') {
        blockingIssues.push(ambiguity.description);
      }
    }
    
    // Generate questions based on low confidence factors
    if (!confidenceThresholdMet) {
      const confidenceQuestions = await this.generateConfidenceQuestions(context);
      questions.push(...confidenceQuestions);
    }
    
    // Generate specification questions
    const specQuestions = await this.generateSpecificationQuestions(context);
    questions.push(...specQuestions);
    
    // Generate quantity validation questions
    const quantityQuestions = await this.generateQuantityValidationQuestions(context);
    questions.push(...quantityQuestions);
    
    // Generate NSW compliance questions
    const complianceQuestions = await this.generateComplianceQuestions(context);
    questions.push(...complianceQuestions);
    
    // Sort questions by priority
    questions.sort((a, b) => {
      const priorityOrder = { 'high': 0, 'medium': 1, 'low': 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
    
    // Determine if we should proceed
    const shouldProceed = blockingIssues.length === 0 && confidenceThresholdMet;
    
    return {
      questions,
      should_proceed: shouldProceed,
      confidence_threshold_met: confidenceThresholdMet,
      blocking_issues: blockingIssues
    };
  }

  private async generateQuestionFromAmbiguity(
    ambiguity: Ambiguity, 
    context: QuestionContext
  ): Promise<EstimatorQuestion> {
    const options = ambiguity.possible_interpretations.map((interpretation, index) => ({
      id: `option_${index}`,
      text: interpretation,
      implications: this.getImplications(interpretation, context),
      confidence_adjustment: this.getConfidenceAdjustment(interpretation, ambiguity),
      cost_impact: this.getCostImpact(interpretation, context)
    }));
    
    const visualReferences = this.getVisualReferences(ambiguity, context);
    
    return {
      id: crypto.randomUUID(),
      type: 'clarification',
      scope_item_id: ambiguity.item_id,
      drawing_reference: context.drawing_references?.[0],
      question: ambiguity.suggested_question,
      context: this.buildQuestionContext(ambiguity, context),
      options,
      priority: ambiguity.priority,
      confidence_impact: ambiguity.confidence_impact,
      visual_references: visualReferences
    };
  }

  private async generateConfidenceQuestions(context: QuestionContext): Promise<EstimatorQuestion[]> {
    const questions: EstimatorQuestion[] = [];
    const uncertainties = context.scope_item.confidence.uncertaintyFactors || [];
    
    for (const uncertainty of uncertainties) {
      if (uncertainty.includes('Material type unclear')) {
        const materialQuestion = await this.generateMaterialSpecificationQuestion(context);
        questions.push(materialQuestion);
      }
      
      if (uncertainty.includes('Quantity calculation method unclear')) {
        const quantityQuestion = await this.generateQuantityMethodQuestion(context);
        questions.push(quantityQuestion);
      }
      
      if (uncertainty.includes('Location not specified')) {
        const locationQuestion = await this.generateLocationQuestion(context);
        questions.push(locationQuestion);
      }
    }
    
    return questions;
  }

  private async generateMaterialSpecificationQuestion(context: QuestionContext): Promise<EstimatorQuestion> {
    const scopeItem = context.scope_item;
    const description = scopeItem.description.toLowerCase();
    
    // Determine material category
    let materialCategory = 'general';
    let options: QuestionOption[] = [];
    
    if (description.includes('timber') || description.includes('wood')) {
      materialCategory = 'timber';
      options = this.generateTimberOptions(description);
    } else if (description.includes('concrete')) {
      materialCategory = 'concrete';
      options = this.generateConcreteOptions(description);
    } else if (description.includes('steel')) {
      materialCategory = 'steel';
      options = this.generateSteelOptions(description);
    } else if (description.includes('insulation')) {
      materialCategory = 'insulation';
      options = this.generateInsulationOptions(description);
    } else {
      options = this.generateGenericMaterialOptions(description);
    }
    
    return {
      id: crypto.randomUUID(),
      type: 'specification',
      scope_item_id: scopeItem.id,
      question: `What specific ${materialCategory} material should be used for "${scopeItem.description}"?`,
      context: this.buildMaterialContext(scopeItem, context),
      options,
      priority: 'high',
      confidence_impact: 30,
      visual_references: this.getDrawingReferences(context)
    };
  }

  private generateTimberOptions(description: string): QuestionOption[] {
    const options: QuestionOption[] = [];
    
    if (description.includes('structural') || description.includes('frame')) {
      this.nswMaterialStandards.timber.structural.forEach(grade => {
        options.push({
          id: `timber_${grade}`,
          text: `${grade} structural grade timber`,
          implications: [`Meets AS 1684 requirements for ${grade}`, `Suitable for structural applications`],
          confidence_adjustment: 20,
          cost_impact: grade.includes('F17') ? 'increase' : 'neutral'
        });
      });
    } else if (description.includes('cladding')) {
      this.nswMaterialStandards.timber.cladding.forEach(type => {
        options.push({
          id: `cladding_${type.replace(/\s+/g, '_')}`,
          text: type,
          implications: [`Suitable for external cladding`, `Weather resistant`],
          confidence_adjustment: 15,
          cost_impact: type.includes('Spotted Gum') ? 'increase' : 'neutral'
        });
      });
    } else {
      options.push({
        id: 'timber_standard',
        text: 'Standard construction grade timber',
        implications: ['Meets minimum building standards', 'Cost-effective option'],
        confidence_adjustment: 10,
        cost_impact: 'neutral'
      });
    }
    
    return options;
  }

  private generateConcreteOptions(description: string): QuestionOption[] {
    const options: QuestionOption[] = [];
    
    if (description.includes('residential') || description.includes('house')) {
      this.nswMaterialStandards.concrete.residential.forEach(grade => {
        options.push({
          id: `concrete_${grade}`,
          text: `${grade} concrete`,
          implications: [`AS 2870 compliant for residential use`, `${grade} MPa strength`],
          confidence_adjustment: 25,
          cost_impact: grade === 'N32' ? 'increase' : 'neutral'
        });
      });
    } else {
      this.nswMaterialStandards.concrete.commercial.forEach(grade => {
        options.push({
          id: `concrete_${grade}`,
          text: `${grade} concrete`,
          implications: [`AS 3600 compliant for commercial use`, `${grade} MPa strength`],
          confidence_adjustment: 25,
          cost_impact: parseInt(grade.substring(1)) > 32 ? 'increase' : 'neutral'
        });
      });
    }
    
    return options;
  }

  private generateSteelOptions(description: string): QuestionOption[] {
    const options: QuestionOption[] = [];
    
    if (description.includes('structural')) {
      this.nswMaterialStandards.steel.structural.forEach(grade => {
        options.push({
          id: `steel_${grade}`,
          text: `${grade} structural steel`,
          implications: [`AS 4100 compliant`, `High strength application`],
          confidence_adjustment: 20,
          cost_impact: 'neutral'
        });
      });
    } else if (description.includes('roof')) {
      this.nswMaterialStandards.steel.roofing.forEach(type => {
        options.push({
          id: `roof_${type}`,
          text: `${type} roofing`,
          implications: [`Weather resistant`, `Long-term durability`],
          confidence_adjustment: 15,
          cost_impact: type === 'COLORBOND' ? 'increase' : 'neutral'
        });
      });
    }
    
    return options;
  }

  private generateInsulationOptions(description: string): QuestionOption[] {
    const options: QuestionOption[] = [];
    
    this.nswMaterialStandards.insulation.bulk.forEach(rValue => {
      options.push({
        id: `insulation_${rValue}`,
        text: `${rValue} bulk insulation`,
        implications: [`Thermal performance: ${rValue}`, `NCC compliance for NSW climate`],
        confidence_adjustment: 20,
        cost_impact: parseFloat(rValue.substring(1)) > 3.5 ? 'increase' : 'neutral'
      });
    });
    
    return options;
  }

  private generateGenericMaterialOptions(description: string): QuestionOption[] {
    return [
      {
        id: 'standard_grade',
        text: 'Standard construction grade',
        implications: ['Meets minimum building standards', 'Cost-effective'],
        confidence_adjustment: 10,
        cost_impact: 'neutral'
      },
      {
        id: 'premium_grade',
        text: 'Premium/high-quality grade',
        implications: ['Exceeds minimum standards', 'Enhanced durability'],
        confidence_adjustment: 15,
        cost_impact: 'increase'
      },
      {
        id: 'contractor_selection',
        text: 'Contractor to select appropriate grade',
        implications: ['Professional selection', 'Based on specific requirements'],
        confidence_adjustment: 5,
        cost_impact: 'neutral'
      }
    ];
  }

  private async generateQuantityMethodQuestion(context: QuestionContext): Promise<EstimatorQuestion> {
    const scopeItem = context.scope_item;
    const measurementType = scopeItem.measurement_type;
    
    const options: QuestionOption[] = [];
    
    if (context.building_elements.length > 0) {
      options.push({
        id: 'measure_from_drawings',
        text: 'Calculate from architectural drawings',
        implications: ['Most accurate method', 'Based on scaled drawings'],
        confidence_adjustment: 30,
        cost_impact: 'neutral'
      });
    }
    
    if (scopeItem.quantity_requirements?.base_quantity) {
      options.push({
        id: 'use_specified_quantity',
        text: 'Use quantity specified in scope',
        implications: ['As per client specification', 'May require verification'],
        confidence_adjustment: 20,
        cost_impact: 'neutral'
      });
    }
    
    options.push({
      id: 'provisional_allowance',
      text: 'Use provisional allowance',
      implications: ['Conservative estimate', 'Subject to verification'],
      confidence_adjustment: 10,
      cost_impact: 'increase'
    });
    
    return {
      id: crypto.randomUUID(),
      type: 'clarification',
      scope_item_id: scopeItem.id,
      question: `How should I calculate the quantity for "${scopeItem.description}"?`,
      context: `Item requires ${measurementType} measurement. ${context.building_elements.length} relevant elements found on drawings.`,
      options,
      priority: 'high',
      confidence_impact: 25,
      visual_references: this.getDrawingReferences(context)
    };
  }

  private async generateLocationQuestion(context: QuestionContext): Promise<EstimatorQuestion> {
    const scopeItem = context.scope_item;
    const buildingElements = context.building_elements;
    
    const options: QuestionOption[] = [];
    
    // Generate location options based on building elements found
    const locations = [...new Set(buildingElements.map(el => el.location))];
    
    if (locations.length > 0) {
      locations.forEach(location => {
        options.push({
          id: `location_${location.replace(/\s+/g, '_')}`,
          text: location,
          implications: ['Specific location identified', 'Measurable from drawings'],
          confidence_adjustment: 20,
          cost_impact: 'neutral'
        });
      });
    }
    
    options.push({
      id: 'throughout_building',
      text: 'Throughout entire building',
      implications: ['All applicable areas', 'Comprehensive coverage'],
      confidence_adjustment: 15,
      cost_impact: 'increase'
    });
    
    options.push({
      id: 'as_shown_drawings',
      text: 'As shown on drawings',
      implications: ['Refer to architectural drawings', 'Professional interpretation'],
      confidence_adjustment: 10,
      cost_impact: 'neutral'
    });
    
    return {
      id: crypto.randomUUID(),
      type: 'clarification',
      scope_item_id: scopeItem.id,
      question: `Where specifically should "${scopeItem.description}" be installed?`,
      context: `${buildingElements.length} building elements found. Location affects quantity calculation.`,
      options,
      priority: 'medium',
      confidence_impact: 20,
      visual_references: this.getDrawingReferences(context)
    };
  }

  private async generateSpecificationQuestions(context: QuestionContext): Promise<EstimatorQuestion[]> {
    const questions: EstimatorQuestion[] = [];
    const scopeItem = context.scope_item;
    
    // Check if specifications are missing or unclear
    if (!scopeItem.specifications || scopeItem.specifications.length === 0) {
      const specQuestion = await this.generateMaterialSpecificationQuestion(context);
      questions.push(specQuestion);
    }
    
    // Check for installation method questions
    if (scopeItem.category === 'install' || scopeItem.category === 'supply_install') {
      const installQuestion = await this.generateInstallationMethodQuestion(context);
      questions.push(installQuestion);
    }
    
    return questions;
  }

  private async generateInstallationMethodQuestion(context: QuestionContext): Promise<EstimatorQuestion> {
    const scopeItem = context.scope_item;
    const description = scopeItem.description.toLowerCase();
    
    let options: QuestionOption[] = [];
    
    if (description.includes('wall') || description.includes('frame')) {
      options = this.nswConstructionMethods.wall_framing.map(method => ({
        id: `wall_${method.replace(/\s+/g, '_')}`,
        text: method,
        implications: [`${method} construction method`, 'Affects material requirements'],
        confidence_adjustment: 15,
        cost_impact: method.includes('Steel') ? 'increase' : 'neutral'
      }));
    } else if (description.includes('roof')) {
      options = this.nswConstructionMethods.roof_construction.map(method => ({
        id: `roof_${method.replace(/\s+/g, '_')}`,
        text: method,
        implications: [`${method} construction`, 'Affects structural requirements'],
        confidence_adjustment: 15,
        cost_impact: method.includes('Steel') ? 'increase' : 'neutral'
      }));
    }
    
    if (options.length === 0) {
      options = [
        {
          id: 'standard_method',
          text: 'Standard installation method',
          implications: ['Industry standard approach', 'Cost-effective'],
          confidence_adjustment: 10,
          cost_impact: 'neutral'
        },
        {
          id: 'contractor_method',
          text: 'Contractor to determine method',
          implications: ['Professional selection', 'Based on site conditions'],
          confidence_adjustment: 5,
          cost_impact: 'neutral'
        }
      ];
    }
    
    return {
      id: crypto.randomUUID(),
      type: 'specification',
      scope_item_id: scopeItem.id,
      question: `What installation method should be used for "${scopeItem.description}"?`,
      context: this.buildInstallationContext(scopeItem, context),
      options,
      priority: 'medium',
      confidence_impact: 15,
      visual_references: this.getDrawingReferences(context)
    };
  }

  private async generateQuantityValidationQuestions(context: QuestionContext): Promise<EstimatorQuestion[]> {
    const questions: EstimatorQuestion[] = [];
    const scopeItem = context.scope_item;
    
    // If quantity seems unusually high or low, ask for validation
    if (scopeItem.quantity_requirements?.base_quantity) {
      const baseQty = scopeItem.quantity_requirements.base_quantity;
      const unit = scopeItem.quantity_requirements.unit;
      
      if (this.isQuantityUnusual(baseQty, unit, scopeItem.description)) {
        const validationQuestion = await this.generateQuantityValidationQuestion(context);
        questions.push(validationQuestion);
      }
    }
    
    return questions;
  }

  private async generateQuantityValidationQuestion(context: QuestionContext): Promise<EstimatorQuestion> {
    const scopeItem = context.scope_item;
    const baseQty = scopeItem.quantity_requirements?.base_quantity || 0;
    const unit = scopeItem.quantity_requirements?.unit || 'each';
    
    const options: QuestionOption[] = [
      {
        id: 'confirm_quantity',
        text: `Confirm ${baseQty} ${unit}`,
        implications: ['Quantity as specified', 'Proceed with calculation'],
        confidence_adjustment: 20,
        cost_impact: 'neutral'
      },
      {
        id: 'verify_from_drawings',
        text: 'Verify quantity from drawings',
        implications: ['Re-calculate from architectural drawings', 'More accurate measurement'],
        confidence_adjustment: 25,
        cost_impact: 'neutral'
      },
      {
        id: 'request_clarification',
        text: 'Request clarification from client',
        implications: ['Confirm requirements', 'Avoid estimation errors'],
        confidence_adjustment: 15,
        cost_impact: 'neutral'
      }
    ];
    
    return {
      id: crypto.randomUUID(),
      type: 'assumption_validation',
      scope_item_id: scopeItem.id,
      question: `The quantity ${baseQty} ${unit} seems unusual for "${scopeItem.description}". Please confirm:`,
      context: `Quantity validation required for accurate estimation.`,
      options,
      priority: 'high',
      confidence_impact: 20,
      visual_references: this.getDrawingReferences(context)
    };
  }

  private async generateComplianceQuestions(context: QuestionContext): Promise<EstimatorQuestion[]> {
    const questions: EstimatorQuestion[] = [];
    const scopeItem = context.scope_item;
    const description = scopeItem.description.toLowerCase();
    
    // Check for structural compliance requirements
    if (description.includes('structural') || description.includes('load bearing')) {
      const structuralQuestion = await this.generateStructuralComplianceQuestion(context);
      questions.push(structuralQuestion);
    }
    
    // Check for fire rating requirements
    if (description.includes('fire') || description.includes('rating')) {
      const fireQuestion = await this.generateFireComplianceQuestion(context);
      questions.push(fireQuestion);
    }
    
    return questions;
  }

  private async generateStructuralComplianceQuestion(context: QuestionContext): Promise<EstimatorQuestion> {
    const scopeItem = context.scope_item;
    
    const options: QuestionOption[] = [
      {
        id: 'engineer_certified',
        text: 'Structural engineer certified design',
        implications: ['Professional certification', 'Complies with AS 1684/AS 4100'],
        confidence_adjustment: 30,
        cost_impact: 'increase'
      },
      {
        id: 'standard_residential',
        text: 'Standard residential construction',
        implications: ['AS 1684 deemed-to-comply', 'Standard span tables'],
        confidence_adjustment: 20,
        cost_impact: 'neutral'
      },
      {
        id: 'requires_assessment',
        text: 'Requires structural assessment',
        implications: ['Professional evaluation needed', 'May require engineer'],
        confidence_adjustment: 10,
        cost_impact: 'increase'
      }
    ];
    
    return {
      id: crypto.randomUUID(),
      type: 'specification',
      scope_item_id: scopeItem.id,
      question: `What structural compliance is required for "${scopeItem.description}"?`,
      context: 'Structural items require compliance with Australian Standards.',
      options,
      priority: 'high',
      confidence_impact: 25,
      visual_references: this.getDrawingReferences(context)
    };
  }

  private async generateFireComplianceQuestion(context: QuestionContext): Promise<EstimatorQuestion> {
    const scopeItem = context.scope_item;
    
    const options: QuestionOption[] = [
      {
        id: 'fire_rated_system',
        text: 'Fire-rated system required',
        implications: ['Certified fire-rated materials', 'NCC compliance'],
        confidence_adjustment: 25,
        cost_impact: 'increase'
      },
      {
        id: 'standard_materials',
        text: 'Standard construction materials',
        implications: ['No special fire rating', 'Standard materials acceptable'],
        confidence_adjustment: 15,
        cost_impact: 'neutral'
      },
      {
        id: 'requires_verification',
        text: 'Fire rating requires verification',
        implications: ['Check building classification', 'Confirm NCC requirements'],
        confidence_adjustment: 10,
        cost_impact: 'neutral'
      }
    ];
    
    return {
      id: crypto.randomUUID(),
      type: 'specification',
      scope_item_id: scopeItem.id,
      question: `What fire rating is required for "${scopeItem.description}"?`,
      context: 'Fire-rated construction requires certified materials and methods.',
      options,
      priority: 'high',
      confidence_impact: 20,
      visual_references: this.getDrawingReferences(context)
    };
  }

  // Helper methods
  private getImplications(interpretation: string, context: QuestionContext): string[] {
    const implications: string[] = [];
    
    if (interpretation.includes('standard')) {
      implications.push('Cost-effective option');
      implications.push('Meets minimum requirements');
    }
    
    if (interpretation.includes('premium') || interpretation.includes('high')) {
      implications.push('Higher quality option');
      implications.push('Increased cost');
    }
    
    if (interpretation.includes('contractor')) {
      implications.push('Professional selection');
      implications.push('Based on site conditions');
    }
    
    return implications;
  }

  private getConfidenceAdjustment(interpretation: string, ambiguity: Ambiguity): number {
    if (interpretation.includes('standard') || interpretation.includes('typical')) {
      return 20;
    }
    
    if (interpretation.includes('premium') || interpretation.includes('specific')) {
      return 25;
    }
    
    if (interpretation.includes('contractor') || interpretation.includes('professional')) {
      return 15;
    }
    
    return 10;
  }

  private getCostImpact(interpretation: string, context: QuestionContext): 'increase' | 'decrease' | 'neutral' {
    if (interpretation.includes('premium') || interpretation.includes('high') || interpretation.includes('certified')) {
      return 'increase';
    }
    
    if (interpretation.includes('budget') || interpretation.includes('economy')) {
      return 'decrease';
    }
    
    return 'neutral';
  }

  private getVisualReferences(ambiguity: Ambiguity, context: QuestionContext): string[] {
    const references: string[] = [];
    
    if (context.drawing_references) {
      references.push(...context.drawing_references);
    }
    
    if (context.building_elements.length > 0) {
      references.push(`${context.building_elements.length} building elements found on drawings`);
    }
    
    return references;
  }

  private buildQuestionContext(ambiguity: Ambiguity, context: QuestionContext): string {
    let contextText = ambiguity.description;
    
    if (context.building_elements.length > 0) {
      contextText += ` Found ${context.building_elements.length} relevant elements on drawings.`;
    }
    
    if (context.project_type) {
      contextText += ` Project type: ${context.project_type}.`;
    }
    
    return contextText;
  }

  private buildMaterialContext(scopeItem: ScopeItem, context: QuestionContext): string {
    let contextText = `Material specification required for "${scopeItem.description}".`;
    
    if (context.project_type) {
      contextText += ` Project type: ${context.project_type}.`;
    }
    
    if (context.location) {
      contextText += ` Location: ${context.location} (NSW compliance applies).`;
    }
    
    return contextText;
  }

  private buildInstallationContext(scopeItem: ScopeItem, context: QuestionContext): string {
    let contextText = `Installation method affects material requirements and cost.`;
    
    if (context.building_elements.length > 0) {
      contextText += ` ${context.building_elements.length} building elements found on drawings.`;
    }
    
    return contextText;
  }

  private getDrawingReferences(context: QuestionContext): string[] {
    const references: string[] = [];
    
    if (context.drawing_references) {
      references.push(...context.drawing_references);
    }
    
    const elementTypes = [...new Set(context.building_elements.map(el => el.type))];
    if (elementTypes.length > 0) {
      references.push(`Elements found: ${elementTypes.join(', ')}`);
    }
    
    return references;
  }

  private isQuantityUnusual(quantity: number, unit: string, description: string): boolean {
    const desc = description.toLowerCase();
    
    // Check for unusually high quantities
    if (unit === 'm²' && quantity > 1000 && desc.includes('residential')) {
      return true; // Large area for residential
    }
    
    if (unit === 'lm' && quantity > 500 && desc.includes('skirting')) {
      return true; // Excessive skirting length
    }
    
    if (unit === 'each' && quantity > 50 && desc.includes('door')) {
      return true; // Too many doors
    }
    
    // Check for unusually low quantities
    if (unit === 'm²' && quantity < 1 && desc.includes('floor')) {
      return true; // Very small floor area
    }
    
    return false;
  }
}

export const questionGenerator = QuestionGenerator.getInstance();