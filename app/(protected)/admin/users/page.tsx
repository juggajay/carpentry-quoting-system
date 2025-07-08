'use client';

import { useState, useEffect } from 'react';
import { UserRole } from '@prisma/client';
import PageContainer from '@/components/layout/PageContainer';
import ContentCard from '@/components/layout/ContentCard';
import { Button } from '@/components/ui/Button';

interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: UserRole;
  isActive: boolean;
  canCreateQuotes: boolean;
  canEditQuotes: boolean;
  canDeleteQuotes: boolean;
  canViewAllQuotes: boolean;
  canManageUsers: boolean;
  canViewReports: boolean;
  canManageSettings: boolean;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, role: UserRole) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      
      if (response.ok) {
        fetchUsers();
        setEditingUser(null);
      }
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const updateUserPermission = async (userId: string, permission: string, value: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [permission]: value }),
      });
      
      if (response.ok) {
        fetchUsers();
      }
    } catch (error) {
      console.error('Error updating permission:', error);
    }
  };

  const roleColors = {
    OWNER: 'bg-purple-600/20 text-purple-400',
    ADMIN: 'bg-critical-red/20 text-critical-red',
    MANAGER: 'bg-royal-blue/20 text-royal-blue',
    EMPLOYEE: 'bg-lime-green/20 text-lime-green',
    VIEWER: 'bg-gray-600/20 text-gray-400',
  };

  if (loading) {
    return (
      <PageContainer title="User Management">
        <ContentCard>
          <div className="flex justify-center items-center h-64">
            <div className="text-gray-400">Loading users...</div>
          </div>
        </ContentCard>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="User Management"
      description="Manage user roles and permissions"
    >
      <ContentCard>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Permissions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-dark-navy transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-white">
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="text-sm text-gray-400">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingUser === user.id ? (
                      <select
                        value={user.role}
                        onChange={(e) => updateUserRole(user.id, e.target.value as UserRole)}
                        className="mt-1 block w-full py-2 px-3 border border-gray-600 bg-dark-surface text-white rounded-md shadow-sm focus:outline-none focus:ring-electric-magenta focus:border-electric-magenta sm:text-sm"
                      >
                        {Object.values(UserRole).map((role) => (
                          <option key={role} value={role}>{role}</option>
                        ))}
                      </select>
                    ) : (
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${roleColors[user.role]}`}>
                        {user.role}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">
                    <div className="space-y-2">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={user.canCreateQuotes}
                          onChange={(e) => updateUserPermission(user.id, 'canCreateQuotes', e.target.checked)}
                          className="mr-2 rounded border-gray-600 bg-dark-surface text-electric-magenta focus:ring-electric-magenta"
                        />
                        <span className="text-xs">Create Quotes</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={user.canEditQuotes}
                          onChange={(e) => updateUserPermission(user.id, 'canEditQuotes', e.target.checked)}
                          className="mr-2 rounded border-gray-600 bg-dark-surface text-electric-magenta focus:ring-electric-magenta"
                        />
                        <span className="text-xs">Edit Quotes</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={user.canViewAllQuotes}
                          onChange={(e) => updateUserPermission(user.id, 'canViewAllQuotes', e.target.checked)}
                          className="mr-2 rounded border-gray-600 bg-dark-surface text-electric-magenta focus:ring-electric-magenta"
                        />
                        <span className="text-xs">View All Quotes</span>
                      </label>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.isActive ? 'bg-lime-green/20 text-lime-green' : 'bg-critical-red/20 text-critical-red'
                    }`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Button
                      onClick={() => setEditingUser(editingUser === user.id ? null : user.id)}
                      variant="ghost"
                      size="sm"
                    >
                      {editingUser === user.id ? 'Save' : 'Edit'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ContentCard>

      <ContentCard className="mt-8">
        <h2 className="text-xl font-semibold text-white mb-6">Role Permissions Guide</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-dark-surface rounded-lg p-4">
            <div className="flex items-center mb-3">
              <span className={`px-3 py-1 text-xs font-semibold rounded-full ${roleColors.OWNER}`}>
                OWNER
              </span>
            </div>
            <p className="text-sm text-gray-400">Full access to everything including user management and system settings.</p>
          </div>
          
          <div className="bg-dark-surface rounded-lg p-4">
            <div className="flex items-center mb-3">
              <span className={`px-3 py-1 text-xs font-semibold rounded-full ${roleColors.ADMIN}`}>
                ADMIN
              </span>
            </div>
            <p className="text-sm text-gray-400">Can manage users and all data, but limited system settings access.</p>
          </div>
          
          <div className="bg-dark-surface rounded-lg p-4">
            <div className="flex items-center mb-3">
              <span className={`px-3 py-1 text-xs font-semibold rounded-full ${roleColors.MANAGER}`}>
                MANAGER
              </span>
            </div>
            <p className="text-sm text-gray-400">Can manage quotes and invoices, view all data and reports.</p>
          </div>
          
          <div className="bg-dark-surface rounded-lg p-4">
            <div className="flex items-center mb-3">
              <span className={`px-3 py-1 text-xs font-semibold rounded-full ${roleColors.EMPLOYEE}`}>
                EMPLOYEE
              </span>
            </div>
            <p className="text-sm text-gray-400">Can create and view own quotes, limited data access.</p>
          </div>
          
          <div className="bg-dark-surface rounded-lg p-4">
            <div className="flex items-center mb-3">
              <span className={`px-3 py-1 text-xs font-semibold rounded-full ${roleColors.VIEWER}`}>
                VIEWER
              </span>
            </div>
            <p className="text-sm text-gray-400">Read-only access to assigned data and reports.</p>
          </div>
        </div>
      </ContentCard>
    </PageContainer>
  );
}