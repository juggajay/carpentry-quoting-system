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

export function getConfidenceLevel(score: number): ConfidenceLevel {
  return {
    score,
    indicator: getConfidenceIndicator(score),
  };
}