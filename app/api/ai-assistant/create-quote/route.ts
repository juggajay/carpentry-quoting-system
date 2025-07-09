import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import type { GeneratedQuote, QuoteItem as AIQuoteItem } from "@/lib/ai-assistant/types";

// Map AI confidence to ItemType
function getItemType(confidence: string): "CUSTOM" | "MATERIAL" | "LABOR" {
  if (confidence === "high" || confidence === "medium") {
    return "MATERIAL"; // These likely match materials in the database
  }
  return "CUSTOM"; // Low confidence or manual items are custom
}

// Map common unit variations to enum values
function mapToUnit(unit: string): "EA" | "LM" | "SQM" | "HR" | "DAY" | "PACK" | "KG" | "L" {
  const unitMap: Record<string, "EA" | "LM" | "SQM" | "HR" | "DAY" | "PACK" | "KG" | "L"> = {
    // Square meters
    "m²": "SQM",
    "m2": "SQM",
    "sqm": "SQM",
    "sq.m": "SQM",
    "square meter": "SQM",
    "square metre": "SQM",
    
    // Linear meters
    "m": "LM",
    "lm": "LM",
    "lin.m": "LM",
    "linear meter": "LM",
    "linear metre": "LM",
    
    // Each/items
    "each": "EA",
    "ea": "EA",
    "no": "EA",
    "no.": "EA",
    "item": "EA",
    "piece": "EA",
    "pcs": "EA",
    
    // Time units
    "hr": "HR",
    "hour": "HR",
    "hours": "HR",
    "day": "DAY",
    "days": "DAY",
    
    // Weight/volume
    "kg": "KG",
    "l": "L",
    "litre": "L",
    "liter": "L",
    
    // Other
    "pack": "PACK",
    "bag": "PACK",
  };
  
  const normalized = unit.toLowerCase().trim();
  return unitMap[normalized] || "EA"; // Default to Each if unknown
}

// Generate quote number with format: Q-YYYY-NNNN
async function generateQuoteNumber(): Promise<string> {
  const year = new Date().getFullYear();
  
  // Get the last quote number for this year
  const lastQuote = await prisma.quote.findFirst({
    where: {
      quoteNumber: {
        startsWith: `Q-${year}-`
      }
    },
    orderBy: {
      quoteNumber: 'desc'
    }
  });
  
  let nextNumber = 1;
  if (lastQuote) {
    const parts = lastQuote.quoteNumber.split('-');
    const lastNumber = parseInt(parts[2]);
    nextNumber = lastNumber + 1;
  }
  
  return `Q-${year}-${nextNumber.toString().padStart(4, '0')}`;
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    const body = await request.json();
    const { quoteDraft, sessionId } = body as { quoteDraft: GeneratedQuote; sessionId?: string };
    
    if (!quoteDraft) {
      return NextResponse.json({ error: "Quote draft is required" }, { status: 400 });
    }
    
    console.log('[Create Quote] Creating quote with', quoteDraft.items.length, 'items');
    
    // Get user settings for defaults
    const settings = await prisma.settings.findUnique({
      where: { userId: user.id }
    });
    
    // Generate quote number
    const quoteNumber = await generateQuoteNumber();
    
    // Calculate totals
    const subtotal = quoteDraft.items.reduce((sum, item) => {
      return sum + (item.quantity * (item.unitPrice || 0));
    }, 0);
    
    const taxRate = settings?.defaultTaxRate || 10;
    const tax = subtotal * (taxRate / 100);
    const total = subtotal + tax;
    
    // Create the quote with all items
    const quote = await prisma.quote.create({
      data: {
        quoteNumber,
        title: quoteDraft.projectName || "BOQ Import",
        description: `Imported from BOQ file. Contains ${quoteDraft.items.length} items.`,
        status: "DRAFT",
        createdById: user.id,
        subtotal,
        tax,
        total,
        validUntil: settings?.defaultValidityDays 
          ? new Date(Date.now() + settings.defaultValidityDays * 24 * 60 * 60 * 1000)
          : null,
        termsConditions: settings?.defaultTermsConditions || null,
        items: {
          create: quoteDraft.items.map((item, index) => ({
            description: item.description,
            quantity: item.quantity,
            unit: mapToUnit(item.unit),
            unitPrice: item.unitPrice || 0,
            total: item.quantity * (item.unitPrice || 0),
            itemType: getItemType((item as AIQuoteItem & { confidence: string }).confidence || 'low'),
            notes: (item as AIQuoteItem & { notes?: string }).notes || null,
            sortOrder: index
          }))
        }
      },
      include: {
        items: true,
        createdBy: true
      }
    });
    
    console.log('[Create Quote] Created quote:', quote.quoteNumber, 'with', quote.items.length, 'items');
    
    // Update AI session if provided
    if (sessionId) {
      await prisma.aISession.update({
        where: { id: sessionId },
        data: {
          generatedQuote: {
            ...JSON.parse(JSON.stringify(quoteDraft)),
            databaseQuoteId: quote.id,
            quoteNumber: quote.quoteNumber
          }
        }
      });
    }
    
    return NextResponse.json({
      success: true,
      quote: {
        id: quote.id,
        quoteNumber: quote.quoteNumber,
        title: quote.title,
        status: quote.status,
        itemCount: quote.items.length,
        total: quote.total
      },
      message: `Quote ${quote.quoteNumber} created successfully with ${quote.items.length} items`
    });
  } catch (error) {
    console.error('[Create Quote] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create quote" },
      { status: 500 }
    );
  }
}