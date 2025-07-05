import { prisma } from "@/lib/prisma";
"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";


export async function saveQuote(quoteId: string, data: any) {
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
    const tax = subtotal * 0.0825;
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

      // Create version snapshot
      const versionCount = await tx.quoteVersion.count({
        where: { quoteId },
      });

      await tx.quoteVersion.create({
        data: {
          quoteId,
          versionNumber: versionCount + 1,
          changes: {
            action: "auto-save",
            timestamp: new Date(),
            fields: ["items", "totals"],
          },
        },
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
            email: data.clientEmail,
            phone: data.clientPhone,
            userId: user.id,
          },
        });
      }
    }

    // Generate quote number
    const quoteCount = await prisma.quote.count({
      where: { userId: user.id },
    });
    const quoteNumber = `Q-${new Date().getFullYear()}-${String(quoteCount + 1).padStart(4, "0")}`;

    // Calculate totals
    const subtotal = data.items?.reduce((sum: number, item: any) => sum + (item.total || 0), 0) || 0;
    const tax = subtotal * 0.0825;
    const total = subtotal + tax;

    // Create quote
    const quote = await prisma.quote.create({
      data: {
        quoteNumber,
        title: data.title,
        description: data.description,
        notes: data.notes,
        termsConditions: data.termsConditions,
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