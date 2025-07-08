'use client';

import React, { createContext, useContext } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { Permission } from '@/lib/permissions';

interface PermissionsContextType {
  permissions: Permission[];
  loading: boolean;
  hasPermission: (permission: Permission) => boolean;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

export function PermissionsProvider({ children }: { children: React.ReactNode }) {
  const permissionsData = usePermissions();

  return (
    <PermissionsContext.Provider value={permissionsData}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermission() {
  const context = useContext(PermissionsContext);
  if (context === undefined) {
    throw new Error('usePermission must be used within a PermissionsProvider');
  }
  return context;
}

// Permission guard component
interface PermissionGuardProps {
  permission: Permission;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PermissionGuard({ permission, children, fallback = null }: PermissionGuardProps) {
  const { hasPermission, loading } = usePermission();

  if (loading) return null;
  
  return hasPermission(permission) ? <>{children}</> : <>{fallback}</>;
}