import OpenAI from 'openai';
import type { ChatMessage, FileAttachment } from './types';
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

IMPORTANT: When a user uploads a file, the file content will be provided to you as extracted text in the message. You should IMMEDIATELY analyze this content without asking the user to convert or reformat the file.

Your capabilities include:
1. **BOQ File Processing**: When you receive extracted text from uploaded files:
   - IMMEDIATELY parse the content into structured line items
   - Extract: item descriptions, quantities, units of measurement, specifications
   - DO NOT ask users to convert files - the content is already extracted for you
   - Look for patterns like: item codes, descriptions, quantities, units (m², lm, each, etc.)
   - Present the parsed data in a clear table format

2. **Materials Database Access**: You can search for materials like timber, hardware, fixings, etc. Match BOQ items to database materials when possible.

3. **Quote Generation**: Create detailed quotes with:
   - Itemized material lists from the BOQ
   - Quantity calculations
   - Price calculations with GST (when prices available)
   - Confidence indicators for each item (🟢 high, 🟡 medium, 🔴 low, ❓ needs clarification)

4. **MCP Tools**: Use available tools to search materials database and get pricing.

When processing uploaded BOQ files:
1. First, acknowledge receipt: "I've received your [file type] file. Let me analyze the contents..."
2. Parse the extracted text into a structured format
3. Present findings in a clear table with columns: Item, Description, Quantity, Unit
4. Suggest material matches from the database if available
5. Ask for clarification only on ambiguous items

Example BOQ parsing response:
"I've analyzed your BOQ file and found the following items:

| Item | Description | Quantity | Unit | Notes |
|------|-------------|----------|------|-------|
| 1 | 140x45 H3 Treated Pine | 250 | lm | Framing timber |
| 2 | Concrete footings | 12 | m³ | 25MPa concrete |
| 3 | Galvanized bolts M12 | 100 | each | For connections |

Would you like me to search our materials database for pricing on these items?"

Remember: The file content is ALREADY extracted and provided to you. Never ask users to convert files or copy-paste content.`;

export async function processChat(
  messages: ChatMessage[],
  attachments?: FileAttachment[]
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

    // If there are attachments, add their content to the context
    if (attachments && attachments.length > 0) {
      console.log('[OpenAI Service] Processing attachments:', {
        count: attachments.length,
        attachments: attachments.map(a => ({
          name: a.name,
          hasContent: !!a.content,
          contentLength: a.content?.length || 0,
          parseError: a.parseError
        }))
      });
      
      let fileContext = '\n\n=== UPLOADED BOQ FILES (Content Already Extracted) ===\n';
      fileContext += 'The following is the extracted text content from the uploaded file(s). Please analyze and parse this into structured BOQ line items:\n';
      
      attachments.forEach((attachment) => {
        fileContext += `\n--- File: ${attachment.name} ---\n`;
        
        if (attachment.content && attachment.content.trim().length > 0) {
          // Include the extracted content
          fileContext += `\nExtracted Text Content:\n${attachment.content}\n`;
          fileContext += '\n--- End of File ---\n';
        } else if (attachment.parseError) {
          fileContext += `\nError: ${attachment.parseError}\n`;
          fileContext += '\nThe PDF might be:\n';
          fileContext += '1. A scanned/image-based PDF (not text-based)\n';
          fileContext += '2. Password protected\n';
          fileContext += '3. Corrupted or invalid format\n';
          fileContext += '\nPlease ask the user to:\n';
          fileContext += '- Try uploading an Excel (.xlsx) or CSV version instead\n';
          fileContext += '- Ensure the PDF contains selectable text (not scanned images)\n';
          fileContext += '- Check if the PDF opens correctly on their computer\n';
        } else {
          fileContext += `\nNo text content could be extracted from this file.\n`;
          fileContext += 'This usually happens with scanned PDFs or image-based documents.\n';
          fileContext += 'Please request an Excel or CSV version of the BOQ.\n';
        }
      });
      
      fileContext += '\nPlease analyze the above BOQ content and present it in a structured format with line items, quantities, and units.';
      
      const lastMessage = openAIMessages[openAIMessages.length - 1];
      lastMessage.content += fileContext;
      
      console.log('[OpenAI Service] Added BOQ file context:', {
        totalContextLength: fileContext.length,
        messageContent: lastMessage.content.substring(0, 500) + '...'
      });
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