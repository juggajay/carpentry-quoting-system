"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, UserCog, Shield, User, Save } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  const { toast } = useToast();

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
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
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

      toast({
        title: "Success",
        description: "User role updated successfully",
      });
    } catch (error) {
      console.error("Failed to update user:", error);
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      });
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

      toast({
        title: "Success",
        description: `User ${isActive ? "activated" : "deactivated"} successfully`,
      });
    } catch (error) {
      console.error("Failed to update user:", error);
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive",
      });
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

      toast({
        title: "Success",
        description: "User permissions updated successfully",
      });
      setShowPermissionsDialog(false);
    } catch (error) {
      console.error("Failed to update permissions:", error);
      toast({
        title: "Error",
        description: "Failed to update permissions",
        variant: "destructive",
      });
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
        return "default";
      case "ADMIN":
        return "secondary";
      default:
        return "outline";
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
        <div className="rounded-md border border-dark-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-dark-text-secondary">User</TableHead>
                <TableHead className="text-dark-text-secondary">Role</TableHead>
                <TableHead className="text-dark-text-secondary">Status</TableHead>
                <TableHead className="text-dark-text-secondary">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium text-white">
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="text-sm text-dark-text-secondary">
                        {user.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.email === currentUser?.primaryEmailAddress?.emailAddress ? (
                      <Badge variant={getRoleBadgeVariant(user.role)} className="gap-1">
                        {getRoleIcon(user.role)}
                        {user.role} (You)
                      </Badge>
                    ) : (
                      <Select
                        value={user.role}
                        onValueChange={(value: UserRole) => updateUserRole(user.id, value)}
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
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={user.isActive}
                      onCheckedChange={(checked) => toggleUserStatus(user.id, checked)}
                      disabled={
                        savingUserId === user.id || 
                        user.email === currentUser?.primaryEmailAddress?.emailAddress
                      }
                    />
                  </TableCell>
                  <TableCell>
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
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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

      <Dialog open={showPermissionsDialog} onOpenChange={setShowPermissionsDialog}>
        <DialogContent className="bg-dark-elevated border-dark-border">
          <DialogHeader>
            <DialogTitle className="text-white">
              Custom Permissions for {selectedUser?.firstName} {selectedUser?.lastName}
            </DialogTitle>
            <DialogDescription className="text-dark-text-secondary">
              Override default role permissions with custom settings
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4 py-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="create-quotes">Can Create Quotes</Label>
                  <Switch
                    id="create-quotes"
                    checked={selectedUser.canCreateQuotes}
                    onCheckedChange={(checked) => 
                      setSelectedUser({ ...selectedUser, canCreateQuotes: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="edit-quotes">Can Edit Quotes</Label>
                  <Switch
                    id="edit-quotes"
                    checked={selectedUser.canEditQuotes}
                    onCheckedChange={(checked) => 
                      setSelectedUser({ ...selectedUser, canEditQuotes: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="delete-quotes">Can Delete Quotes</Label>
                  <Switch
                    id="delete-quotes"
                    checked={selectedUser.canDeleteQuotes}
                    onCheckedChange={(checked) => 
                      setSelectedUser({ ...selectedUser, canDeleteQuotes: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="view-all-quotes">Can View All Quotes</Label>
                  <Switch
                    id="view-all-quotes"
                    checked={selectedUser.canViewAllQuotes}
                    onCheckedChange={(checked) => 
                      setSelectedUser({ ...selectedUser, canViewAllQuotes: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="manage-users">Can Manage Users</Label>
                  <Switch
                    id="manage-users"
                    checked={selectedUser.canManageUsers}
                    onCheckedChange={(checked) => 
                      setSelectedUser({ ...selectedUser, canManageUsers: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="view-reports">Can View Reports</Label>
                  <Switch
                    id="view-reports"
                    checked={selectedUser.canViewReports}
                    onCheckedChange={(checked) => 
                      setSelectedUser({ ...selectedUser, canViewReports: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="manage-settings">Can Manage Settings</Label>
                  <Switch
                    id="manage-settings"
                    checked={selectedUser.canManageSettings}
                    onCheckedChange={(checked) => 
                      setSelectedUser({ ...selectedUser, canManageSettings: checked })
                    }
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPermissionsDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={updateUserPermissions}
              disabled={savingUserId === selectedUser?.id}
              className="bg-electric-magenta hover:bg-electric-magenta/90"
            >
              {savingUserId === selectedUser?.id && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Permissions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}