import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";

export type Permission = 
  | 'quotes.create'
  | 'quotes.edit'
  | 'quotes.delete'
  | 'quotes.viewAll'
  | 'users.manage'
  | 'reports.view'
  | 'settings.manage';

const rolePermissions: Record<UserRole, Permission[]> = {
  OWNER: [
    'quotes.create', 'quotes.edit', 'quotes.delete', 'quotes.viewAll',
    'users.manage', 'reports.view', 'settings.manage'
  ],
  ADMIN: [
    'quotes.create', 'quotes.edit', 'quotes.delete', 'quotes.viewAll',
    'users.manage', 'reports.view', 'settings.manage'
  ],
  MANAGER: [
    'quotes.create', 'quotes.edit', 'quotes.delete', 'quotes.viewAll',
    'reports.view'
  ],
  EMPLOYEE: [
    'quotes.create', 'quotes.edit'
  ],
  VIEWER: [
    'reports.view'
  ]
};

export async function getCurrentUser() {
  const { userId } = await auth();
  
  if (!userId) return null;
  
  return await db.user.findUnique({
    where: { clerkId: userId }
  });
}

export async function checkPermission(permission: Permission): Promise<boolean> {
  const user = await getCurrentUser();
  
  if (!user || !user.isActive) return false;
  
  // Check role-based permissions
  const rolePerms = rolePermissions[user.role];
  if (rolePerms.includes(permission)) return true;
  
  // Check individual permissions (overrides)
  switch (permission) {
    case 'quotes.create': return user.canCreateQuotes;
    case 'quotes.edit': return user.canEditQuotes;
    case 'quotes.delete': return user.canDeleteQuotes;
    case 'quotes.viewAll': return user.canViewAllQuotes;
    case 'users.manage': return user.canManageUsers;
    case 'reports.view': return user.canViewReports;
    case 'settings.manage': return user.canManageSettings;
    default: return false;
  }
}

export async function requirePermission(permission: Permission) {
  const hasPermission = await checkPermission(permission);
  if (!hasPermission) {
    throw new Error('Unauthorized: Missing required permission');
  }
}

// Helper to check if user can access a specific quote
export async function canAccessQuote(quoteId: string): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;

  // Check if user can view all quotes
  if (await checkPermission('quotes.viewAll')) return true;

  // Otherwise, check if they created or are assigned to the quote
  const quote = await db.quote.findUnique({
    where: { id: quoteId },
    select: { createdById: true, assignedToId: true }
  });

  if (!quote) return false;
  
  return quote.createdById === user.id || quote.assignedToId === user.id;
}

// Helper to get quotes query filter based on permissions
export async function getQuotesFilter() {
  const user = await getCurrentUser();
  if (!user) return null;

  // If user can view all quotes, no filter needed
  if (await checkPermission('quotes.viewAll')) {
    return {};
  }

  // Otherwise, only show quotes they created or are assigned to
  return {
    OR: [
      { createdById: user.id },
      { assignedToId: user.id }
    ]
  };
}