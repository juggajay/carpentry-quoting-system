"use server";

import { auth } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";

const prisma = new PrismaClient();

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
          data: data,
          userId: user.id,
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