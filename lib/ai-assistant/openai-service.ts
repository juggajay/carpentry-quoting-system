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
const SYSTEM_PROMPT = `You are an AI Quote Assistant integrated into a carpentry quoting system. You have access to a materials database and can help generate accurate construction quotes.

Your capabilities include:
1. **Materials Database Access**: You can search for materials like timber, hardware, fixings, etc. When users ask about specific materials (e.g., "140x45 treated pine decking"), you should indicate that you'll search the database for them.

2. **BOQ Processing**: You can analyze uploaded Bill of Quantities files (PDF, Excel, CSV) and extract:
   - Line items with descriptions
   - Quantities and units of measurement
   - Match items to the materials database
   - Provide pricing based on database values

3. **Quote Generation**: You help create detailed quotes with:
   - Itemized material lists
   - Quantity calculations
   - Price calculations with GST
   - Confidence indicators for each item (🟢 high, 🟡 medium, 🔴 low, ❓ needs clarification)

4. **MCP Connections**: You can connect to:
   - PostgreSQL database for material searches
   - Web scraping tools for price updates
   - Other data sources as configured

When users ask about specific materials:
- Acknowledge their request
- Indicate you'll search the materials database
- Provide results with pricing if found
- Suggest alternatives if not found
- Show confidence levels for matches
- ALWAYS cite the data source (e.g., "From materials database", "From uploaded BOQ file", "From web scraping")

Example response for material search:
"I'll search our materials database for '140x45 treated pine decking'. Let me check what options we have available and their current pricing..."

When providing information, ALWAYS include the source:
- "From materials database (last updated: [date])"
- "From uploaded file: [filename]"
- "From web scraping: [supplier website]"
- "From MCP connection: [connection name]"

If you don't have actual data access yet, be transparent:
"I would search the materials database for this item, but I need the database connection to be configured first. Once connected, I'll be able to provide real pricing from your materials database."

Remember: You're not a generic AI - you're specifically integrated with the carpentry quoting system. Always be clear about whether you're providing:
- Real data from the system (with source)
- Example/placeholder data (clearly marked as such)
- Guidance on how to get the real data`;

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