import OpenAI from 'openai';
import type { ChatMessage } from './types';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Check if API key is configured
if (!process.env.OPENAI_API_KEY) {
  console.error('OPENAI_API_KEY is not configured');
}

// System prompt for the AI Assistant
const SYSTEM_PROMPT = `You are an AI Quote Assistant for a carpentry business. Your role is to help process Bill of Quantities (BOQ) documents and generate accurate quotes.

Key responsibilities:
- Analyze uploaded BOQ files (PDF, Excel, CSV)
- Extract line items with quantities and descriptions
- Match items to the materials database when possible
- Provide confidence scores for each item
- Flag items that need manual review
- Help users refine and finalize quotes

Always be helpful, professional, and precise. When you're uncertain about an item, indicate low confidence and ask for clarification.`;

export async function processChat(
  messages: ChatMessage[],
  files?: { name: string; type: string; size: number }[]
): Promise<string> {
  try {
    // Convert our message format to OpenAI format
    const openAIMessages = [
      { role: 'system' as const, content: SYSTEM_PROMPT },
      ...messages.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
    ];

    // If there are files, add context about them
    if (files && files.length > 0) {
      const fileContext = `\n\nUploaded files: ${files.map(f => f.name).join(', ')}`;
      const lastMessage = openAIMessages[openAIMessages.length - 1];
      lastMessage.content += fileContext;
    }

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: openAIMessages,
      temperature: 0.3, // Lower temperature for more consistent outputs
      max_tokens: 1000,
    });

    return completion.choices[0].message.content || 'I apologize, but I was unable to generate a response.';
  } catch (error) {
    console.error('OpenAI API error:', error);
    
    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return 'API key configuration error. Please check your OpenAI API key.';
      }
      if (error.message.includes('rate limit')) {
        return 'Rate limit exceeded. Please try again in a moment.';
      }
    }
    
    return 'I encountered an error while processing your request. Please try again.';
  }
}

export async function analyzeDocument(
  documentContent: string,
  documentType: string
): Promise<{
  items: Array<{
    description: string;
    quantity: number;
    unit: string;
  }>;
  summary: string;
  confidence: number;
}> {
  try {
    const prompt = `Analyze this ${documentType} document and extract construction/carpentry items:

${documentContent}

Extract:
1. Item descriptions
2. Quantities and units
3. Any specifications or notes

Return a structured list of items found.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      temperature: 0.2,
      max_tokens: 2000,
    });

    // Parse the response and structure it
    // This is a placeholder - we'll enhance this when we implement BOQ parsing
    return {
      items: [],
      summary: completion.choices[0].message.content || '',
      confidence: 85,
    };
  } catch (error) {
    console.error('Document analysis error:', error);
    throw new Error('Failed to analyze document');
  }
}