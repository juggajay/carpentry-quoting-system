import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId: currentUserId } = await auth();
  
  if (!currentUserId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const currentUser = await db.user.findUnique({
      where: { clerkId: currentUserId },
    });

    if (!currentUser || (!currentUser.canManageUsers && currentUser.role !== 'OWNER' && currentUser.role !== 'ADMIN')) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const body = await req.json();
    const { userId } = await params;
    
    // Don't allow users to change their own role or the owner's role
    const targetUser = await db.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return new NextResponse("User not found", { status: 404 });
    }

    if (targetUser.role === 'OWNER' && currentUser.role !== 'OWNER') {
      return new NextResponse("Cannot modify owner", { status: 403 });
    }

    if (currentUser.id === userId && body.role) {
      return new NextResponse("Cannot modify your own role", { status: 403 });
    }

    // Update user with role-based permission presets if role is being changed
    const updateData = body.role ? {
      ...body,
      ...getRolePermissions(body.role),
    } : body;

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: updateData,
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

function getRolePermissions(role: UserRole) {
  switch (role) {
    case 'OWNER':
      return {
        canCreateQuotes: true,
        canEditQuotes: true,
        canDeleteQuotes: true,
        canViewAllQuotes: true,
        canManageUsers: true,
        canViewReports: true,
        canManageSettings: true,
      };
    case 'ADMIN':
      return {
        canCreateQuotes: true,
        canEditQuotes: true,
        canDeleteQuotes: true,
        canViewAllQuotes: true,
        canManageUsers: true,
        canViewReports: true,
        canManageSettings: false,
      };
    case 'MANAGER':
      return {
        canCreateQuotes: true,
        canEditQuotes: true,
        canDeleteQuotes: true,
        canViewAllQuotes: true,
        canManageUsers: false,
        canViewReports: true,
        canManageSettings: false,
      };
    case 'EMPLOYEE':
      return {
        canCreateQuotes: true,
        canEditQuotes: true,
        canDeleteQuotes: false,
        canViewAllQuotes: false,
        canManageUsers: false,
        canViewReports: false,
        canManageSettings: false,
      };
    case 'VIEWER':
    default:
      return {
        canCreateQuotes: false,
        canEditQuotes: false,
        canDeleteQuotes: false,
        canViewAllQuotes: false,
        canManageUsers: false,
        canViewReports: true,
        canManageSettings: false,
      };
  }
}