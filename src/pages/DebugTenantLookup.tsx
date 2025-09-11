import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TestTube, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface TenantDebugInfo {
  tenant_exists: boolean;
  tenant_status: string;
  tenant_name: string;
  business_settings_exist: boolean;
  business_name: string;
}

export default function DebugTenantLookup() {
  const [tenantId, setTenantId] = useState('9509987d-21e5-4205-87c1-021560ba6581');
  const [debugInfo, setDebugInfo] = useState<TenantDebugInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runDebug = async () => {
    setIsLoading(true);
    setError(null);
    setDebugInfo(null);

    try {
      // First, try the debug function if it exists
      const { data: debugData, error: debugError } = await supabase
        .rpc('debug_tenant_lookup', { p_tenant_id: tenantId });

      if (debugError) {
        console.log('Debug function not available, trying direct queries...');
        
        // Fallback: direct queries
        const [tenantResult, businessResult] = await Promise.all([
          supabase
            .from('tenants')
            .select('id, name, status')
            .eq('id', tenantId)
            .single(),
          supabase
            .from('business_settings')
            .select('business_name')
            .eq('tenant_id', tenantId)
            .single()
        ]);

        const tenant = tenantResult.data;
        const business = businessResult.data;

        setDebugInfo({
          tenant_exists: !!tenant,
          tenant_status: tenant?.status || 'NOT_FOUND',
          tenant_name: tenant?.name || 'NOT_FOUND',
          business_settings_exist: !!business,
          business_name: business?.business_name || 'NOT_SET'
        });
      } else {
        setDebugInfo(debugData[0]);
      }
    } catch (err: any) {
      console.error('Debug error:', err);
      setError(err.message || 'Failed to debug tenant lookup');
    } finally {
      setIsLoading(false);
    }
  };

  const testTenantLookup = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .rpc('get_tenant_for_public_review', { p_tenant_id: tenantId });

      if (error) {
        console.error('Tenant lookup error:', error);
        setError(`Tenant lookup failed: ${error.message}`);
      } else if (data && data.length > 0) {
        console.log('Tenant lookup success:', data[0]);
        setError(null);
      } else {
        setError('No tenant data returned');
      }
    } catch (err: any) {
      console.error('Tenant lookup error:', err);
      setError(err.message || 'Failed to lookup tenant');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <TestTube className="h-8 w-8 mr-3 text-blue-600" />
              <div>
                <CardTitle className="text-3xl font-bold text-blue-600">
                  Debug Tenant Lookup
                </CardTitle>
                <p className="text-sm text-gray-500">Debug tenant lookup issues for public review forms</p>
              </div>
            </div>
            <CardDescription className="text-lg">
              Test tenant lookup and business settings for the public review system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="tenantId">Tenant ID</Label>
              <Input
                id="tenantId"
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
                placeholder="Enter tenant ID"
                className="font-mono"
              />
            </div>

            <div className="flex space-x-4">
              <Button onClick={runDebug} disabled={isLoading} className="flex-1">
                {isLoading ? 'Running Debug...' : 'Run Debug Check'}
              </Button>
              <Button onClick={testTenantLookup} disabled={isLoading} variant="outline">
                Test Tenant Lookup
              </Button>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {debugInfo && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TestTube className="h-5 w-5 mr-2" />
                    Debug Results
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Tenant Exists</Label>
                      <div className="flex items-center space-x-2">
                        {debugInfo.tenant_exists ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <Badge variant={debugInfo.tenant_exists ? 'default' : 'destructive'}>
                          {debugInfo.tenant_exists ? 'Yes' : 'No'}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Tenant Status</Label>
                      <Badge variant={debugInfo.tenant_status === 'active' ? 'default' : 'secondary'}>
                        {debugInfo.tenant_status}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <Label>Tenant Name</Label>
                      <p className="text-sm font-mono">{debugInfo.tenant_name}</p>
                    </div>

                    <div className="space-y-2">
                      <Label>Business Settings Exist</Label>
                      <div className="flex items-center space-x-2">
                        {debugInfo.business_settings_exist ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <Badge variant={debugInfo.business_settings_exist ? 'default' : 'destructive'}>
                          {debugInfo.business_settings_exist ? 'Yes' : 'No'}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Business Name</Label>
                      <p className="text-sm font-mono">{debugInfo.business_name}</p>
                    </div>
                  </div>

                  {!debugInfo.business_settings_exist && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Business settings are missing for this tenant. This is likely why the public review form is failing.
                        You need to create business settings for this tenant.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}

            <div className="pt-4 border-t">
              <h3 className="font-semibold mb-2">SQL to Run in Supabase:</h3>
              <div className="bg-gray-100 p-4 rounded-lg">
                <pre className="text-sm overflow-x-auto">
{`-- Create business settings for the tenant
INSERT INTO public.business_settings (
  tenant_id,
  business_name,
  business_email,
  business_phone,
  business_address,
  google_business_url,
  form_customization,
  created_at,
  updated_at
) VALUES (
  '${tenantId}',
  'Quality & Care Building Inspection',
  'info@qualitycarebuilding.com',
  '+1-555-0123',
  '123 Inspection Street, Building City, BC 12345',
  'https://g.page/quality-care-building-inspection',
  '{
    "primary_color": "#3b82f6",
    "secondary_color": "#1e40af",
    "welcome_message": "Share your experience with Quality & Care Building Inspection",
    "thank_you_message": "Thank you for your feedback!",
    "required_fields": ["customer_name", "rating"],
    "optional_fields": ["customer_email", "customer_phone", "review_text"]
  }'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT (tenant_id) DO UPDATE SET
  business_name = EXCLUDED.business_name,
  business_email = EXCLUDED.business_email,
  business_phone = EXCLUDED.business_phone,
  business_address = EXCLUDED.business_address,
  google_business_url = EXCLUDED.google_business_url,
  form_customization = EXCLUDED.form_customization,
  updated_at = NOW();`}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
