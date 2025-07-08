import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { Permission } from "@/lib/permissions";
import { rolePermissions } from "@/lib/permissions-client";

export async function GET() {
  const { userId } = await auth();
  
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const user = await db.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user || !user.isActive) {
      return NextResponse.json({ permissions: [] });
    }

    // Get role-based permissions
    const rolePerms = rolePermissions[user.role] || [];
    const permissions = new Set<Permission>(rolePerms);

    // Add individual permission overrides
    if (user.canCreateQuotes) permissions.add('quotes.create');
    if (user.canEditQuotes) permissions.add('quotes.edit');
    if (user.canDeleteQuotes) permissions.add('quotes.delete');
    if (user.canViewAllQuotes) permissions.add('quotes.viewAll');
    if (user.canManageUsers) permissions.add('users.manage');
    if (user.canViewReports) permissions.add('reports.view');
    if (user.canManageSettings) permissions.add('settings.manage');

    return NextResponse.json({ 
      permissions: Array.from(permissions),
      role: user.role,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Error fetching permissions:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}