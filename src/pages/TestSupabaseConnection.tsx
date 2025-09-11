import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { env } from '@/utils/env';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function TestSupabaseConnection() {
  const [connectionStatus, setConnectionStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const testConnection = async () => {
      try {
        setLoading(true);
        
        // Test 1: Check environment configuration
        const envConfig = {
          supabaseUrl: env.supabase.url,
          supabaseAnonKey: env.supabase.anonKey ? '***' + env.supabase.anonKey.slice(-4) : 'Not set',
          frontendUrl: env.frontend.url,
          isConfigured: env.supabase.url !== 'https://placeholder.supabase.co'
        };

        // Test 2: Try to connect to Supabase
        const { data, error } = await supabase
          .from('tenants')
          .select('count')
          .limit(1);

        setConnectionStatus({
          envConfig,
          connectionTest: {
            success: !error,
            error: error?.message || null,
            data: data
          },
          timestamp: new Date().toISOString()
        });

      } catch (err) {
        setConnectionStatus({
          envConfig: {
            supabaseUrl: env.supabase.url,
            supabaseAnonKey: env.supabase.anonKey ? '***' + env.supabase.anonKey.slice(-4) : 'Not set',
            frontendUrl: env.frontend.url,
            isConfigured: env.supabase.url !== 'https://placeholder.supabase.co'
          },
          connectionTest: {
            success: false,
            error: err instanceof Error ? err.message : 'Unknown error',
            data: null
          },
          timestamp: new Date().toISOString()
        });
      } finally {
        setLoading(false);
      }
    };

    testConnection();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Testing Supabase connection...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Supabase Connection Test</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className={`border rounded-lg p-4 ${
                connectionStatus?.connectionTest?.success 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <h3 className={`font-semibold ${
                  connectionStatus?.connectionTest?.success 
                    ? 'text-green-800' 
                    : 'text-red-800'
                }`}>
                  Connection Status: {connectionStatus?.connectionTest?.success ? 'SUCCESS' : 'FAILED'}
                </h3>
                <pre className="text-sm overflow-auto mt-2">
                  {JSON.stringify(connectionStatus, null, 2)}
                </pre>
              </div>
              
              <div className="flex gap-4">
                <Button 
                  onClick={() => window.location.href = '/'}
                  variant="outline"
                >
                  Go Home
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
