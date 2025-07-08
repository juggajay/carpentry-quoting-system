"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { toast } from "sonner";
import { Loader2, UserCog, Shield, User } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Label } from "@/components/ui/label";

type UserRole = "OWNER" | "ADMIN" | "USER";

interface UserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
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

const rolePermissions = {
  OWNER: {
    canCreateQuotes: true,
    canEditQuotes: true,
    canDeleteQuotes: true,
    canViewAllQuotes: true,
    canManageUsers: true,
    canViewReports: true,
    canManageSettings: true,
  },
  ADMIN: {
    canCreateQuotes: true,
    canEditQuotes: true,
    canDeleteQuotes: true,
    canViewAllQuotes: true,
    canManageUsers: false,
    canViewReports: true,
    canManageSettings: false,
  },
  USER: {
    canCreateQuotes: true,
    canEditQuotes: true,
    canDeleteQuotes: false,
    canViewAllQuotes: false,
    canManageUsers: false,
    canViewReports: false,
    canManageSettings: false,
  },
};

export default function UserManagement() {
  const { user: currentUser } = useUser();
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/users");
      if (!response.ok) throw new Error("Failed to fetch users");
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast.error("Failed to load users");
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: UserRole) => {
    setSavingUserId(userId);
    try {
      const permissions = rolePermissions[newRole];
      const response = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole, ...permissions }),
      });

      if (!response.ok) throw new Error("Failed to update user");

      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, role: newRole, ...permissions }
          : user
      ));

      toast.success("User role updated successfully");
    } catch (error) {
      console.error("Failed to update user:", error);
      toast.error("Failed to update user role");
    } finally {
      setSavingUserId(null);
    }
  };

  const toggleUserStatus = async (userId: string, isActive: boolean) => {
    setSavingUserId(userId);
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });

      if (!response.ok) throw new Error("Failed to update user");

      setUsers(users.map(user => 
        user.id === userId ? { ...user, isActive } : user
      ));

      toast.success(`User ${isActive ? "activated" : "deactivated"} successfully`);
    } catch (error) {
      console.error("Failed to update user:", error);
      toast.error("Failed to update user status");
    } finally {
      setSavingUserId(null);
    }
  };

  const updateUserPermissions = async () => {
    if (!selectedUser) return;

    setSavingUserId(selectedUser.id);
    try {
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          canCreateQuotes: selectedUser.canCreateQuotes,
          canEditQuotes: selectedUser.canEditQuotes,
          canDeleteQuotes: selectedUser.canDeleteQuotes,
          canViewAllQuotes: selectedUser.canViewAllQuotes,
          canManageUsers: selectedUser.canManageUsers,
          canViewReports: selectedUser.canViewReports,
          canManageSettings: selectedUser.canManageSettings,
        }),
      });

      if (!response.ok) throw new Error("Failed to update permissions");

      setUsers(users.map(user => 
        user.id === selectedUser.id ? selectedUser : user
      ));

      toast.success("User permissions updated successfully");
      setShowPermissionsDialog(false);
    } catch (error) {
      console.error("Failed to update permissions:", error);
      toast.error("Failed to update permissions");
    } finally {
      setSavingUserId(null);
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case "OWNER":
        return <Shield className="h-4 w-4" />;
      case "ADMIN":
        return <UserCog className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case "OWNER":
        return "primary" as const;
      case "ADMIN":
        return "secondary" as const;
      default:
        return "outline" as const;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-electric-magenta" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="rounded-md border border-dark-border overflow-hidden">
          <table className="w-full">
            <thead className="bg-dark-elevated border-b border-dark-border">
              <tr>
                <th className="text-left p-4 text-dark-text-secondary font-medium">User</th>
                <th className="text-left p-4 text-dark-text-secondary font-medium">Role</th>
                <th className="text-left p-4 text-dark-text-secondary font-medium">Status</th>
                <th className="text-left p-4 text-dark-text-secondary font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-dark-border hover:bg-dark-elevated/50 transition-colors">
                  <td className="p-4">
                    <div>
                      <div className="font-medium text-white">
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="text-sm text-dark-text-secondary">
                        {user.email}
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    {user.email === currentUser?.primaryEmailAddress?.emailAddress ? (
                      <Badge variant={getRoleBadgeVariant(user.role)} className="gap-1">
                        {getRoleIcon(user.role)}
                        {user.role} (You)
                      </Badge>
                    ) : (
                      <Select
                        value={user.role}
                        onValueChange={(value) => updateUserRole(user.id, value as UserRole)}
                        disabled={savingUserId === user.id}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="OWNER">
                            <div className="flex items-center gap-2">
                              <Shield className="h-4 w-4" />
                              Owner
                            </div>
                          </SelectItem>
                          <SelectItem value="ADMIN">
                            <div className="flex items-center gap-2">
                              <UserCog className="h-4 w-4" />
                              Admin
                            </div>
                          </SelectItem>
                          <SelectItem value="USER">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              User
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </td>
                  <td className="p-4">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={user.isActive}
                        onChange={(e) => toggleUserStatus(user.id, e.target.checked)}
                        disabled={
                          savingUserId === user.id || 
                          user.email === currentUser?.primaryEmailAddress?.emailAddress
                        }
                      />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-electric-magenta"></div>
                    </label>
                  </td>
                  <td className="p-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedUser(user);
                        setShowPermissionsDialog(true);
                      }}
                      disabled={savingUserId === user.id}
                    >
                      Custom Permissions
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-dark-elevated p-4 rounded-lg border border-dark-border">
          <h4 className="text-sm font-medium text-white mb-2">Role Permissions</h4>
          <div className="space-y-2 text-sm text-dark-text-secondary">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-electric-magenta" />
              <span className="font-medium">Owner:</span> Full system access, can manage all users and settings
            </div>
            <div className="flex items-center gap-2">
              <UserCog className="h-4 w-4 text-royal-blue" />
              <span className="font-medium">Admin:</span> Can manage quotes and view reports, but cannot manage users
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-green-500" />
              <span className="font-medium">User:</span> Can create and edit their own quotes only
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showPermissionsDialog}
        onClose={() => setShowPermissionsDialog(false)}
        title={`Custom Permissions for ${selectedUser?.firstName} ${selectedUser?.lastName}`}
      >
        {selectedUser && (
          <>
            <div className="space-y-4 py-4">
              <p className="text-dark-text-secondary">
                Override default role permissions with custom settings
              </p>
              <div className="space-y-3">
                {[
                  { key: "canCreateQuotes", label: "Can Create Quotes" },
                  { key: "canEditQuotes", label: "Can Edit Quotes" },
                  { key: "canDeleteQuotes", label: "Can Delete Quotes" },
                  { key: "canViewAllQuotes", label: "Can View All Quotes" },
                  { key: "canManageUsers", label: "Can Manage Users" },
                  { key: "canViewReports", label: "Can View Reports" },
                  { key: "canManageSettings", label: "Can Manage Settings" },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between">
                    <Label htmlFor={key}>{label}</Label>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        id={key}
                        className="sr-only peer"
                        checked={selectedUser[key as keyof UserData] as boolean}
                        onChange={(e) => 
                          setSelectedUser({ ...selectedUser, [key]: e.target.checked })
                        }
                      />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-electric-magenta"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowPermissionsDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={updateUserPermissions}
                disabled={savingUserId === selectedUser?.id}
                variant="primary"
              >
                {savingUserId === selectedUser?.id && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Permissions
              </Button>
            </div>
          </>
        )}
      </Modal>
    </>
  );
}