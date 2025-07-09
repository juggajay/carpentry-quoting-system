export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  attachments?: FileAttachment[];
  confidence?: ConfidenceLevel;
  quoteDraft?: GeneratedQuote;
}

export interface FileAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url?: string;
  status: 'uploading' | 'processing' | 'complete' | 'error';
  error?: string;
  content?: string; // Extracted text content from the file
  parseError?: string; // Error if file parsing failed
}

export interface QuoteItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  confidence: ConfidenceLevel;
  sourceReference?: string;
  alternativeSuggestions?: AlternativeItem[];
}

export interface AlternativeItem {
  id: string;
  description: string;
  unitPrice: number;
  confidence: number;
}

export interface ConfidenceLevel {
  score: number; // 0-100
  indicator: '🟢' | '🟡' | '🔴' | '❓';
  reasons?: string[];
  threshold?: 'high' | 'medium' | 'low' | 'manual';
  requiresReview?: boolean;
  uncertaintyFactors?: string[];
  visualReferences?: string[];
}

export interface AISession {
  id: string;
  userId: string;
  messages: ChatMessage[];
  files?: FileAttachment[];
  generatedQuote?: GeneratedQuote;
  status: 'active' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

export interface GeneratedQuote {
  id: string;
  projectName: string;
  items: QuoteItem[];
  summary: {
    totalItems: number;
    highConfidence: number;
    mediumConfidence: number;
    lowConfidence: number;
    needsReview: number;
    readyForPricing: number;
  };
  subtotal: number;
  tax: number;
  total: number;
  status: 'draft' | 'priced' | 'complete';
  createdAt: Date;
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema?: any;
  parameters?: any;
  handler?: (args: any, context?: any) => Promise<any>;
}

export interface MCPConnection {
  id: string;
  name: string;
  type: 'postgresql' | 'filesystem' | 'memory' | 'brave';
  status: 'connected' | 'disconnected' | 'error';
  config?: Record<string, unknown>;
  tools?: MCPTool[];
}

export function getConfidenceIndicator(score: number): ConfidenceLevel['indicator'] {
  if (score >= 90) return '🟢';
  if (score >= 70) return '🟡';
  if (score > 0) return '🔴';
  return '❓';
}

export function getConfidenceLevel(score: number, reasons?: string[], uncertaintyFactors?: string[]): ConfidenceLevel {
  const threshold = score >= 85 ? 'high' : score >= 70 ? 'medium' : score >= 40 ? 'low' : 'manual';
  const requiresReview = score < 85;
  
  return {
    score,
    indicator: getConfidenceIndicator(score),
    threshold,
    requiresReview,
    reasons,
    uncertaintyFactors,
  };
}

// Senior Estimator Agent Types
export interface ScopeAnalysis {
  id: string;
  originalScope: string;
  extractedItems: ScopeItem[];
  ambiguities: Ambiguity[];
  completeness: number; // 0-100
  confidence: ConfidenceLevel;
  nsw_compliance_notes?: string[];
}

export interface ScopeItem {
  id: string;
  description: string;
  category: 'supply' | 'install' | 'supply_install' | 'demolition' | 'preparation';
  location?: string;
  specifications?: string[];
  quantity_requirements?: QuantityRequirement;
  measurement_type: 'linear' | 'area' | 'volume' | 'count' | 'assembly';
  confidence: ConfidenceLevel;
}

export interface QuantityRequirement {
  type: 'linear' | 'area' | 'volume' | 'count' | 'assembly';
  unit: string;
  base_quantity?: number;
  waste_factor?: number;
  access_factor?: number;
  complexity_factor?: number;
  notes?: string[];
}

export interface Ambiguity {
  id: string;
  item_id: string;
  type: 'material_specification' | 'quantity_unclear' | 'location_undefined' | 'method_ambiguous';
  description: string;
  possible_interpretations: string[];
  suggested_question: string;
  confidence_impact: number;
  priority: 'high' | 'medium' | 'low';
}

export interface DrawingAnalysis {
  id: string;
  file_name: string;
  sheet_type: 'floor_plan' | 'elevation' | 'section' | 'detail' | 'site_plan' | 'unknown';
  scale: string;
  dimensions_extracted: ExtractedDimension[];
  elements_found: BuildingElement[];
  scope_matches: ScopeMatch[];
  confidence: ConfidenceLevel;
  notes?: string[];
}

export interface ExtractedDimension {
  id: string;
  value: number;
  unit: string;
  label?: string;
  location: { x: number; y: number };
  confidence: ConfidenceLevel;
}

export interface BuildingElement {
  id: string;
  type: 'wall' | 'door' | 'window' | 'beam' | 'column' | 'floor' | 'ceiling' | 'roof' | 'other';
  location: string;
  dimensions?: { length?: number; width?: number; height?: number; area?: number };
  material?: string;
  specifications?: string[];
  quantity: number;
  unit: string;
  confidence: ConfidenceLevel;
}

export interface ScopeMatch {
  scope_item_id: string;
  building_element_id: string;
  match_confidence: ConfidenceLevel;
  calculation_method: string;
  assumptions: string[];
  notes?: string[];
}

export interface EstimatorQuestion {
  id: string;
  type: 'clarification' | 'specification' | 'assumption_validation' | 'missing_information';
  scope_item_id?: string;
  drawing_reference?: string;
  question: string;
  context: string;
  options?: QuestionOption[];
  priority: 'high' | 'medium' | 'low';
  confidence_impact: number;
  visual_references?: string[];
}

export interface QuestionOption {
  id: string;
  text: string;
  implications: string[];
  confidence_adjustment: number;
  cost_impact?: 'increase' | 'decrease' | 'neutral';
}

export interface EstimationDecision {
  id: string;
  scope_item_id: string;
  decision_type: 'material_selection' | 'quantity_calculation' | 'method_choice' | 'assumption_made';
  reasoning: string;
  alternatives_considered: string[];
  confidence_factors: string[];
  risk_assessment: string;
  standards_reference?: string;
  timestamp: Date;
}

export interface AuditTrail {
  id: string;
  quote_id: string;
  actions: EstimationDecision[];
  questions_asked: EstimatorQuestion[];
  assumptions_made: string[];
  confidence_summary: {
    overall_confidence: ConfidenceLevel;
    high_confidence_items: number;
    medium_confidence_items: number;
    low_confidence_items: number;
    items_requiring_review: number;
  };
  estimator_notes?: string[];
  created_at: Date;
}