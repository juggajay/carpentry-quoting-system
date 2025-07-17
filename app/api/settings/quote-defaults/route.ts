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
      select: { id: true, canManageSettings: true, role: true },
    });

    if (!user || (!user.canManageSettings && user.role !== "OWNER")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get settings from database
    const settings = await db.settings.findFirst({
      where: { userId: user.id },
    });

    if (!settings) {
      // Return default values if no settings exist
      return NextResponse.json({
        companyName: "",
        companyAddress: "",
        companyPhone: "",
        companyEmail: "",
        abn: "",
        companyLogoUrl: "",
        defaultTaxRate: 10,
        defaultValidityDays: 30,
        defaultTermsConditions: "",
        defaultNotes: "",
        defaultUnit: "EA",
        saturdayRateMultiplier: 1.5,
        sundayRateMultiplier: 2.0,
      });
    }

    // Ensure companyLogoUrl field exists (for backward compatibility)
    const settingsWithLogo = {
      ...settings,
      companyLogoUrl: settings.companyLogoUrl || "",
    };

    return NextResponse.json(settingsWithLogo);
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

    // Extract logo URL safely (might not exist in DB schema yet)
    const { companyLogoUrl, ...safeData } = data;

    // Upsert settings - handle logo field safely
    const settings = await db.settings.upsert({
      where: { userId: user.id },
      update: {
        ...safeData,
        ...(companyLogoUrl !== undefined && { companyLogoUrl }),
        updatedAt: new Date(),
      },
      create: {
        ...safeData,
        ...(companyLogoUrl !== undefined && { companyLogoUrl }),
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