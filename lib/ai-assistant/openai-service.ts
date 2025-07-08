import OpenAI from 'openai';
import type { ChatMessage } from './types';
import { mcpManager } from './mcp-manager';

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

Available MCP tools will be provided dynamically. When you have access to tools like 'search_materials', 'get_labor_rates', or 'web_search', use them to provide real data. If a tool is not available or returns an error, explain what data you would provide once the connection is properly configured.

Remember: You're not a generic AI - you're specifically integrated with the carpentry quoting system. Always be clear about whether you're providing:
- Real data from the system (with source)
- Example/placeholder data (clearly marked as such)
- Guidance on how to get the real data`;

export async function processChat(
  messages: ChatMessage[],
  files?: { name: string; type: string; size: number }[]
): Promise<string> {
  try {
    // Ensure MCP connections are initialized
    await mcpManager.initializeConnections();
    
    // Get available MCP tools
    const mcpTools = mcpManager.getAllTools();
    console.log(`OpenAI Service: ${mcpTools.length} MCP tools available:`, mcpTools.map(t => t.name));
    
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

    // Convert MCP tools to OpenAI function format
    const openAITools = mcpTools.map(tool => ({
      type: 'function' as const,
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.inputSchema,
      }
    }));
    
    console.log(`OpenAI Service: Sending ${openAITools.length} tools to OpenAI`);

    // Call OpenAI API with tool support
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: openAIMessages,
      temperature: 0.3,
      max_tokens: 1000,
      tools: openAITools.length > 0 ? openAITools : undefined,
      tool_choice: 'auto',
    });

    const response = completion.choices[0];
    
    // Check if the AI wants to use tools
    if (response.message.tool_calls && response.message.tool_calls.length > 0) {
      console.log(`OpenAI requested ${response.message.tool_calls.length} tool calls`);
      // Handle tool calls
      const toolResults = await Promise.all(
        response.message.tool_calls.map(async (toolCall) => {
          try {
            const result = await mcpManager.callTool(
              toolCall.function.name,
              JSON.parse(toolCall.function.arguments)
            );
            
            console.log(`Tool ${toolCall.function.name} called successfully`);
            
            return {
              tool_call_id: toolCall.id,
              role: 'tool' as const,
              content: typeof result.content === 'string' 
                ? result.content 
                : JSON.stringify(result.content)
            };
          } catch (error) {
            console.error(`Tool call error for ${toolCall.function.name}:`, error);
            return {
              tool_call_id: toolCall.id,
              role: 'tool' as const,
              content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
          }
        })
      );

      // Add the assistant's message with tool calls
      openAIMessages.push({
        role: 'assistant' as const,
        content: response.message.content || '',
        tool_calls: response.message.tool_calls
      } as { role: 'assistant'; content: string; tool_calls?: unknown });

      // Add tool results
      openAIMessages.push(...(toolResults as unknown as { role: 'user' | 'assistant'; content: string }[]));

      // Get the final response from OpenAI
      const finalCompletion = await openai.chat.completions.create({
        model: 'gpt-4-turbo',
        messages: openAIMessages,
        temperature: 0.3,
        max_tokens: 1000,
      });

      return finalCompletion.choices[0].message.content || 'I apologize, but I was unable to generate a response.';
    }

    return response.message.content || 'I apologize, but I was unable to generate a response.';
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
      model: 'gpt-4-turbo',
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