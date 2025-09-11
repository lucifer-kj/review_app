import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function DebugTenantAccess() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const testTenantAccess = async () => {
      if (!tenantId) {
        setError('No tenantId provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Test 1: Check tenant exists
        const { data: tenantData, error: tenantError } = await supabase
          .from('tenants')
          .select('id, name, domain, status, created_at')
          .eq('id', tenantId)
          .single();

        // Test 2: Check business settings
        const { data: businessData, error: businessError } = await supabase
          .from('business_settings')
          .select('*')
          .eq('tenant_id', tenantId)
          .single();

        // Test 3: Check if user is authenticated
        const { data: { user } } = await supabase.auth.getUser();

        setDebugInfo({
          tenantId,
          tenantData,
          tenantError,
          businessData,
          businessError,
          user: user ? { id: user.id, email: user.email } : null,
          timestamp: new Date().toISOString()
        });

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    testTenantAccess();
  }, [tenantId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Testing tenant access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Debug Tenant Access</CardTitle>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="text-red-800 font-semibold">Error:</h3>
                <p className="text-red-600">{error}</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="text-green-800 font-semibold">Debug Information:</h3>
                  <pre className="text-sm text-green-700 overflow-auto">
                    {JSON.stringify(debugInfo, null, 2)}
                  </pre>
                </div>
                
                <div className="flex gap-4">
                  <Button 
                    onClick={() => window.location.href = `/review/${tenantId}`}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Test Review Form
                  </Button>
                  <Button 
                    onClick={() => window.location.href = '/'}
                    variant="outline"
                  >
                    Go Home
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
