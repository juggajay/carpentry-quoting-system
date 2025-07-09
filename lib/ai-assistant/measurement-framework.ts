import { 
  ScopeItem, 
  BuildingElement, 
  QuantityRequirement, 
  ConfidenceLevel, 
  getConfidenceLevel 
} from './types';

export interface MeasurementResult {
  quantity: number;
  unit: string;
  calculation_method: string;
  assumptions: string[];
  confidence: ConfidenceLevel;
  waste_included: boolean;
  base_quantity: number;
  waste_factor: number;
  access_factor: number;
  complexity_factor: number;
  australian_standards_notes?: string[];
}

export interface MeasurementContext {
  scope_item: ScopeItem;
  building_elements: BuildingElement[];
  drawing_scale?: string;
  location_context?: string;
  building_type?: 'residential' | 'commercial' | 'industrial';
  construction_method?: 'timber_frame' | 'steel_frame' | 'concrete' | 'masonry';
}

export class MeasurementFramework {
  private static instance: MeasurementFramework;
  
  // Australian waste factors by material type
  private readonly australianWasteFactors = {
    timber: {
      framing: 0.10,
      flooring: 0.08,
      cladding: 0.12,
      trim: 0.15,
      decking: 0.10
    },
    steel: {
      framing: 0.05,
      roofing: 0.08,
      cladding: 0.10,
      reinforcement: 0.06
    },
    concrete: {
      footings: 0.05,
      slabs: 0.03,
      walls: 0.08,
      columns: 0.10
    },
    masonry: {
      brickwork: 0.05,
      blockwork: 0.08,
      stone: 0.10
    },
    roofing: {
      tiles: 0.12,
      metal: 0.08,
      membrane: 0.10
    },
    insulation: {
      bulk: 0.10,
      reflective: 0.08,
      board: 0.12
    },
    cladding: {
      weatherboard: 0.12,
      fibre_cement: 0.10,
      metal: 0.08
    },
    flooring: {
      timber: 0.08,
      tiles: 0.10,
      vinyl: 0.05,
      carpet: 0.08
    }
  };

  // NSW climate and access factors
  private readonly nswFactors = {
    climate: {
      coastal: 1.05, // Additional protection needed
      inland: 1.02,
      mountain: 1.08
    },
    access: {
      ground_level: 1.0,
      first_floor: 1.1,
      second_floor: 1.2,
      confined_space: 1.3,
      difficult_access: 1.4,
      crane_required: 1.5
    },
    complexity: {
      standard: 1.0,
      medium: 1.2,
      complex: 1.5,
      custom: 1.8
    }
  };

  // Australian standard specifications
  private readonly australianStandards = {
    'AS 1684': {
      description: 'Residential timber-framed construction',
      min_timber_grade: 'F5',
      max_span_tables: true,
      deflection_limits: 'L/300 live, L/250 total'
    },
    'AS 2870': {
      description: 'Residential slabs and footings',
      min_concrete_grade: 'N20',
      reinforcement: 'SL92 mesh minimum',
      thickness: '100mm minimum'
    },
    'AS 3600': {
      description: 'Concrete structures',
      min_grade: 'N25',
      cover: '20mm minimum',
      reinforcement_grade: 'N12 minimum'
    }
  };

  private constructor() {}

  static getInstance(): MeasurementFramework {
    if (!MeasurementFramework.instance) {
      MeasurementFramework.instance = new MeasurementFramework();
    }
    return MeasurementFramework.instance;
  }

  async calculateQuantity(context: MeasurementContext): Promise<MeasurementResult> {
    const { scope_item, building_elements } = context;
    
    switch (scope_item.measurement_type) {
      case 'linear':
        return this.calculateLinearQuantity(context);
      case 'area':
        return this.calculateAreaQuantity(context);
      case 'volume':
        return this.calculateVolumeQuantity(context);
      case 'count':
        return this.calculateCountQuantity(context);
      case 'assembly':
        return this.calculateAssemblyQuantity(context);
      default:
        throw new Error(`Unsupported measurement type: ${scope_item.measurement_type}`);
    }
  }

  private async calculateLinearQuantity(context: MeasurementContext): Promise<MeasurementResult> {
    const { scope_item, building_elements } = context;
    const assumptions: string[] = [];
    let baseQuantity = 0;
    let calculationMethod = '';
    
    // Find relevant building elements
    const relevantElements = building_elements.filter(element => 
      this.isElementRelevant(scope_item, element)
    );
    
    if (relevantElements.length === 0) {
      assumptions.push('No relevant building elements found on drawings');
      baseQuantity = scope_item.quantity_requirements?.base_quantity || 0;
      calculationMethod = 'Using scope-specified quantity (no drawing reference)';
    } else {
      // Calculate from building elements
      for (const element of relevantElements) {
        if (element.type === 'wall') {
          // Wall perimeter calculation
          const perimeter = this.calculateWallPerimeter(element);
          baseQuantity += perimeter;
          calculationMethod = 'Wall perimeter calculation from drawings';
        } else if (element.type === 'beam' || element.type === 'column') {
          // Structural element length
          const length = element.dimensions?.length || 0;
          baseQuantity += length;
          calculationMethod = 'Structural element length from drawings';
        } else {
          // Generic linear calculation
          const length = element.dimensions?.length || 0;
          baseQuantity += length;
          calculationMethod = 'Linear measurement from drawings';
        }
      }
    }
    
    // Apply waste factors
    const wasteFactor = this.determineWasteFactor(scope_item);
    const accessFactor = this.determineAccessFactor(context);
    const complexityFactor = this.determineComplexityFactor(context);
    
    const adjustedQuantity = baseQuantity * (1 + wasteFactor) * accessFactor * complexityFactor;
    
    // Calculate confidence
    const confidence = this.calculateMeasurementConfidence(
      baseQuantity,
      relevantElements.length,
      assumptions,
      scope_item
    );
    
    // Add NSW-specific notes
    const nswNotes = this.getNSWComplianceNotes(scope_item, 'linear');
    
    return {
      quantity: Math.round(adjustedQuantity * 100) / 100, // Round to 2 decimal places
      unit: 'lm',
      calculation_method: calculationMethod,
      assumptions,
      confidence,
      waste_included: wasteFactor > 0,
      base_quantity: baseQuantity,
      waste_factor: wasteFactor,
      access_factor: accessFactor,
      complexity_factor: complexityFactor,
      australian_standards_notes: nswNotes
    };
  }

  private async calculateAreaQuantity(context: MeasurementContext): Promise<MeasurementResult> {
    const { scope_item, building_elements } = context;
    const assumptions: string[] = [];
    let baseQuantity = 0;
    let calculationMethod = '';
    
    const relevantElements = building_elements.filter(element => 
      this.isElementRelevant(scope_item, element)
    );
    
    if (relevantElements.length === 0) {
      assumptions.push('No relevant building elements found on drawings');
      baseQuantity = scope_item.quantity_requirements?.base_quantity || 0;
      calculationMethod = 'Using scope-specified quantity (no drawing reference)';
    } else {
      for (const element of relevantElements) {
        if (element.type === 'wall') {
          const area = this.calculateWallArea(element);
          baseQuantity += area;
          calculationMethod = 'Wall area calculation from drawings';
        } else if (element.type === 'floor' || element.type === 'ceiling') {
          const area = element.dimensions?.area || 
                      (element.dimensions?.length || 0) * (element.dimensions?.width || 0);
          baseQuantity += area;
          calculationMethod = 'Floor/ceiling area calculation from drawings';
        } else if (element.type === 'roof') {
          const area = this.calculateRoofArea(element);
          baseQuantity += area;
          calculationMethod = 'Roof area calculation from drawings (with pitch factor)';
        } else {
          const area = element.dimensions?.area || 0;
          baseQuantity += area;
          calculationMethod = 'Area calculation from drawings';
        }
      }
    }
    
    // Apply factors
    const wasteFactor = this.determineWasteFactor(scope_item);
    const accessFactor = this.determineAccessFactor(context);
    const complexityFactor = this.determineComplexityFactor(context);
    
    const adjustedQuantity = baseQuantity * (1 + wasteFactor) * accessFactor * complexityFactor;
    
    const confidence = this.calculateMeasurementConfidence(
      baseQuantity,
      relevantElements.length,
      assumptions,
      scope_item
    );
    
    const nswNotes = this.getNSWComplianceNotes(scope_item, 'area');
    
    return {
      quantity: Math.round(adjustedQuantity * 100) / 100,
      unit: 'm²',
      calculation_method: calculationMethod,
      assumptions,
      confidence,
      waste_included: wasteFactor > 0,
      base_quantity: baseQuantity,
      waste_factor: wasteFactor,
      access_factor: accessFactor,
      complexity_factor: complexityFactor,
      australian_standards_notes: nswNotes
    };
  }

  private async calculateVolumeQuantity(context: MeasurementContext): Promise<MeasurementResult> {
    const { scope_item, building_elements } = context;
    const assumptions: string[] = [];
    let baseQuantity = 0;
    let calculationMethod = '';
    
    const relevantElements = building_elements.filter(element => 
      this.isElementRelevant(scope_item, element)
    );
    
    if (relevantElements.length === 0) {
      assumptions.push('No relevant building elements found on drawings');
      baseQuantity = scope_item.quantity_requirements?.base_quantity || 0;
      calculationMethod = 'Using scope-specified quantity (no drawing reference)';
    } else {
      for (const element of relevantElements) {
        if (element.type === 'wall' && scope_item.description.match(/\b(concrete|fill|insulation)\b/i)) {
          // Wall volume calculation
          const area = this.calculateWallArea(element);
          const thickness = this.extractThickness(scope_item.description) || 0.1; // Default 100mm
          const volume = area * thickness;
          baseQuantity += volume;
          calculationMethod = 'Wall volume calculation (area × thickness)';
          assumptions.push(`Assumed thickness: ${thickness * 1000}mm`);
        } else {
          // Generic volume calculation
          const length = element.dimensions?.length || 0;
          const width = element.dimensions?.width || 0;
          const height = element.dimensions?.height || 0;
          const volume = length * width * height;
          baseQuantity += volume;
          calculationMethod = 'Volume calculation from drawings';
        }
      }
    }
    
    // Apply factors
    const wasteFactor = this.determineWasteFactor(scope_item);
    const accessFactor = this.determineAccessFactor(context);
    const complexityFactor = this.determineComplexityFactor(context);
    
    const adjustedQuantity = baseQuantity * (1 + wasteFactor) * accessFactor * complexityFactor;
    
    const confidence = this.calculateMeasurementConfidence(
      baseQuantity,
      relevantElements.length,
      assumptions,
      scope_item
    );
    
    const nswNotes = this.getNSWComplianceNotes(scope_item, 'volume');
    
    return {
      quantity: Math.round(adjustedQuantity * 100) / 100,
      unit: 'm³',
      calculation_method: calculationMethod,
      assumptions,
      confidence,
      waste_included: wasteFactor > 0,
      base_quantity: baseQuantity,
      waste_factor: wasteFactor,
      access_factor: accessFactor,
      complexity_factor: complexityFactor,
      australian_standards_notes: nswNotes
    };
  }

  private async calculateCountQuantity(context: MeasurementContext): Promise<MeasurementResult> {
    const { scope_item, building_elements } = context;
    const assumptions: string[] = [];
    let baseQuantity = 0;
    let calculationMethod = '';
    
    const relevantElements = building_elements.filter(element => 
      this.isElementRelevant(scope_item, element)
    );
    
    if (relevantElements.length === 0) {
      assumptions.push('No relevant building elements found on drawings');
      baseQuantity = scope_item.quantity_requirements?.base_quantity || 1;
      calculationMethod = 'Using scope-specified quantity (no drawing reference)';
    } else {
      baseQuantity = relevantElements.length;
      calculationMethod = 'Count of elements from drawings';
    }
    
    // For count items, waste is usually minimal or zero
    const wasteFactor = 0.05; // 5% allowance for breakage/extras
    const accessFactor = this.determineAccessFactor(context);
    const complexityFactor = this.determineComplexityFactor(context);
    
    const adjustedQuantity = Math.ceil(baseQuantity * (1 + wasteFactor) * accessFactor * complexityFactor);
    
    const confidence = this.calculateMeasurementConfidence(
      baseQuantity,
      relevantElements.length,
      assumptions,
      scope_item
    );
    
    const nswNotes = this.getNSWComplianceNotes(scope_item, 'count');
    
    return {
      quantity: adjustedQuantity,
      unit: 'each',
      calculation_method: calculationMethod,
      assumptions,
      confidence,
      waste_included: wasteFactor > 0,
      base_quantity: baseQuantity,
      waste_factor: wasteFactor,
      access_factor: accessFactor,
      complexity_factor: complexityFactor,
      australian_standards_notes: nswNotes
    };
  }

  private async calculateAssemblyQuantity(context: MeasurementContext): Promise<MeasurementResult> {
    const { scope_item, building_elements } = context;
    const assumptions: string[] = [];
    let baseQuantity = 0;
    let calculationMethod = '';
    
    // Assembly items require multiple measurement types
    assumptions.push('Assembly item requires multiple measurement calculations');
    
    const relevantElements = building_elements.filter(element => 
      this.isElementRelevant(scope_item, element)
    );
    
    if (relevantElements.length === 0) {
      assumptions.push('No relevant building elements found on drawings');
      baseQuantity = scope_item.quantity_requirements?.base_quantity || 1;
      calculationMethod = 'Using scope-specified quantity (complex assembly)';
    } else {
      // For assemblies, we typically count the number of complete assemblies
      baseQuantity = relevantElements.length;
      calculationMethod = 'Count of complete assemblies from drawings';
    }
    
    const wasteFactor = 0.15; // Higher waste factor for complex assemblies
    const accessFactor = this.determineAccessFactor(context);
    const complexityFactor = this.determineComplexityFactor(context);
    
    const adjustedQuantity = Math.ceil(baseQuantity * (1 + wasteFactor) * accessFactor * complexityFactor);
    
    const confidence = this.calculateMeasurementConfidence(
      baseQuantity,
      relevantElements.length,
      assumptions,
      scope_item
    );
    
    const nswNotes = this.getNSWComplianceNotes(scope_item, 'assembly');
    
    return {
      quantity: adjustedQuantity,
      unit: 'item',
      calculation_method: calculationMethod,
      assumptions,
      confidence,
      waste_included: wasteFactor > 0,
      base_quantity: baseQuantity,
      waste_factor: wasteFactor,
      access_factor: accessFactor,
      complexity_factor: complexityFactor,
      australian_standards_notes: nswNotes
    };
  }

  private isElementRelevant(scopeItem: ScopeItem, element: BuildingElement): boolean {
    const description = scopeItem.description.toLowerCase();
    const elementType = element.type.toLowerCase();
    
    // Check for direct type matches
    if (description.includes(elementType)) return true;
    
    // Check for material/category matches
    if (description.includes('wall') && elementType === 'wall') return true;
    if (description.includes('floor') && elementType === 'floor') return true;
    if (description.includes('ceiling') && elementType === 'ceiling') return true;
    if (description.includes('roof') && elementType === 'roof') return true;
    if (description.includes('door') && elementType === 'door') return true;
    if (description.includes('window') && elementType === 'window') return true;
    
    // Check for location matches
    if (scopeItem.location && element.location.toLowerCase().includes(scopeItem.location.toLowerCase())) {
      return true;
    }
    
    return false;
  }

  private calculateWallPerimeter(element: BuildingElement): number {
    // Calculate wall perimeter from dimensions
    const length = element.dimensions?.length || 0;
    const width = element.dimensions?.width || 0;
    
    if (length && width) {
      return 2 * (length + width);
    } else if (length) {
      return length;
    }
    
    return 0;
  }

  private calculateWallArea(element: BuildingElement): number {
    const length = element.dimensions?.length || 0;
    const height = element.dimensions?.height || 2.7; // Standard ceiling height
    
    return length * height;
  }

  private calculateRoofArea(element: BuildingElement): number {
    const area = element.dimensions?.area || 0;
    const pitchFactor = 1.4; // Typical roof pitch factor for NSW
    
    return area * pitchFactor;
  }

  private extractThickness(description: string): number | null {
    const thicknessMatch = description.match(/(\d+)\s*mm/);
    if (thicknessMatch) {
      return parseInt(thicknessMatch[1]) / 1000; // Convert mm to m
    }
    return null;
  }

  private determineWasteFactor(scopeItem: ScopeItem): number {
    const description = scopeItem.description.toLowerCase();
    
    // Check for material-specific waste factors
    for (const [material, factors] of Object.entries(this.australianWasteFactors)) {
      if (description.includes(material)) {
        // Use first matching factor or default
        const factorKeys = Object.keys(factors);
        for (const key of factorKeys) {
          if (description.includes(key)) {
            return factors[key as keyof typeof factors];
          }
        }
        // Return first factor if no specific match
        return Object.values(factors)[0];
      }
    }
    
    // Default waste factor
    return 0.10;
  }

  private determineAccessFactor(context: MeasurementContext): number {
    const description = context.scope_item.description.toLowerCase();
    
    if (description.includes('ground') || description.includes('slab')) {
      return this.nswFactors.access.ground_level;
    }
    
    if (description.includes('first floor') || description.includes('upper')) {
      return this.nswFactors.access.first_floor;
    }
    
    if (description.includes('second floor') || description.includes('high')) {
      return this.nswFactors.access.second_floor;
    }
    
    if (description.includes('confined') || description.includes('tight') || description.includes('restricted')) {
      return this.nswFactors.access.confined_space;
    }
    
    if (description.includes('difficult') || description.includes('awkward')) {
      return this.nswFactors.access.difficult_access;
    }
    
    return this.nswFactors.access.ground_level;
  }

  private determineComplexityFactor(context: MeasurementContext): number {
    const description = context.scope_item.description.toLowerCase();
    
    if (description.includes('custom') || description.includes('bespoke') || description.includes('unique')) {
      return this.nswFactors.complexity.custom;
    }
    
    if (description.includes('complex') || description.includes('intricate') || description.includes('detailed')) {
      return this.nswFactors.complexity.complex;
    }
    
    if (description.includes('medium') || description.includes('moderate')) {
      return this.nswFactors.complexity.medium;
    }
    
    return this.nswFactors.complexity.standard;
  }

  private calculateMeasurementConfidence(
    baseQuantity: number,
    elementsFound: number,
    assumptions: string[],
    scopeItem: ScopeItem
  ): ConfidenceLevel {
    let score = 70; // Base confidence
    
    // Adjust based on drawing data availability
    if (elementsFound > 0) {
      score += 20; // Drawing data available
    } else {
      score -= 30; // No drawing data
    }
    
    // Adjust based on base quantity
    if (baseQuantity > 0) {
      score += 10; // Quantity calculated
    } else {
      score -= 20; // No quantity calculated
    }
    
    // Adjust based on assumptions
    score -= assumptions.length * 5; // Penalty for each assumption
    
    // Adjust based on scope item confidence
    score = (score + scopeItem.confidence.score) / 2; // Average with scope confidence
    
    score = Math.max(0, Math.min(100, score));
    
    const reasons = [
      `${elementsFound} building elements found on drawings`,
      `Base quantity: ${baseQuantity}`,
      `${assumptions.length} assumptions made`
    ];
    
    const uncertaintyFactors = assumptions.length > 0 ? assumptions : undefined;
    
    return getConfidenceLevel(score, reasons, uncertaintyFactors);
  }

  private getNSWComplianceNotes(scopeItem: ScopeItem, measurementType: string): string[] {
    const notes: string[] = [];
    const description = scopeItem.description.toLowerCase();
    
    // Structural compliance
    if (description.includes('structural') || description.includes('load bearing')) {
      notes.push('AS 1684 compliance required for timber framing');
      notes.push('Structural engineer certification may be required');
    }
    
    // Concrete compliance
    if (description.includes('concrete') || description.includes('footing')) {
      notes.push('AS 2870 compliance required for residential slabs');
      notes.push('Minimum N20 concrete grade required');
    }
    
    // Fire rating
    if (description.includes('fire') || description.includes('rating')) {
      notes.push('NCC fire rating compliance required');
      notes.push('Certified fire-rated materials must be used');
    }
    
    // Thermal performance
    if (description.includes('insulation') || description.includes('thermal')) {
      notes.push('NCC thermal performance requirements apply');
      notes.push('R-value calculations required for Building Code compliance');
    }
    
    // Waterproofing
    if (description.includes('waterproof') || description.includes('membrane')) {
      notes.push('AS 3740 waterproofing standards apply');
      notes.push('Licensed waterproofer required for wet areas');
    }
    
    return notes;
  }
}

export const measurementFramework = MeasurementFramework.getInstance();