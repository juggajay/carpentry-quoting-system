import { 
  ScopeAnalysis, 
  ScopeItem, 
  Ambiguity, 
  QuantityRequirement, 
  ConfidenceLevel, 
  getConfidenceLevel 
} from './types';

export class ScopeParser {
  private static instance: ScopeParser;
  
  // NSW construction patterns and standards
  private readonly nswStandards = {
    'AS 1684': 'Residential timber-framed construction',
    'AS 2870': 'Residential slabs and footings',
    'AS 3600': 'Concrete structures',
    'AS 4100': 'Steel structures',
    'NCC': 'National Construction Code'
  };

  private readonly materialPatterns = {
    timber: /\b(timber|pine|hardwood|lvl|glulam|treated|h[1-4]|f[1-4]|mg|mgo|plywood|ply|osb|particle|chipboard|mdf)\b/i,
    steel: /\b(steel|galvanised|zincalume|colorbond|rhs|shs|uc|ub|pfc|angle|flat|bar|mesh|rebar|reinforcement)\b/i,
    concrete: /\b(concrete|cement|mortar|grout|screed|render|n[1-9][0-9]|m[1-9][0-9]|mpa|slump|aggregate)\b/i,
    insulation: /\b(insulation|bulk|reflective|polyester|glasswool|rockwool|eps|xps|pir|puf|sarking)\b/i,
    roofing: /\b(roofing|tiles|metal|colorbond|gutters|downpipes|ridge|flashing|fascia|soffit|bargeboard)\b/i,
    cladding: /\b(cladding|weatherboard|fibre|cement|brick|stone|render|eifs|acrylic|texture)\b/i,
    doors: /\b(door|frame|architrave|jamb|head|sill|handle|lock|hinge|stopper|weather|seal)\b/i,
    windows: /\b(window|glazing|glass|frame|sash|reveal|sill|head|jamb|flashing|seal|hardware)\b/i,
    hardware: /\b(nails|screws|bolts|brackets|joist|hanger|strap|tie|anchor|fixing|fastener)\b/i,
    electrical: /\b(electrical|power|lighting|switch|outlet|circuit|cable|conduit|meter|switchboard)\b/i,
    plumbing: /\b(plumbing|pipe|fitting|valve|tap|basin|shower|toilet|drain|waste|vent)\b/i,
    flooring: /\b(flooring|floor|slab|screed|tiles|carpet|timber|vinyl|laminate|underlay|skirting)\b/i
  };

  private readonly actionPatterns = {
    supply: /\b(supply|provide|deliver|source|obtain|purchase|spec|specify)\b/i,
    install: /\b(install|fix|mount|attach|connect|fit|place|position|erect|construct|build)\b/i,
    demolish: /\b(demolish|remove|strip|clear|take|dismantle|break|cut)\b/i,
    prepare: /\b(prepare|prep|clean|level|excavate|compact|prime|seal|treat)\b/i,
    repair: /\b(repair|patch|fix|restore|replace|maintain|service)\b/i
  };

  private readonly measurementPatterns = {
    linear: /\b(lm|linear|metre|meter|lineal|length|perimeter|run|running)\b/i,
    area: /\b(m2|m²|sqm|square|area|coverage|face|surface)\b/i,
    volume: /\b(m3|m³|cubic|volume|capacity|bulk|solid)\b/i,
    count: /\b(each|ea|no|nr|number|item|pcs|pieces|units|qty|quantity)\b/i,
    weight: /\b(kg|kilogram|tonne|ton|weight|mass)\b/i
  };

  private readonly dimensionPatterns = {
    // Matches dimensions like "90x45", "19mm", "2400x1200", etc.
    dimensions: /\b(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)\s*(?:x\s*(\d+(?:\.\d+)?))?\s*(mm|m)?\b/gi,
    thickness: /\b(\d+(?:\.\d+)?)\s*(mm|m)\b/gi,
    length: /\b(\d+(?:\.\d+)?)\s*(m|mm|lm)\b/gi,
    area: /\b(\d+(?:\.\d+)?)\s*(m2|m²|sqm)\b/gi,
    volume: /\b(\d+(?:\.\d+)?)\s*(m3|m³|cum)\b/gi
  };

  private readonly locationPatterns = {
    room: /\b(kitchen|bathroom|bedroom|living|dining|laundry|garage|office|study|toilet|ensuite|pantry|entry|hallway|corridor|stairwell|balcony|deck|patio|verandah)\b/i,
    level: /\b(ground|first|second|third|upper|lower|basement|mezzanine|level|floor|storey)\b/i,
    orientation: /\b(north|south|east|west|front|rear|back|side|left|right|internal|external)\b/i,
    structural: /\b(wall|ceiling|floor|roof|foundation|footing|beam|column|joist|rafter|stud|plate|lintel)\b/i
  };

  private constructor() {}

  static getInstance(): ScopeParser {
    if (!ScopeParser.instance) {
      ScopeParser.instance = new ScopeParser();
    }
    return ScopeParser.instance;
  }

  async parseScope(scopeText: string): Promise<ScopeAnalysis> {
    const id = crypto.randomUUID();
    const extractedItems: ScopeItem[] = [];
    const ambiguities: Ambiguity[] = [];
    
    // Clean and normalize the scope text
    const normalizedText = this.normalizeText(scopeText);
    
    // Split into logical sections/items
    const sections = this.splitIntoSections(normalizedText);
    
    // Process each section
    for (const section of sections) {
      const scopeItem = await this.processScopeSection(section);
      extractedItems.push(scopeItem);
      
      // Check for ambiguities in this item
      const itemAmbiguities = this.identifyAmbiguities(scopeItem, section);
      ambiguities.push(...itemAmbiguities);
    }
    
    // Calculate overall completeness and confidence
    const completeness = this.calculateCompleteness(extractedItems);
    const confidence = this.calculateOverallConfidence(extractedItems, ambiguities);
    
    // Check NSW compliance requirements
    const nswComplianceNotes = this.checkNSWCompliance(extractedItems);
    
    return {
      id,
      originalScope: scopeText,
      extractedItems,
      ambiguities,
      completeness,
      confidence,
      nsw_compliance_notes: nswComplianceNotes
    };
  }

  private normalizeText(text: string): string {
    return text
      .replace(/\r\n/g, '\n') // Normalize line endings
      .replace(/\t/g, ' ') // Replace tabs with spaces
      .replace(/[ ]{2,}/g, ' ') // Replace multiple spaces with single space (but keep newlines)
      .trim();
  }

  private splitIntoSections(text: string): string[] {
    // First check if it's a structured list with bullet points or dashes
    if (text.includes('\n-') || text.includes('\n•') || text.includes('\n*')) {
      // Split by newlines but keep the header if it exists
      const lines = text.split('\n');
      const sections: string[] = [];
      let header = '';
      
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.startsWith('*')) {
          // This is a list item - remove the bullet point
          sections.push(trimmed.substring(1).trim());
        } else if (trimmed.length > 0 && !header) {
          // This is likely the header (e.g., "Supply and install new kitchen renovation including:")
          header = trimmed;
        }
      }
      
      return sections.length > 0 ? sections : [text];
    }
    
    // For non-list formats, split by sentence-ending punctuation and major conjunctions
    // but NOT by "including" which often introduces a list
    const sections = text.split(/(?:[.;]\s+|\n\n|\band then\b|\bplus\b)/i)
      .map(s => s.trim())
      .filter(s => s.length > 10); // Filter out very short sections
    
    return sections.length > 0 ? sections : [text];
  }

  private async processScopeSection(section: string): Promise<ScopeItem> {
    const id = crypto.randomUUID();
    
    // Extract basic information
    const description = section.trim();
    const category = this.determineCategory(section);
    const location = this.extractLocation(section);
    const specifications = this.extractSpecifications(section);
    const measurementType = this.determineMeasurementType(section);
    const quantityRequirements = this.extractQuantityRequirements(section);
    
    // Calculate confidence based on clarity and completeness
    const confidence = this.calculateItemConfidence(section, {
      hasAction: this.hasAction(section),
      hasMaterial: this.hasMaterial(section),
      hasLocation: !!location,
      hasSpecifications: specifications.length > 0,
      hasQuantityIndicator: this.hasQuantityIndicator(section),
      isUnambiguous: this.isUnambiguous(section)
    });
    
    return {
      id,
      description,
      category,
      location,
      specifications,
      quantity_requirements: quantityRequirements,
      measurement_type: measurementType,
      confidence
    };
  }

  private determineCategory(text: string): ScopeItem['category'] {
    const supplyScore = this.getPatternScore(text, this.actionPatterns.supply);
    const installScore = this.getPatternScore(text, this.actionPatterns.install);
    const demolishScore = this.getPatternScore(text, this.actionPatterns.demolish);
    const prepareScore = this.getPatternScore(text, this.actionPatterns.prepare);
    
    if (demolishScore > 0.7) return 'demolition';
    if (prepareScore > 0.7) return 'preparation';
    if (supplyScore > installScore * 1.5) return 'supply';
    if (installScore > supplyScore * 1.5) return 'install';
    if (supplyScore > 0.3 && installScore > 0.3) return 'supply_install';
    
    // Default to supply_install if unclear
    return 'supply_install';
  }

  private extractLocation(text: string): string | undefined {
    const locations: string[] = [];
    
    // Extract room types
    const roomMatch = text.match(this.locationPatterns.room);
    if (roomMatch) locations.push(roomMatch[0]);
    
    // Extract level information
    const levelMatch = text.match(this.locationPatterns.level);
    if (levelMatch) locations.push(levelMatch[0]);
    
    // Extract orientation
    const orientationMatch = text.match(this.locationPatterns.orientation);
    if (orientationMatch) locations.push(orientationMatch[0]);
    
    return locations.length > 0 ? locations.join(' ') : undefined;
  }

  private extractSpecifications(text: string): string[] {
    const specs: string[] = [];
    
    // Extract dimensions
    const dimensionMatches = text.match(this.dimensionPatterns.dimensions);
    if (dimensionMatches) {
      specs.push(...dimensionMatches);
    }
    
    // Extract material grades/types
    for (const [category, pattern] of Object.entries(this.materialPatterns)) {
      const matches = text.match(pattern);
      if (matches) {
        specs.push(...matches.map(m => `${category}: ${m}`));
      }
    }
    
    // Extract specific product codes or brands
    const productCodes = text.match(/\b[A-Z]{2,}\d{2,}/g);
    if (productCodes) {
      specs.push(...productCodes.map(code => `Product: ${code}`));
    }
    
    return specs;
  }

  private determineMeasurementType(text: string): ScopeItem['measurement_type'] {
    const scores = {
      linear: this.getPatternScore(text, this.measurementPatterns.linear),
      area: this.getPatternScore(text, this.measurementPatterns.area),
      volume: this.getPatternScore(text, this.measurementPatterns.volume),
      count: this.getPatternScore(text, this.measurementPatterns.count)
    };
    
    // Find the highest scoring type
    const maxScore = Math.max(...Object.values(scores));
    const bestType = Object.entries(scores).find(([_, score]) => score === maxScore)?.[0];
    
    if (bestType && maxScore > 0.3) {
      return bestType as ScopeItem['measurement_type'];
    }
    
    // Fallback logic based on item type
    if (text.match(/\b(door|window|light|outlet|fixture)\b/i)) return 'count';
    if (text.match(/\b(skirting|architrave|beam|rafter|timber|steel)\b/i)) return 'linear';
    if (text.match(/\b(floor|wall|ceiling|roof|cladding|paint)\b/i)) return 'area';
    if (text.match(/\b(concrete|insulation|excavation|fill)\b/i)) return 'volume';
    
    return 'assembly'; // Complex items requiring multiple measurements
  }

  private extractQuantityRequirements(text: string): QuantityRequirement | undefined {
    const measurementType = this.determineMeasurementType(text);
    
    // Extract base quantities if explicitly mentioned
    // Handle various quantity formats: "6x", "4 units", "8 linear meters", "12 square meters", etc.
    const quantityPatterns = [
      /\b(\d+(?:\.\d+)?)\s*x\s+/i, // "6x overhead cabinets"
      /\b(\d+(?:\.\d+)?)\s*(linear\s+)?meter[s]?\b/i, // "8 linear meters" or "8 meters"
      /\b(\d+(?:\.\d+)?)\s*(square\s+)?meter[s]?\b/i, // "12 square meters"
      /\b(\d+(?:\.\d+)?)\s*(m2|m²|sqm|lm|m3|m³|each|ea|no|nr|units?)\b/i, // Standard units
      /\b(\d+(?:\.\d+)?)\s+(units?|items?|pieces?|cabinets?|doors?|windows?)\b/i, // Count items
      /approximately\s+(\d+(?:\.\d+)?)\s*/i // "approximately 8 linear meters"
    ];
    
    let baseQuantity: number | undefined;
    for (const pattern of quantityPatterns) {
      const match = text.match(pattern);
      if (match) {
        baseQuantity = parseFloat(match[1]);
        break;
      }
    }
    
    const wasteFactors = {
      timber: 0.10,
      tiles: 0.15,
      paint: 0.10,
      concrete: 0.05,
      insulation: 0.10,
      general: 0.10
    };
    
    // Determine appropriate waste factor
    let wasteFactor = wasteFactors.general;
    for (const [material, factor] of Object.entries(wasteFactors)) {
      if (text.toLowerCase().includes(material)) {
        wasteFactor = factor;
        break;
      }
    }
    
    // Access factors for difficult locations
    let accessFactor = 1.0;
    if (text.match(/\b(confined|tight|restricted|difficult|awkward|high|scaffold)\b/i)) {
      accessFactor = 1.2;
    }
    
    // Complexity factors
    let complexityFactor = 1.0;
    if (text.match(/\b(complex|intricate|detailed|precision|custom|bespoke)\b/i)) {
      complexityFactor = 1.3;
    }
    
    return {
      type: measurementType,
      unit: this.getDefaultUnit(measurementType),
      base_quantity: baseQuantity,
      waste_factor: wasteFactor,
      access_factor: accessFactor,
      complexity_factor: complexityFactor,
      notes: this.extractQuantityNotes(text)
    };
  }

  private getDefaultUnit(type: ScopeItem['measurement_type']): string {
    const units = {
      linear: 'lm',
      area: 'm²',
      volume: 'm³',
      count: 'each',
      assembly: 'item'
    };
    return units[type];
  }

  private extractQuantityNotes(text: string): string[] {
    const notes: string[] = [];
    
    if (text.match(/\b(including|include|with|plus|and)\b/i)) {
      notes.push('Includes additional items - verify scope completeness');
    }
    
    if (text.match(/\b(excluding|exclude|not including|separate)\b/i)) {
      notes.push('Excludes certain items - check for separate line items');
    }
    
    if (text.match(/\b(allowance|provisional|approximate|estimated)\b/i)) {
      notes.push('Provisional quantity - verify with drawings');
    }
    
    return notes;
  }

  private identifyAmbiguities(item: ScopeItem, originalText: string): Ambiguity[] {
    const ambiguities: Ambiguity[] = [];
    
    // Check for material specification ambiguities
    if (!this.hasClearMaterial(originalText)) {
      ambiguities.push({
        id: crypto.randomUUID(),
        item_id: item.id,
        type: 'material_specification',
        description: 'Material specification unclear or missing',
        possible_interpretations: this.suggestMaterialOptions(originalText),
        suggested_question: `What specific material should be used for "${item.description}"?`,
        confidence_impact: -30,
        priority: 'high'
      });
    }
    
    // Check for quantity ambiguities
    if (!this.hasQuantityIndicator(originalText)) {
      ambiguities.push({
        id: crypto.randomUUID(),
        item_id: item.id,
        type: 'quantity_unclear',
        description: 'Quantity or measurement method unclear',
        possible_interpretations: ['Measure from drawings', 'Use provisional allowance', 'Request clarification'],
        suggested_question: `How should I calculate the quantity for "${item.description}"?`,
        confidence_impact: -25,
        priority: 'high'
      });
    }
    
    // Check for location ambiguities
    if (!item.location && this.requiresLocation(originalText)) {
      ambiguities.push({
        id: crypto.randomUUID(),
        item_id: item.id,
        type: 'location_undefined',
        description: 'Location not specified',
        possible_interpretations: ['Throughout building', 'Specific areas only', 'As shown on drawings'],
        suggested_question: `Where specifically should "${item.description}" be installed?`,
        confidence_impact: -20,
        priority: 'medium'
      });
    }
    
    return ambiguities;
  }

  private calculateItemConfidence(
    text: string, 
    factors: {
      hasAction: boolean;
      hasMaterial: boolean;
      hasLocation: boolean;
      hasSpecifications: boolean;
      hasQuantityIndicator: boolean;
      isUnambiguous: boolean;
    }
  ): ConfidenceLevel {
    let score = 50; // Base score
    
    if (factors.hasAction) score += 10;
    if (factors.hasMaterial) score += 20;
    if (factors.hasLocation) score += 10;
    if (factors.hasSpecifications) score += 15;
    if (factors.hasQuantityIndicator) score += 20;
    if (factors.isUnambiguous) score += 15;
    
    // Bonus for explicit quantities
    if (text.match(/\b\d+\s*x\s+/i) || text.match(/\b\d+(?:\.\d+)?\s*(?:linear\s+)?meters?\b/i)) {
      score += 10; // Clear quantity specified
    }
    
    // Bonus for dimensional specifications
    if (text.match(/\d+x\d+(?:x\d+)?mm/i) || text.match(/\d+mm/i)) {
      score += 5; // Clear dimensions specified
    }
    
    // Penalty for complex or unusual items
    if (text.match(/\b(complex|unusual|special|custom|bespoke|non-standard)\b/i)) {
      score -= 20;
    }
    
    // Bonus for standard construction items
    if (text.match(/\b(standard|typical|common|regular|normal)\b/i)) {
      score += 10;
    }
    
    // Bonus for clear supply/install actions
    if (text.match(/\b(supply and install|remove|demolish)\b/i)) {
      score += 5;
    }
    
    score = Math.max(0, Math.min(100, score)); // Clamp between 0-100
    
    const reasons = this.generateConfidenceReasons(factors, text);
    const uncertaintyFactors = this.generateUncertaintyFactors(factors, text);
    
    return getConfidenceLevel(score, reasons, uncertaintyFactors);
  }

  private generateConfidenceReasons(factors: any, text: string): string[] {
    const reasons: string[] = [];
    
    if (factors.hasAction && factors.hasMaterial) {
      reasons.push('Clear action and material specified');
    }
    
    if (factors.hasSpecifications) {
      reasons.push('Detailed specifications provided');
    }
    
    if (factors.hasQuantityIndicator) {
      reasons.push('Quantity measurement method indicated');
    }
    
    if (factors.isUnambiguous) {
      reasons.push('Unambiguous description');
    }
    
    return reasons;
  }

  private generateUncertaintyFactors(factors: any, text: string): string[] {
    const uncertainties: string[] = [];
    
    if (!factors.hasAction) {
      uncertainties.push('Action not clearly specified');
    }
    
    if (!factors.hasMaterial) {
      uncertainties.push('Material type unclear');
    }
    
    if (!factors.hasLocation) {
      uncertainties.push('Location not specified');
    }
    
    if (!factors.hasQuantityIndicator) {
      uncertainties.push('Quantity calculation method unclear');
    }
    
    if (text.match(/\b(or|alternative|option|choice)\b/i)) {
      uncertainties.push('Multiple options presented');
    }
    
    return uncertainties;
  }

  private calculateCompleteness(items: ScopeItem[]): number {
    if (items.length === 0) return 0;
    
    const completenessFactors = items.map(item => {
      let score = 0;
      
      if (item.category !== 'supply_install') score += 20; // Clear action
      if (item.location) score += 20; // Location specified
      if (item.specifications && item.specifications.length > 0) score += 25; // Specifications
      if (item.quantity_requirements) score += 35; // Quantity requirements
      
      return score;
    });
    
    return completenessFactors.reduce((sum, score) => sum + score, 0) / completenessFactors.length;
  }

  private calculateOverallConfidence(items: ScopeItem[], ambiguities: Ambiguity[]): ConfidenceLevel {
    if (items.length === 0) return getConfidenceLevel(0, ['No items found']);
    
    const avgConfidence = items.reduce((sum, item) => sum + item.confidence.score, 0) / items.length;
    const ambiguityPenalty = ambiguities.length * 5; // 5 points per ambiguity
    
    const finalScore = Math.max(0, avgConfidence - ambiguityPenalty);
    
    const reasons = [
      `Average item confidence: ${avgConfidence.toFixed(1)}%`,
      `${ambiguities.length} ambiguities found`,
      `${items.length} items extracted`
    ];
    
    return getConfidenceLevel(finalScore, reasons);
  }

  private checkNSWCompliance(items: ScopeItem[]): string[] {
    const notes: string[] = [];
    
    // Check for structural items requiring compliance
    const structuralItems = items.filter(item => 
      item.description.match(/\b(structural|beam|column|footing|foundation|load|bearing)\b/i)
    );
    
    if (structuralItems.length > 0) {
      notes.push('Structural items require AS 1684 compliance for timber framing');
      notes.push('Structural items require AS 4100 compliance for steel framing');
    }
    
    // Check for concrete items
    const concreteItems = items.filter(item => 
      item.description.match(/\b(concrete|footing|slab|foundation)\b/i)
    );
    
    if (concreteItems.length > 0) {
      notes.push('Concrete items require AS 2870 compliance for residential slabs');
      notes.push('Concrete items require AS 3600 compliance for concrete structures');
    }
    
    // Check for fire-rated items
    const fireRatedItems = items.filter(item => 
      item.description.match(/\b(fire|rating|frl|bca|ncc)\b/i)
    );
    
    if (fireRatedItems.length > 0) {
      notes.push('Fire-rated items require NCC compliance verification');
    }
    
    return notes;
  }

  // Helper methods for pattern matching
  private getPatternScore(text: string, pattern: RegExp): number {
    const matches = text.match(pattern);
    return matches ? matches.length / text.split(' ').length : 0;
  }

  private hasAction(text: string): boolean {
    return Object.values(this.actionPatterns).some(pattern => pattern.test(text));
  }

  private hasMaterial(text: string): boolean {
    return Object.values(this.materialPatterns).some(pattern => pattern.test(text));
  }

  private hasQuantityIndicator(text: string): boolean {
    return Object.values(this.measurementPatterns).some(pattern => pattern.test(text));
  }

  private hasClearMaterial(text: string): boolean {
    // More stringent check for clear material specification
    return Object.values(this.materialPatterns).some(pattern => {
      const matches = text.match(pattern);
      return matches && matches.length > 0;
    });
  }

  private isUnambiguous(text: string): boolean {
    const ambiguousWords = /\b(or|alternative|option|choice|maybe|possibly|might|could|either|various|different|several)\b/i;
    return !ambiguousWords.test(text);
  }

  private requiresLocation(text: string): boolean {
    return text.match(/\b(install|place|position|mount|fix|attach)\b/i) !== null;
  }

  private suggestMaterialOptions(text: string): string[] {
    const options: string[] = [];
    
    // Suggest based on context
    if (text.match(/\b(floor|flooring)\b/i)) {
      options.push('Timber flooring', 'Vinyl flooring', 'Ceramic tiles', 'Carpet');
    }
    
    if (text.match(/\b(wall|cladding)\b/i)) {
      options.push('Fibre cement', 'Timber weatherboard', 'Brick veneer', 'Render');
    }
    
    if (text.match(/\b(roof|roofing)\b/i)) {
      options.push('Colorbond steel', 'Concrete tiles', 'Terracotta tiles');
    }
    
    return options.length > 0 ? options : ['Standard grade', 'Premium grade', 'Budget grade'];
  }
}

export const scopeParser = ScopeParser.getInstance();