import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

export default function TestAcceptInvitation() {
  const [urlInfo, setUrlInfo] = useState({
    href: '',
    hash: '',
    search: '',
    pathname: '',
  });

  useEffect(() => {
    setUrlInfo({
      href: window.location.href,
      hash: window.location.hash,
      search: window.location.search,
      pathname: window.location.pathname,
    });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-2xl w-full space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-green-600">✅ Accept Invitation Route Working!</CardTitle>
            <CardDescription>
              This page confirms that the /accept-invitation route is accessible and the SPA routing is working correctly.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">URL Information:</h3>
              <div className="bg-gray-100 p-3 rounded text-sm space-y-1">
                <div><strong>Full URL:</strong> {urlInfo.href}</div>
                <div><strong>Pathname:</strong> {urlInfo.pathname}</div>
                <div><strong>Search Params:</strong> {urlInfo.search || 'None'}</div>
                <div><strong>Hash Fragment:</strong> {urlInfo.hash || 'None'}</div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Magic Link Test:</h3>
              <div className="bg-blue-50 p-3 rounded text-sm">
                <p>To test the magic link flow:</p>
                <ol className="list-decimal list-inside space-y-1 mt-2">
                  <li>Create a tenant in the master dashboard</li>
                  <li>Check your email for the invitation</li>
                  <li>Click the magic link in the email</li>
                  <li>You should be redirected to this page with hash parameters</li>
                </ol>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Expected Magic Link Format:</h3>
              <div className="bg-gray-100 p-3 rounded text-sm font-mono">
                https://demo.alphabusinessdesigns.co.in/accept-invitation#access_token=...&refresh_token=...&type=invite
              </div>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-gray-600">
                <strong>Status:</strong> Route is working correctly. The AcceptInvitation component will handle the magic link authentication.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
