'use client';

import { useState, useEffect } from 'react';
import { Permission } from '@/lib/permissions';

interface PermissionsState {
  permissions: Permission[];
  loading: boolean;
  hasPermission: (permission: Permission) => boolean;
}

export function usePermissions(): PermissionsState {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    try {
      const response = await fetch('/api/auth/permissions');
      if (response.ok) {
        const data = await response.json();
        setPermissions(data.permissions);
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (permission: Permission): boolean => {
    return permissions.includes(permission);
  };

  return { permissions, loading, hasPermission };
}