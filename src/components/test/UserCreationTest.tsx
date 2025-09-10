import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UserCreationService } from '@/services/userCreationService';
import { toast } from 'sonner';

export default function UserCreationTest() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    role: 'user' as 'user' | 'tenant_admin' | 'super_admin',
    tenantId: '',
  });
  const [isCreating, setIsCreating] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setResult(null);

    try {
      const response = await UserCreationService.createUserWithPassword(formData);
      setResult(response);
      
      if (response.success) {
        toast.success('User created successfully!');
      } else {
        toast.error(response.error || 'Failed to create user');
      }
    } catch (error) {
      setResult({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
      toast.error('Failed to create user');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>User Creation Test</CardTitle>
          <CardDescription>
            Test the user creation functionality with email and password
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="user@example.com"
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Password (min 6 chars)"
                  required
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                placeholder="John Doe"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="role">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: any) => setFormData(prev => ({ ...prev, role: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="tenant_admin">Tenant Admin</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="tenantId">Tenant ID (Optional)</Label>
                <Input
                  id="tenantId"
                  value={formData.tenantId}
                  onChange={(e) => setFormData(prev => ({ ...prev, tenantId: e.target.value }))}
                  placeholder="Leave empty for no tenant"
                />
              </div>
            </div>

            <Button type="submit" disabled={isCreating} className="w-full">
              {isCreating ? 'Creating User...' : 'Create User'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Result</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant={result.success ? 'default' : 'destructive'}>
              <AlertDescription>
                <pre className="whitespace-pre-wrap text-sm">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
