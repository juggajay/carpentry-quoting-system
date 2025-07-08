import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId: currentUserId } = await auth();
    if (!currentUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has permission to manage users
    const currentUser = await db.user.findUnique({
      where: { clerkId: currentUserId },
      select: { id: true, canManageUsers: true, role: true },
    });

    if (!currentUser || (!currentUser.canManageUsers && currentUser.role !== "OWNER")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { userId } = await params;
    const data = await req.json();

    // Prevent users from modifying their own role
    if (currentUser.id === userId && data.role) {
      return NextResponse.json(
        { error: "Cannot modify your own role" },
        { status: 400 }
      );
    }

    // Prevent non-owners from creating other owners
    if (currentUser.role !== "OWNER" && data.role === "OWNER") {
      return NextResponse.json(
        { error: "Only owners can create other owners" },
        { status: 403 }
      );
    }

    // Update user
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        canCreateQuotes: true,
        canEditQuotes: true,
        canDeleteQuotes: true,
        canViewAllQuotes: true,
        canManageUsers: true,
        canViewReports: true,
        canManageSettings: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Failed to update user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}