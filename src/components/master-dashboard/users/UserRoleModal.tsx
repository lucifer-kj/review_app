import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Crown, Shield, User, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface UserRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (newRole: 'super_admin' | 'tenant_admin' | 'user') => void;
  currentRole: string;
  userEmail: string;
  userId: string;
}

export default function UserRoleModal({
  isOpen,
  onClose,
  onConfirm,
  currentRole,
  userEmail,
  userId
}: UserRoleModalProps) {
  const [selectedRole, setSelectedRole] = useState<'super_admin' | 'tenant_admin' | 'user'>(
    currentRole as 'super_admin' | 'tenant_admin' | 'user'
  );

  useEffect(() => {
    if (isOpen) {
      setSelectedRole(currentRole as 'super_admin' | 'tenant_admin' | 'user');
    }
  }, [isOpen, currentRole]);

  const handleConfirm = () => {
    onConfirm(selectedRole);
    onClose();
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'tenant_admin':
        return <Shield className="h-4 w-4 text-blue-500" />;
      default:
        return <User className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'Full platform access, can manage all tenants and users';
      case 'tenant_admin':
        return 'Can manage users and settings within their assigned tenant';
      case 'user':
        return 'Regular user with access to tenant features only';
      default:
        return '';
    }
  };

  const isRoleChange = selectedRole !== currentRole;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Change User Role</DialogTitle>
          <DialogDescription>
            Update the role for <strong>{userEmail}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Role Display */}
          <div className="space-y-2">
            <Label>Current Role</Label>
            <div className="flex items-center space-x-2 p-3 bg-muted rounded-md">
              {getRoleIcon(currentRole)}
              <div>
                <p className="font-medium capitalize">{currentRole.replace('_', ' ')}</p>
                <p className="text-sm text-muted-foreground">
                  {getRoleDescription(currentRole)}
                </p>
              </div>
            </div>
          </div>

          {/* New Role Selection */}
          <div className="space-y-2">
            <Label htmlFor="role">New Role</Label>
            <Select value={selectedRole} onValueChange={(value: 'super_admin' | 'tenant_admin' | 'user') => setSelectedRole(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <div>
                      <span>User</span>
                      <p className="text-xs text-muted-foreground">Regular user access</p>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="tenant_admin">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-blue-500" />
                    <div>
                      <span>Tenant Admin</span>
                      <p className="text-xs text-muted-foreground">Manage tenant users</p>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="super_admin">
                  <div className="flex items-center space-x-2">
                    <Crown className="h-4 w-4 text-yellow-500" />
                    <div>
                      <span>Super Admin</span>
                      <p className="text-xs text-muted-foreground">Full platform access</p>
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Role Change Warning */}
          {isRoleChange && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">Role Change Warning</p>
                  <p className="text-sm text-amber-700">
                    Changing from <strong>{currentRole.replace('_', ' ')}</strong> to <strong>{selectedRole.replace('_', ' ')}</strong> will immediately affect this user's permissions.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* New Role Description */}
          {isRoleChange && (
            <div className="space-y-2">
              <Label>New Role Permissions</Label>
              <div className="flex items-start space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                {getRoleIcon(selectedRole)}
                <div>
                  <p className="font-medium capitalize">{selectedRole.replace('_', ' ')}</p>
                  <p className="text-sm text-muted-foreground">
                    {getRoleDescription(selectedRole)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={!isRoleChange}
            className={selectedRole === 'super_admin' ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
          >
            {isRoleChange ? 'Update Role' : 'No Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
