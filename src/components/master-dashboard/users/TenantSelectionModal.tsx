import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Building2, Users, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/LoadingSpinner";

interface Tenant {
  id: string;
  name: string;
  status: string;
  user_count?: number;
  created_at: string;
}

interface TenantSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (tenantId: string | null, role: 'tenant_admin' | 'user') => void;
  currentTenantId?: string | null;
  currentRole?: string;
  userId: string;
  userEmail: string;
}

export default function TenantSelectionModal({
  isOpen,
  onClose,
  onSelect,
  currentTenantId,
  currentRole,
  userId,
  userEmail
}: TenantSelectionModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(currentTenantId || null);
  const [selectedRole, setSelectedRole] = useState<'tenant_admin' | 'user'>(
    currentRole === 'tenant_admin' ? 'tenant_admin' : 'user'
  );

  // Fetch tenants
  const { data: tenants, isLoading } = useQuery({
    queryKey: ['tenants-for-selection'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenants')
        .select(`
          id,
          name,
          status,
          created_at
        `)
        .eq('status', 'active')
        .order('name');

      if (error) throw error;

      // Get user count for each tenant
      const tenantsWithCounts = await Promise.all(
        data.map(async (tenant) => {
          const { count } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', tenant.id);

          return {
            ...tenant,
            user_count: count || 0
          };
        })
      );

      return tenantsWithCounts;
    },
    enabled: isOpen
  });

  // Filter tenants based on search
  const filteredTenants = tenants?.filter(tenant =>
    tenant.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleSelect = () => {
    onSelect(selectedTenantId, selectedRole);
    onClose();
  };

  const handleRemoveFromTenant = () => {
    onSelect(null, 'user');
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      setSelectedTenantId(currentTenantId || null);
      setSelectedRole(currentRole === 'tenant_admin' ? 'tenant_admin' : 'user');
    }
  }, [isOpen, currentTenantId, currentRole]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Assign User to Tenant</DialogTitle>
          <DialogDescription>
            Move <strong>{userEmail}</strong> to a different tenant or remove them from their current tenant.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Search */}
          <div className="space-y-2">
            <Label htmlFor="search">Search Tenants</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Search by tenant name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {/* Tenant Selection */}
          <div className="space-y-2">
            <Label>Select Tenant</Label>
            {isLoading ? (
              <div className="flex justify-center py-4">
                <LoadingSpinner size="sm" />
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto space-y-2 border rounded-md p-2">
                {/* No Tenant Option */}
                <div
                  className={`flex items-center justify-between p-3 rounded-md cursor-pointer transition-colors ${
                    selectedTenantId === null
                      ? 'bg-primary/10 border border-primary'
                      : 'hover:bg-muted'
                  }`}
                  onClick={() => setSelectedTenantId(null)}
                >
                  <div className="flex items-center space-x-3">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">No Tenant</p>
                      <p className="text-sm text-muted-foreground">
                        Remove user from all tenants
                      </p>
                    </div>
                  </div>
                  {selectedTenantId === null && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </div>

                {/* Tenant Options */}
                {filteredTenants.map((tenant) => (
                  <div
                    key={tenant.id}
                    className={`flex items-center justify-between p-3 rounded-md cursor-pointer transition-colors ${
                      selectedTenantId === tenant.id
                        ? 'bg-primary/10 border border-primary'
                        : 'hover:bg-muted'
                    }`}
                    onClick={() => setSelectedTenantId(tenant.id)}
                  >
                    <div className="flex items-center space-x-3">
                      <Building2 className="h-4 w-4 text-blue-600" />
                      <div>
                        <p className="font-medium">{tenant.name}</p>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <Users className="h-3 w-3" />
                          <span>{tenant.user_count} users</span>
                          <span>•</span>
                          <Badge variant="outline" className="text-xs">
                            {tenant.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    {selectedTenantId === tenant.id && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </div>
                ))}

                {filteredTenants.length === 0 && searchTerm && (
                  <div className="text-center py-4 text-muted-foreground">
                    No tenants found matching "{searchTerm}"
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Role Selection */}
          {selectedTenantId && (
            <div className="space-y-2">
              <Label htmlFor="role">Role in Tenant</Label>
              <Select value={selectedRole} onValueChange={(value: 'tenant_admin' | 'user') => setSelectedRole(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">
                    <div className="flex items-center space-x-2">
                      <span>User</span>
                      <Badge variant="outline" className="text-xs">Regular user</Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="tenant_admin">
                    <div className="flex items-center space-x-2">
                      <span>Tenant Admin</span>
                      <Badge variant="secondary" className="text-xs">Can manage tenant</Badge>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Current Assignment Info */}
          {currentTenantId && (
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm font-medium">Current Assignment:</p>
              <p className="text-sm text-muted-foreground">
                Currently assigned to a tenant as <strong>{currentRole}</strong>
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between">
          <div className="flex space-x-2">
            {currentTenantId && (
              <Button
                variant="outline"
                onClick={handleRemoveFromTenant}
                className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
              >
                Remove from Tenant
              </Button>
            )}
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSelect}>
              {selectedTenantId ? 'Assign to Tenant' : 'Remove from Tenant'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
