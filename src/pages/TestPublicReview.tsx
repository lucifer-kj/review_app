import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ExternalLink, TestTube } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TestPublicReview() {
  const navigate = useNavigate();
  const [tenantId, setTenantId] = useState('36dcb9ba-9dec-4cb1-9465-a084e73329c4');

  const handleTestReview = () => {
    navigate(`/review/${tenantId}`);
  };

  const handleOpenInNewTab = () => {
    window.open(`/review/${tenantId}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <TestTube className="h-8 w-8 mr-3 text-blue-600" />
              <div>
                <CardTitle className="text-3xl font-bold text-blue-600">
                  Test Public Review Form
                </CardTitle>
                <p className="text-sm text-gray-500">Test the public review submission system</p>
              </div>
            </div>
            <CardDescription className="text-lg">
              Test the public review form with the demo tenant
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
              <p className="text-sm text-gray-500">
                Default: Demo tenant (36dcb9ba-9dec-4cb1-9465-a084e73329c4)
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">Test URL:</h3>
                <p className="text-sm font-mono text-blue-800 break-all">
                  {window.location.origin}/review/{tenantId}
                </p>
              </div>

              <div className="flex space-x-4">
                <Button onClick={handleTestReview} className="flex-1">
                  Test Review Form
                </Button>
                <Button onClick={handleOpenInNewTab} variant="outline">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open in New Tab
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold">What to test:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Form loads with tenant business information</li>
                <li>• Form validation works (name and rating required)</li>
                <li>• Review submission works (saves to database)</li>
                <li>• High ratings redirect to Google Reviews</li>
                <li>• Low ratings show thank you page</li>
                <li>• Form styling matches tenant customization</li>
              </ul>
            </div>

            <div className="pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => navigate('/')}
                className="w-full"
              >
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
