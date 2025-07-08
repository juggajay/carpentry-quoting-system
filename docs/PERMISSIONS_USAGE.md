# Permissions System Usage Guide

## Overview
The permissions system provides both role-based and granular permission controls for users.

## Server-Side Usage

### In API Routes
```typescript
import { checkPermission, requirePermission, getCurrentUser } from '@/lib/permissions';

// Check permission (returns boolean)
export async function GET() {
  if (!await checkPermission('quotes.viewAll')) {
    return new NextResponse("Forbidden", { status: 403 });
  }
  // ... rest of the code
}

// Require permission (throws error if not allowed)
export async function POST() {
  await requirePermission('quotes.create');
  // ... rest of the code
}

// Check quote access
import { canAccessQuote } from '@/lib/permissions';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  if (!await canAccessQuote(params.id)) {
    return new NextResponse("Forbidden", { status: 403 });
  }
  // ... rest of the code
}
```

### In Server Components
```typescript
import { checkPermission, getQuotesFilter } from '@/lib/permissions';

export default async function QuotesPage() {
  const canCreateQuotes = await checkPermission('quotes.create');
  const quotesFilter = await getQuotesFilter();
  
  const quotes = await db.quote.findMany({
    where: quotesFilter,
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div>
      {canCreateQuotes && (
        <Button href="/quotes/new">Create Quote</Button>
      )}
      {/* ... */}
    </div>
  );
}
```

## Client-Side Usage

### Using the Hook
```typescript
'use client';
import { usePermissions } from '@/hooks/usePermissions';

export function QuoteActions() {
  const { hasPermission, loading } = usePermissions();

  if (loading) return <Spinner />;

  return (
    <div>
      {hasPermission('quotes.create') && (
        <Button>Create Quote</Button>
      )}
      {hasPermission('quotes.delete') && (
        <Button variant="danger">Delete</Button>
      )}
    </div>
  );
}
```

### Using the Context Provider
Add to your layout:
```typescript
import { PermissionsProvider } from '@/providers/PermissionsProvider';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <PermissionsProvider>
      {children}
    </PermissionsProvider>
  );
}
```

Then use in components:
```typescript
'use client';
import { usePermission, PermissionGuard } from '@/providers/PermissionsProvider';

export function AdminPanel() {
  return (
    <PermissionGuard permission="users.manage" fallback={<AccessDenied />}>
      <div>Admin content here...</div>
    </PermissionGuard>
  );
}
```

## Available Permissions
- `quotes.create` - Create new quotes
- `quotes.edit` - Edit existing quotes
- `quotes.delete` - Delete quotes
- `quotes.viewAll` - View all quotes (not just own)
- `users.manage` - Manage users and permissions
- `reports.view` - View reports and analytics
- `settings.manage` - Manage system settings

## Role Defaults
- **OWNER**: All permissions
- **ADMIN**: All permissions
- **MANAGER**: All quote permissions + reports
- **EMPLOYEE**: Create and edit quotes (own only)
- **VIEWER**: View reports only

Individual permissions can override role defaults.