// app/api/materials/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    // Verify user is authenticated
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    // Build query
    const where: {
      OR?: Array<Record<string, unknown>>;
      category?: string;
      AND?: Array<Record<string, unknown>>;
    } = {
      // Get global materials (userId is null) or user-specific materials
      OR: [
        { userId: null },
        { user: { clerkId: userId } }
      ]
    };

    // Add category filter if provided
    if (category) {
      where.category = category;
    }

    // Add search filter if provided
    if (search) {
      where.AND = [
        {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
            { sku: { contains: search, mode: "insensitive" } }
          ]
        }
      ];
    }

    // Fetch materials
    const materials = await db.material.findMany({
      where,
      orderBy: [
        { category: "asc" },
        { name: "asc" }
      ],
      select: {
        id: true,
        name: true,
        description: true,
        sku: true,
        unit: true,
        pricePerUnit: true,
        category: true,
        supplier: true,
        inStock: true,
      }
    });

    return NextResponse.json(materials);
  } catch (error) {
    console.error("Error fetching materials:", error);
    return NextResponse.json(
      { error: "Failed to fetch materials" },
      { status: 500 }
    );
  }
}