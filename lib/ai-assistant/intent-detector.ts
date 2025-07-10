export type IntentType = 'construction_scope' | 'question' | 'greeting' | 'file_query' | 'help' | 'other';

export interface IntentDetectionResult {
  intent: IntentType;
  confidence: number;
  reason: string;
}

export class IntentDetector {
  private static instance: IntentDetector;
  
  private readonly questionPatterns = [
    /^(can|could|would|should|is|are|do|does|did|will|what|where|when|why|how|who)/i,
    /\?$/,
    /(tell me|show me|help me|explain)/i,
    /(understand|see|read|check)/i
  ];
  
  private readonly greetingPatterns = [
    /^(hello|hi|hey|good morning|good afternoon|good evening)/i,
    /^(thanks|thank you|cheers)/i
  ];
  
  private readonly fileQueryPatterns = [
    /(file|document|drawing|pdf|image|photo|picture)/i,
    /(upload|attach|see|view|read|check)/i
  ];
  
  private readonly helpPatterns = [
    /^help$/i,
    /(how to use|guide|tutorial|instructions)/i,
    /(what can you do|capabilities|features)/i
  ];
  
  private readonly constructionKeywords = [
    'supply', 'install', 'build', 'construct', 'demolish', 'remove',
    'timber', 'steel', 'concrete', 'brick', 'tile', 'plaster',
    'frame', 'wall', 'floor', 'ceiling', 'roof', 'foundation',
    'plumbing', 'electrical', 'painting', 'carpentry'
  ];
  
  private constructor() {}
  
  static getInstance(): IntentDetector {
    if (!IntentDetector.instance) {
      IntentDetector.instance = new IntentDetector();
    }
    return IntentDetector.instance;
  }
  
  detectIntent(text: string): IntentDetectionResult {
    const normalizedText = text.toLowerCase().trim();
    
    // Check for questions first
    for (const pattern of this.questionPatterns) {
      if (pattern.test(normalizedText)) {
        // Check if it's a file-related question
        for (const filePattern of this.fileQueryPatterns) {
          if (filePattern.test(normalizedText)) {
            return {
              intent: 'file_query',
              confidence: 0.9,
              reason: 'Question about files or documents'
            };
          }
        }
        
        return {
          intent: 'question',
          confidence: 0.85,
          reason: 'General question detected'
        };
      }
    }
    
    // Check for greetings
    for (const pattern of this.greetingPatterns) {
      if (pattern.test(normalizedText)) {
        return {
          intent: 'greeting',
          confidence: 0.95,
          reason: 'Greeting detected'
        };
      }
    }
    
    // Check for help requests
    for (const pattern of this.helpPatterns) {
      if (pattern.test(normalizedText)) {
        return {
          intent: 'help',
          confidence: 0.9,
          reason: 'Help request detected'
        };
      }
    }
    
    // Check for construction-related content
    const constructionScore = this.calculateConstructionScore(normalizedText);
    if (constructionScore > 0.5) {
      return {
        intent: 'construction_scope',
        confidence: constructionScore,
        reason: 'Construction-related content detected'
      };
    }
    
    // Default to other
    return {
      intent: 'other',
      confidence: 0.3,
      reason: 'Intent unclear'
    };
  }
  
  private calculateConstructionScore(text: string): number {
    const words = text.split(/\s+/);
    let constructionWordCount = 0;
    
    for (const word of words) {
      if (this.constructionKeywords.some(keyword => word.includes(keyword))) {
        constructionWordCount++;
      }
    }
    
    // Calculate score based on percentage of construction words
    const score = constructionWordCount / Math.max(words.length, 1);
    return Math.min(score * 2, 1); // Scale up but cap at 1
  }
}

export const intentDetector = IntentDetector.getInstance();