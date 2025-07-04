import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ quoteId: string }> }
) {
  const { quoteId } = await params;
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get quote with items
    const quote = await prisma.quote.findFirst({
      where: {
        id: quoteId,
        userId: user.id,
      },
      include: {
        items: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!quote) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    // Return only the items
    return NextResponse.json(quote.items);
  } catch (error) {
    console.error("Get quote items error:", error);
    return NextResponse.json(
      { error: "Failed to get quote items" },
      { status: 500 }
    );
  }
}