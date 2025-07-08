import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    const user = await db.user.findUnique({
      where: { clerkId: userId },
    });

    const where: Prisma.LaborRateWhereInput = { userId: user!.id };
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { level: { contains: search, mode: 'insensitive' } },
      ];
    }

    const laborRates = await db.laborRate.findMany({
      where,
      orderBy: { title: 'asc' },
    });

    return NextResponse.json(laborRates);
  } catch (error) {
    console.error("[LABOR_RATES_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}