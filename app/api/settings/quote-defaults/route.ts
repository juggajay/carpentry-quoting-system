import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has permission to view settings
    const user = await db.user.findUnique({
      where: { clerkId: userId },
      select: { canManageSettings: true, role: true },
    });

    if (!user || (!user.canManageSettings && user.role !== "OWNER")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get settings from database
    const settings = await db.settings.findFirst({
      where: { userId },
    });

    if (!settings) {
      // Return default values if no settings exist
      return NextResponse.json({
        companyName: "",
        companyAddress: "",
        companyPhone: "",
        companyEmail: "",
        abn: "",
        defaultTaxRate: 10,
        defaultValidityDays: 30,
        defaultTermsConditions: "",
        defaultNotes: "",
        defaultUnit: "EA",
        saturdayRateMultiplier: 1.5,
        sundayRateMultiplier: 2.0,
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Failed to fetch settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has permission to manage settings
    const user = await db.user.findUnique({
      where: { clerkId: userId },
      select: { id: true, canManageSettings: true, role: true },
    });

    if (!user || (!user.canManageSettings && user.role !== "OWNER")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const data = await req.json();

    // Upsert settings
    const settings = await db.settings.upsert({
      where: { userId: user.id },
      update: {
        ...data,
        updatedAt: new Date(),
      },
      create: {
        ...data,
        userId: user.id,
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Failed to save settings:", error);
    return NextResponse.json(
      { error: "Failed to save settings" },
      { status: 500 }
    );
  }
}