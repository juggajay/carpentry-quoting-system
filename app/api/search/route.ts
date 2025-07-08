import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { Prisma } from "@prisma/client";


export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user
    const user = await db.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get search params
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const status = searchParams.get("status");
    const minAmount = searchParams.get("minAmount");
    const maxAmount = searchParams.get("maxAmount");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");

    // Build where clause
    const where: Prisma.QuoteWhereInput = {
      userId: user.id,
    };

    // Text search across multiple fields
    if (search) {
      where.OR = [
        { quoteNumber: { contains: search } },
        { title: { contains: search } },
        { description: { contains: search } },
        { client: { name: { contains: search } } },
        { client: { email: { contains: search } } },
        { client: { company: { contains: search } } },
        {
          items: {
            some: {
              description: { contains: search },
            },
          },
        },
      ];
    }

    // Date range filter
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        // Add 1 day to include the entire end date
        const endDate = new Date(dateTo);
        endDate.setDate(endDate.getDate() + 1);
        where.createdAt.lt = endDate;
      }
    }

    // Status filter
    if (status) {
      where.status = status as Prisma.EnumQuoteStatusFilter;
    }

    // Amount range filter
    if (minAmount || maxAmount) {
      where.total = {};
      if (minAmount) {
        where.total.gte = parseFloat(minAmount);
      }
      if (maxAmount) {
        where.total.lte = parseFloat(maxAmount);
      }
    }

    // Get total count for pagination
    const totalCount = await db.quote.count({ where });

    // Get quotes with pagination
    const quotes = await db.quote.findMany({
      where,
      include: {
        client: true,
        _count: {
          select: { items: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    return NextResponse.json({
      quotes,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json(
      { error: "Failed to search quotes" },
      { status: 500 }
    );
  }
}