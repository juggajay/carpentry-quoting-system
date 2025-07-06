"use server";

import { prisma } from "@/lib/prisma";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

async function generateUniqueQuoteNumber(userId: string): Promise<string> {
  const currentYear = new Date().getFullYear();
  
  // Get the highest quote number for this year
  const lastQuote = await prisma.quote.findFirst({
    where: {
      userId,
      quoteNumber: {
        startsWith: `Q-${currentYear}-`
      }
    },
    orderBy: {
      quoteNumber: 'desc'
    }
  });

  let nextNumber = 1;
  
  if (lastQuote) {
    // Extract the number from the last quote (Q-2024-0001 -> 1)
    const matches = lastQuote.quoteNumber.match(/Q-\d{4}-(\d{4})/);
    if (matches) {
      nextNumber = parseInt(matches[1]) + 1;
    }
  }

  // Keep trying until we find a unique number (handles race conditions)
  let attempts = 0;
  while (attempts < 10) {
    const quoteNumber = `Q-${currentYear}-${String(nextNumber).padStart(4, '0')}`;
    
    // Check if this number already exists
    const existing = await prisma.quote.findUnique({
      where: { quoteNumber }
    });
    
    if (!existing) {
      return quoteNumber;
    }
    
    nextNumber++;
    attempts++;
  }
  
  // Fallback with timestamp to ensure uniqueness
  return `Q-${currentYear}-${Date.now()}`;
}


export async function updateQuote(quoteId: string, data: any) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) throw new Error("User not found");

    // Verify quote ownership
    const quote = await prisma.quote.findFirst({
      where: {
        id: quoteId,
        userId: user.id,
      },
    });

    if (!quote) throw new Error("Quote not found");

    // Calculate totals
    const subtotal = data.items.reduce((sum: number, item: any) => sum + (item.total || 0), 0);
    const tax = subtotal * 0.10; // 10% GST for Australia
    const total = subtotal + tax;

    // Update quote in transaction
    await prisma.$transaction(async (tx) => {
      // Update quote
      await tx.quote.update({
        where: { id: quoteId },
        data: {
          title: data.title,
          description: data.description,
          subtotal,
          tax,
          total,
          notes: data.notes,
          termsConditions: data.termsConditions,
          validUntil: data.validUntil ? new Date(data.validUntil) : null,
        },
      });

      // Delete existing items
      await tx.quoteItem.deleteMany({
        where: { quoteId },
      });

      // Create new items
      const items = data.items.map((item: any, index: number) => ({
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        total: item.total,
        sortOrder: index,
        quoteId,
      }));

      await tx.quoteItem.createMany({
        data: items,
      });
    });

    revalidatePath(`/quotes/${quoteId}`);
    return { success: true };
  } catch (error) {
    console.error("Save quote error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save",
    };
  }
}

export async function createQuote(data: any) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) throw new Error("User not found");

    // Get or create client
    let client = null;
    if (data.clientName) {
      client = await prisma.client.findFirst({
        where: {
          userId: user.id,
          name: data.clientName,
        },
      });

      if (!client) {
        client = await prisma.client.create({
          data: {
            name: data.clientName,
            email: data.clientEmail || '',
            phone: data.clientPhone || '',
            userId: user.id,
          },
        });
      }
    }

    // Generate unique sequential quote number
    const quoteNumber = await generateUniqueQuoteNumber(user.id);

    // Calculate totals
    const subtotal = data.items?.reduce((sum: number, item: any) => sum + (item.total || 0), 0) || 0;
    const tax = subtotal * 0.10; // 10% GST for Australia
    const total = subtotal + tax;

    // Create quote
    const quote = await prisma.quote.create({
      data: {
        quoteNumber,
        title: data.projectTitle || data.title || 'Untitled Quote',
        description: data.projectDescription || data.description || '',
        notes: data.notes || '',
        termsConditions: data.additionalTerms || data.termsConditions || '',
        validUntil: data.validUntil ? new Date(data.validUntil) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        subtotal,
        tax,
        total,
        status: "DRAFT",
        clientId: client?.id,
        userId: user.id,
        versionNumber: 1,
      },
    });

    // Create quote items
    if (data.items && data.items.length > 0) {
      await prisma.quoteItem.createMany({
        data: data.items.map((item: any, index: number) => ({
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: item.unitPrice,
          total: item.total,
          sortOrder: index,
          quoteId: quote.id,
        })),
      });
    }

    revalidatePath("/quotes");
    
    return { success: true, quoteId: quote.id };
  } catch (error) {
    console.error("createQuote error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create quote",
    };
  }
}

export async function loadQuote(quoteId: string) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) throw new Error("User not found");

    const quote = await prisma.quote.findUnique({
      where: { id: quoteId, userId: user.id },
      include: {
        client: true,
        items: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!quote) throw new Error("Quote not found");

    return {
      success: true,
      data: {
        title: quote.title,
        description: quote.description || "",
        clientId: quote.clientId || "",
        clientName: quote.client?.name || "",
        clientEmail: quote.client?.email || "",
        clientPhone: quote.client?.phone || "",
        validUntil: quote.validUntil?.toISOString().split("T")[0] || "",
        notes: quote.notes || "",
        termsConditions: quote.termsConditions || "",
        items: quote.items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: item.unitPrice,
          total: item.total,
        })),
      },
    };
  } catch (error) {
    console.error("loadQuote error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load quote",
    };
  }
}