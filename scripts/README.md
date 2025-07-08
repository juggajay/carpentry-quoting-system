# Admin Scripts

These scripts help manage users and permissions in the carpentry quoting system.

## Prerequisites

Make sure you have the database connection configured in your `.env` file.

## Available Scripts

### 1. Setup Admin User
Creates or updates a user with OWNER role and full permissions.

```bash
npx tsx scripts/setup-admin.ts <clerkId> <email> [firstName] [lastName]

# Example:
npx tsx scripts/setup-admin.ts user_2abc123 admin@example.com John Doe
```

To find your Clerk ID:
1. Sign in to your application
2. Visit `/debug-auth` to see your Clerk user ID

### 2. Clear All Users
Removes all users and related data from the database (with confirmation).

```bash
npx tsx scripts/clear-users.ts
```

### 3. Manage Role Permissions
List users or apply role-based permission templates.

```bash
# List all users and their permissions
npx tsx scripts/setup-roles.ts list

# Apply role-based permission templates to all users
npx tsx scripts/setup-roles.ts apply
```

### 4. Change User Role
Update a user's role by email.

```bash
npx tsx scripts/change-role.ts <email> <role>

# Example:
npx tsx scripts/change-role.ts user@example.com MANAGER
```

Available roles: OWNER, ADMIN, MANAGER, EMPLOYEE, VIEWER

## Role Permissions

| Permission | OWNER | ADMIN | MANAGER | EMPLOYEE | VIEWER |
|------------|-------|-------|---------|----------|--------|
| Create Quotes | ✅ | ✅ | ✅ | ✅ | ❌ |
| Edit Quotes | ✅ | ✅ | ✅ | ✅ | ❌ |
| Delete Quotes | ✅ | ✅ | ✅ | ❌ | ❌ |
| View All Quotes | ✅ | ✅ | ✅ | ❌ | ❌ |
| Manage Users | ✅ | ✅ | ❌ | ❌ | ❌ |
| View Reports | ✅ | ✅ | ✅ | ❌ | ✅ |
| Manage Settings | ✅ | ❌ | ❌ | ❌ | ❌ |

## Workflow Example

1. First user signs up → Run setup-admin to make them OWNER
2. Add more users → They start as VIEWER by default
3. Change roles as needed → Use change-role script
4. Apply role templates → Use setup-roles apply

## Notes

- Individual permissions can override role defaults
- The OWNER role should be limited to 1-2 trusted users
- Always verify changes with `setup-roles.ts list`