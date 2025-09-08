import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabaseAdmin, withAdminAuth, isAdminClientConfigured } from '@/integrations/supabase/admin';
import { env } from '@/utils/env';

export default function AdminClientTest() {
  const [testResult, setTestResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testAdminClient = async () => {
    setLoading(true);
    setTestResult('');

    try {
      // Test 1: Check configuration
      const isConfigured = isAdminClientConfigured();
      setTestResult(prev => prev + `✅ Admin client configured: ${isConfigured}\n`);

      if (!isConfigured) {
        setTestResult(prev => prev + `❌ Service role key not configured\n`);
        setTestResult(prev => prev + `Current env: ${JSON.stringify({
          url: env.supabase.url,
          hasAnonKey: !!env.supabase.anonKey,
          hasServiceRoleKey: !!env.supabase.serviceRoleKey
        }, null, 2)}\n`);
        return;
      }

      // Test 2: Try to list users
      setTestResult(prev => prev + `🔄 Testing admin.listUsers()...\n`);
      
      const { data: authUsers, error: authError } = await withAdminAuth(async () => {
        return await supabaseAdmin.auth.admin.listUsers();
      });

      if (authError) {
        setTestResult(prev => prev + `❌ Auth users error: ${authError.message}\n`);
      } else {
        setTestResult(prev => prev + `✅ Found ${authUsers?.users?.length || 0} auth users\n`);
        if (authUsers?.users && authUsers.users.length > 0) {
          setTestResult(prev => prev + `First user: ${JSON.stringify({
            id: authUsers.users[0].id,
            email: authUsers.users[0].email,
            created_at: authUsers.users[0].created_at
          }, null, 2)}\n`);
        }
      }

      // Test 3: Try to query profiles table
      setTestResult(prev => prev + `🔄 Testing profiles table...\n`);
      
      const { data: profiles, error: profilesError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .limit(5);

      if (profilesError) {
        setTestResult(prev => prev + `❌ Profiles error: ${profilesError.message}\n`);
      } else {
        setTestResult(prev => prev + `✅ Found ${profiles?.length || 0} profiles\n`);
        if (profiles && profiles.length > 0) {
          setTestResult(prev => prev + `First profile: ${JSON.stringify(profiles[0], null, 2)}\n`);
        }
      }

      // Test 4: Try to query tenants table
      setTestResult(prev => prev + `🔄 Testing tenants table...\n`);
      
      const { data: tenants, error: tenantsError } = await supabaseAdmin
        .from('tenants')
        .select('*')
        .limit(5);

      if (tenantsError) {
        setTestResult(prev => prev + `❌ Tenants error: ${tenantsError.message}\n`);
      } else {
        setTestResult(prev => prev + `✅ Found ${tenants?.length || 0} tenants\n`);
      }

    } catch (error: any) {
      setTestResult(prev => prev + `❌ Unexpected error: ${error.message}\n`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>Admin Client Test</CardTitle>
        <CardDescription>
          Test the Supabase admin client configuration and permissions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={testAdminClient} disabled={loading}>
          {loading ? 'Testing...' : 'Run Admin Client Test'}
        </Button>

        {testResult && (
          <Alert>
            <AlertDescription>
              <pre className="whitespace-pre-wrap text-sm font-mono">
                {testResult}
              </pre>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
