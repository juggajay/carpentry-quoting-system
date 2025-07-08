// Client-side permission utilities
import { Permission } from './permissions';

// Export rolePermissions for client-side use
export const rolePermissions: Record<string, Permission[]> = {
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

export type { Permission } from './permissions';