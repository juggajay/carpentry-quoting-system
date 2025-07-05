import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const category = searchParams.get("category");

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    const where: Prisma.MaterialWhereInput = { userId: user!.id };
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    if (category) {
      where.category = category;
    }

    const materials = await prisma.material.findMany({
      where,
      orderBy: { name: 'asc' },
      take: 50,
    });

    return NextResponse.json(materials);
  } catch (error) {
    console.error("[MATERIALS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}