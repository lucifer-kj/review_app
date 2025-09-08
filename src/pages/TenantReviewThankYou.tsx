import { useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Star, ArrowLeft, Building2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { TenantService } from "@/services/tenantService";

export default function TenantReviewThankYou() {
  const [searchParams] = useSearchParams();
  const tenantId = searchParams.get('tenant');

  // Fetch tenant information
  const { data: tenant } = useQuery({
    queryKey: ['tenant', tenantId],
    queryFn: async () => {
      if (!tenantId) return null;
      const result = await TenantService.getTenantById(tenantId);
      if (!result.success) {
        return null;
      }
      return result.data!;
    },
    enabled: !!tenantId,
  });

  useEffect(() => {
    // Auto-redirect after 10 seconds
    const timer = setTimeout(() => {
      if (tenant?.domain) {
        window.location.href = `https://${tenant.domain}`;
      }
    }, 10000);

    return () => clearTimeout(timer);
  }, [tenant]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Thank You!
          </h2>
          <p className="mt-2 text-lg text-gray-600">
            Your review has been submitted successfully
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">Review Submitted</CardTitle>
            <CardDescription className="text-center">
              {tenant ? (
                <>Thank you for reviewing <strong>{tenant.name}</strong></>
              ) : (
                "Thank you for your review"
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="flex justify-center space-x-1 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="h-6 w-6 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-sm text-gray-600">
                Your feedback helps improve our service
              </p>
            </div>

            <div className="space-y-3">
              <Button asChild className="w-full">
                <Link to="/">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Return to Home
                </Link>
              </Button>

              {tenant?.domain && (
                <Button variant="outline" asChild className="w-full">
                  <a href={`https://${tenant.domain}`} target="_blank" rel="noopener noreferrer">
                    <Building2 className="mr-2 h-4 w-4" />
                    Visit {tenant.name} Website
                  </a>
                </Button>
              )}
            </div>

            {tenant?.domain && (
              <div className="text-center">
                <p className="text-xs text-gray-500">
                  You will be redirected to {tenant.name}'s website in 10 seconds
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
