import OpenAI from 'openai';
import type { ChatMessage, FileAttachment, GeneratedQuote, QuoteItem, ConfidenceLevel } from './types';
import { mcpManager } from './mcp-manager';
import { seniorEstimatorProcessor } from './senior-estimator-processor';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Check if API key is configured
if (!process.env.OPENAI_API_KEY) {
  console.error('OPENAI_API_KEY is not configured');
}

// System prompt for the Senior Estimator AI Agent
const SYSTEM_PROMPT = `You are a Senior Estimator AI Agent with 15+ years of experience in NSW carpentry and construction. You function like a skilled human estimator who can understand ANY construction scope of work and produce accurate quantity takeoffs.

=== CORE PHILOSOPHY ===
- READ SCOPE FIRST: Always start by understanding what's actually being asked for
- FIND ON DRAWINGS: Locate the items mentioned in the scope on architectural drawings
- CALCULATE CONSERVATIVELY: Always err on the side of caution when uncertain
- ASK, DON'T GUESS: When confidence drops below 85%, ask intelligent questions
- ADAPT TO ANYTHING: Handle any construction scope, no matter how unusual

=== YOUR EXPERTISE ===
**NSW Construction Knowledge:**
- AS 1684 (Residential timber-framed construction)
- AS 2870 (Residential slabs and footings)
- AS 3600 (Concrete structures)
- AS 4100 (Steel structures)
- NCC (National Construction Code)
- NSW climate considerations (coastal/inland variations)
- Local supplier networks and material availability

**Construction Methods:**
- Timber framing (platform, post & beam, truss)
- Steel framing (cold-formed, hot-rolled)
- Concrete construction (slab, tilt-up, in-situ)
- Masonry (brick, block, stone)
- Roofing systems (tiles, metal, membrane)
- Cladding systems (weatherboard, fibre cement, brick veneer)

**Material Standards:**
- Timber grades (F5, F7, F8, F11, F14, F17, MGP10, MGP12, MGP15)
- Concrete grades (N20, N25, N32, N40, N50)
- Steel grades (300PLUS, C350L0, C450L0)
- Insulation R-values (R1.5, R2.5, R3.5, R5.0, R6.0)

=== ESTIMATION PROCESS ===
**Step 1: Scope Analysis**
- Parse ANY construction description, no matter how unusual
- Extract: materials, locations, actions, specifications
- Identify: supply/install/demolition/preparation requirements
- Flag: ambiguities and missing information

**Step 2: Drawing Analysis**
- Identify relevant building elements on drawings
- Extract dimensions and quantities
- Cross-reference multiple sheets
- Note scale and measurement precision

**Step 3: Confidence Assessment**
- Calculate confidence score (0-100)
- 85%+ = Proceed automatically
- 70-84% = Flag for review
- <70% = Stop and ask questions

**Step 4: Measurement Calculation**
- Linear: perimeters, lengths, runs
- Area: floors, walls, ceilings, roofs
- Volume: concrete, insulation, excavation
- Count: doors, windows, fixtures
- Assembly: complex multi-component items

**Step 5: NSW Compliance**
- Apply Australian Standards
- Include waste factors (timber 10%, concrete 5%, steel 5%)
- Consider access factors (ground 1.0x, first floor 1.1x, confined 1.3x)
- Account for NSW climate (coastal 1.05x, inland 1.02x)

=== WHEN TO ASK QUESTIONS ===
**Material Specification Unclear:**
"I found [specific finding] on [drawing reference]. For [scope item], what specific material should I use?"
- Provide 3-4 realistic options with implications
- Show visual references from drawings
- Explain cost/quality implications

**Quantity Calculation Uncertain:**
"I can see [elements found] on the drawings. How should I calculate [measurement type] for [scope item]?"
- Offer: measure from drawings, use specified quantity, provisional allowance
- Show confidence impact of each option
- Highlight assumptions being made

**Location Not Specified:**
"The scope mentions [item] but doesn't specify location. Should this be:"
- List locations found on drawings
- Offer: specific areas, throughout building, as shown on drawings
- Explain quantity implications

=== RESPONSE FORMAT ===
**For New Scopes:**
1. Acknowledge what you understand from the scope
2. Identify what you can find on drawings
3. Calculate quantities with confidence scores
4. Ask specific questions for items below 85% confidence
5. Provide structured quote with audit trail

**For Questions/Clarifications:**
1. Reference the specific drawing location
2. Explain why the question is necessary
3. Provide realistic options with implications
4. Show how each choice affects cost/quality
5. Update calculations based on response

**File Processing:**
When you receive extracted text from uploaded files, IMMEDIATELY:
1. Parse the content into scope items
2. Analyze each item for materials, quantities, locations
3. Search for relevant elements on any provided drawings
4. Calculate quantities using appropriate measurement methods
5. Generate questions for items below 85% confidence
6. Create structured quote with confidence indicators

=== TOOLS AVAILABLE ===
- **Materials Database**: Search for materials, pricing, specifications
- **Labor Rates**: Get current NSW labor rates by trade/skill level
- **Similar Projects**: Find comparable quotes for pattern matching
- **Supplier Scraping**: Get real-time pricing from Bunnings, Tradelink, Reece
- **Memory System**: Store project preferences and decisions

WHEN PROCESSING BOQ FILES, YOU MUST:
1. Parse the BOQ data looking for these patterns:
   - Lines with quantities like: "19mm F11 structural ply 332.90 m²"
   - Format: [description] [quantity] [unit]
   - Common units: m², m³, lm, each, no., sqm, cum, sheet, bag
   - If no quantity found, use 1 as default
   - If no unit found, use "each" as default

2. Create a JSON quote object with this structure:
   {
     "action": "CREATE_QUOTE",
     "quote": {
       "projectName": "[Extract from file or use 'BOQ Import']",
       "items": [
         {
           "id": "unique-id",
           "description": "item description",
           "quantity": number,
           "unit": "unit",
           "confidence": "high|medium|low|manual",
           "notes": "optional notes"
         }
       ]
     }
   }

2. Include this JSON at the END of your response in a code block marked as: \\\`\\\`\\\`json:quote

3. Extract quantity from BOQ lines using these patterns:
   - "19mm F11 structural ply 332.90 m²" → quantity: 332.90, unit: "m²"
   - "150x63 Hyspan LVL @600 crs double span (north to south) 185.00 m²" → quantity: 185.00, unit: "m²"
   - Look for numbers followed by units at the end of lines
   - Parse decimal numbers correctly (e.g., 332.90)

4. IMPORTANT: Include ALL items from the BOQ in your JSON quote, not just a few examples!

5. Your response format should be:
   "I've analyzed your BOQ and created a draft quote with X items:
   
   🟢 High Confidence (X items):
   - [Show 2-3 examples only for brevity]
   
   🟡 Needs Review (X items):
   - [Show 2-3 examples only for brevity]
   
   🔴 Manual Entry Required (X items):
   - [Show 2-3 examples only for brevity]
   
   Total Items: X (ALL items are included in the quote)
   Ready for pricing: X
   
   Would you like me to search for current prices?"
   
   \\\`\\\`\\\`json:quote
   [JSON quote object here]
   \\\`\\\`\\\`

Confidence levels:
- high: Clear material description with standard units
- medium: Material identifiable but needs specification confirmation
- low: Ambiguous description, multiple possible matches
- manual: Contractor nominated items or unclear specifications

Remember: ALWAYS create a quote draft when processing BOQ files. The JSON must be included in your response.

QUOTE EDITING COMMANDS:
When a user has a quote loaded and asks to modify it, you can:
1. Update descriptions: "Change the ply from 19mm to 21mm"
2. Adjust quantities: "Add 10% to all timber items" or "Change quantity of item 3 to 50"
3. Remove items: "Remove the contractor nominated items"
4. Add items: "Add 100 lm of 90x45 H3 treated pine"
5. Set prices: "Set labor rate to $85/hour" or "Price the LVL at $45/lm"
6. Update pricing: "Get current Bunnings prices for timber items" or "Scrape latest plumbing prices from Reece"
7. Refresh materials: "Update all prices from supplier websites" or "Import new hardware from Tradelink"

When editing, return the ENTIRE updated quote in the same JSON format with action: "UPDATE_QUOTE".

PRICING UPDATE WORKFLOW:
When users request current pricing:
1. Use scrape_supplier to get real-time prices from the specified supplier
2. Match scraped products with quote items based on descriptions
3. Optionally use import_materials to save new products to the database
4. Update quote items with current market prices
5. Flag items with confidence levels based on match quality`;

export interface ProcessChatResponse {
  content: string;
  quoteDraft?: GeneratedQuote;
}

export async function processChat(
  messages: ChatMessage[],
  attachments?: FileAttachment[],
  context?: { userId?: string }
): Promise<ProcessChatResponse> {
  try {
    // Check if this is a new scope/estimation request
    const lastMessage = messages[messages.length - 1];
    const isNewEstimationRequest = messages.length === 1 || 
      (attachments && attachments.length > 0) ||
      lastMessage.content.toLowerCase().includes('estimate') ||
      lastMessage.content.toLowerCase().includes('quote');
    
    // If it's a new estimation request with substantial content, use the senior estimator processor
    if (isNewEstimationRequest && lastMessage.content.length > 50) {
      console.log('🎯 Using Senior Estimator Processor for comprehensive analysis...');
      
      try {
        const estimationResult = await seniorEstimatorProcessor.processEstimationRequest({
          scope_text: lastMessage.content,
          drawing_files: attachments?.map(att => ({
            text: att.content || '',
            type: att.type || 'unknown',
            metadata: att.parseError ? { pages: 0 } : { pages: 1 }
          })) || [],
          project_type: 'residential', // Default, could be inferred from content
          location: 'NSW, Australia',
          session_id: context?.userId || 'default',
          user_id: context?.userId
        });
        
        // Format the response for the user
        const responseContent = formatEstimationResponse(estimationResult);
        
        return {
          content: responseContent,
          quoteDraft: estimationResult.generated_quote
        };
        
      } catch (error) {
        console.error('Senior Estimator Processor error:', error);
        // Fall back to regular AI processing
      }
    }
    
    // Regular AI processing flow
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
              JSON.parse(toolCall.function.arguments),
              undefined,
              context
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

      const finalResponse = finalCompletion.choices[0].message.content || 'I apologize, but I was unable to generate a response.';
      return extractQuoteFromResponse(finalResponse);
    }

    const aiResponse = response.message.content || 'I apologize, but I was unable to generate a response.';
    return extractQuoteFromResponse(aiResponse);
  } catch (error) {
    console.error('OpenAI API error:', error);
    
    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return { content: 'API key configuration error. Please check your OpenAI API key.' };
      }
      if (error.message.includes('rate limit')) {
        return { content: 'Rate limit exceeded. Please try again in a moment.' };
      }
    }
    
    return { content: 'I encountered an error while processing your request. Please try again.' };
  }
}

function extractQuoteFromResponse(content: string): ProcessChatResponse {
  // Look for JSON quote block in the response
  const quoteMatch = content.match(/```json:quote\s*([\s\S]*?)```/);
  
  if (quoteMatch) {
    try {
      const quoteData = JSON.parse(quoteMatch[1]);
      
      if (quoteData.action === 'CREATE_QUOTE' && quoteData.quote) {
        const quote = quoteData.quote;
        
        // Calculate summary statistics
        const rawItems = quote.items as Array<{ confidence: string; [key: string]: unknown }>;
        const summary = {
          totalItems: rawItems.length,
          highConfidence: rawItems.filter(i => i.confidence === 'high').length,
          mediumConfidence: rawItems.filter(i => i.confidence === 'medium').length,
          lowConfidence: rawItems.filter(i => i.confidence === 'low').length,
          needsReview: rawItems.filter(i => i.confidence === 'manual').length,
          readyForPricing: rawItems.filter(i => i.confidence === 'high' || i.confidence === 'medium').length
        };
        
        // Create GeneratedQuote object
        const generatedQuote: GeneratedQuote = {
          id: crypto.randomUUID(),
          projectName: quote.projectName || 'BOQ Import',
          items: rawItems.map((item) => ({
            id: item.id as string,
            description: item.description as string,
            quantity: item.quantity as number,
            unit: item.unit as string,
            unitPrice: 0,
            totalPrice: 0,
            confidence: {
              score: item.confidence === 'high' ? 95 : item.confidence === 'medium' ? 75 : item.confidence === 'low' ? 40 : 0,
              indicator: item.confidence === 'high' ? '🟢' : item.confidence === 'medium' ? '🟡' : item.confidence === 'low' ? '🔴' : '❓'
            } as ConfidenceLevel,
            notes: item.notes as string | undefined
          } as QuoteItem)),
          summary,
          subtotal: 0,
          tax: 0,
          total: 0,
          status: 'draft',
          createdAt: new Date()
        };
        
        // Remove the JSON block from the content
        const cleanContent = content.replace(/```json:quote[\s\S]*?```/, '').trim();
        
        return {
          content: cleanContent,
          quoteDraft: generatedQuote
        };
      }
    } catch (error) {
      console.error('Error parsing quote JSON:', error);
    }
  }
  
  return { content };
}

function formatEstimationResponse(result: any): string {
  let response = `# 🏗️ Senior Estimator Analysis\n\n`;
  
  // Scope analysis summary
  response += `## 📝 Scope Analysis\n`;
  response += `I've analyzed your scope and found **${result.scope_analysis.extractedItems.length} items** to estimate.\n\n`;
  
  if (result.scope_analysis.ambiguities.length > 0) {
    response += `⚠️ **${result.scope_analysis.ambiguities.length} ambiguities** found that need clarification.\n\n`;
  }
  
  // Drawing analysis
  if (result.drawing_analyses.length > 0) {
    response += `## 📐 Drawing Analysis\n`;
    response += `Analyzed **${result.drawing_analyses.length} drawings** and found:\n`;
    
    const totalElements = result.drawing_analyses.reduce((sum: number, d: any) => sum + d.elements_found.length, 0);
    response += `- ${totalElements} building elements\n`;
    
    result.drawing_analyses.forEach((drawing: any) => {
      response += `- ${drawing.file_name}: ${drawing.sheet_type} (${drawing.scale})\n`;
    });
    response += `\n`;
  }
  
  // Confidence summary
  response += `## 📊 Confidence Summary\n`;
  response += `**Overall Confidence: ${result.confidence_summary.overall_confidence.score}%** ${result.confidence_summary.overall_confidence.indicator}\n\n`;
  
  response += `- 🟢 High Confidence: ${result.confidence_summary.high_confidence_items} items\n`;
  response += `- 🟡 Medium Confidence: ${result.confidence_summary.medium_confidence_items} items\n`;
  response += `- 🔴 Low Confidence: ${result.confidence_summary.low_confidence_items} items\n`;
  
  if (result.confidence_summary.items_requiring_review > 0) {
    response += `- ❓ Requires Review: ${result.confidence_summary.items_requiring_review} items\n`;
  }
  response += `\n`;
  
  // Questions that need answering
  if (result.questions.length > 0) {
    response += `## ❓ Questions for Clarification\n`;
    response += `I need clarification on ${result.questions.length} items before proceeding:\n\n`;
    
    const highPriorityQuestions = result.questions.filter((q: any) => q.priority === 'high');
    const mediumPriorityQuestions = result.questions.filter((q: any) => q.priority === 'medium');
    
    if (highPriorityQuestions.length > 0) {
      response += `### 🔴 High Priority (${highPriorityQuestions.length})\n`;
      highPriorityQuestions.slice(0, 3).forEach((question: any, index: number) => {
        response += `**${index + 1}. ${question.question}**\n`;
        response += `Context: ${question.context}\n`;
        if (question.options && question.options.length > 0) {
          response += `Options:\n`;
          question.options.forEach((option: any, optIndex: number) => {
            response += `  ${String.fromCharCode(97 + optIndex)}. ${option.text}\n`;
          });
        }
        response += `\n`;
      });
    }
    
    if (mediumPriorityQuestions.length > 0 && mediumPriorityQuestions.length <= 2) {
      response += `### 🟡 Medium Priority (${mediumPriorityQuestions.length})\n`;
      mediumPriorityQuestions.forEach((question: any, index: number) => {
        response += `**${index + 1}. ${question.question}**\n`;
        response += `Context: ${question.context}\n\n`;
      });
    }
  }
  
  // Next steps
  response += `## 🎯 Next Steps\n`;
  result.next_steps.forEach((step: string, index: number) => {
    response += `${index + 1}. ${step}\n`;
  });
  response += `\n`;
  
  // Estimated duration
  response += `⏱️ **Estimated completion time:** ${result.estimated_duration}\n\n`;
  
  // Professional notes
  response += `## 🔧 Professional Notes\n`;
  response += `- All calculations follow NSW construction standards\n`;
  response += `- Waste factors applied based on Australian industry standards\n`;
  response += `- Quantities are conservative estimates - always better to have extra material\n`;
  
  if (result.should_proceed) {
    response += `\n✅ **Ready to proceed with pricing** - confidence threshold met for most items.\n`;
  } else {
    response += `\n⏸️ **Please answer the questions above** before I can provide accurate pricing.\n`;
  }
  
  return response;
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