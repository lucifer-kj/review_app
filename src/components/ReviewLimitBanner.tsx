import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ReviewLimitService, type ReviewLimits } from '@/services/reviewLimitService';
import { useToast } from '@/hooks/use-toast';
import { 
  AlertTriangle, 
  Crown, 
  Zap, 
  Building2, 
  TrendingUp,
  ExternalLink,
  Star
} from 'lucide-react';

interface ReviewLimitBannerProps {
  tenantId: string;
  onUpgrade?: () => void;
}

export default function ReviewLimitBanner({ tenantId, onUpgrade }: ReviewLimitBannerProps) {
  const { toast } = useToast();
  const [limits, setLimits] = useState<ReviewLimits | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgradeRecommendation, setUpgradeRecommendation] = useState<any>(null);

  useEffect(() => {
    loadReviewLimits();
  }, [tenantId]);

  const loadReviewLimits = async () => {
    try {
      setLoading(true);
      const response = await ReviewLimitService.getTenantReviewLimits(tenantId);
      
      if (response.success && response.data) {
        setLimits(response.data);
        
        // Load upgrade recommendation if near limit
        if (response.data.current_reviews / response.data.max_reviews >= 0.8) {
          const upgradeResponse = await ReviewLimitService.getUpgradeRecommendation(tenantId);
          if (upgradeResponse.success) {
            setUpgradeRecommendation(upgradeResponse.data);
          }
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to load review limits",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error loading review limits:', error);
      toast({
        title: "Error",
        description: "Failed to load review limits",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getPlanIcon = (planType: string) => {
    switch (planType) {
      case 'basic':
        return <Star className="w-4 h-4 text-blue-500" />;
      case 'pro':
        return <Zap className="w-4 h-4 text-purple-500" />;
      case 'industry':
        return <Building2 className="w-4 h-4 text-orange-500" />;
      default:
        return <Star className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPlanColor = (planType: string) => {
    switch (planType) {
      case 'basic':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pro':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'industry':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-2 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!limits) {
    return null;
  }

  const usagePercentage = (limits.current_reviews / limits.max_reviews) * 100;
  const isNearLimit = usagePercentage >= 75;
  const isAtLimit = limits.is_limit_reached;

  return (
    <div className="space-y-4">
      {/* Review Usage Card */}
      <Card className={isAtLimit ? 'border-red-200 bg-red-50' : isNearLimit ? 'border-yellow-200 bg-yellow-50' : ''}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              {getPlanIcon(limits.plan_type)}
              Review Usage
            </CardTitle>
            <Badge className={getPlanColor(limits.plan_type)}>
              {limits.plan_type.charAt(0).toUpperCase() + limits.plan_type.slice(1)} Plan
            </Badge>
          </div>
          <CardDescription>
            Track your review collection progress and plan limits
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Usage Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Reviews Collected</span>
              <span className={`font-medium ${getUsageColor(usagePercentage)}`}>
                {limits.current_reviews} / {limits.max_reviews}
              </span>
            </div>
            <Progress 
              value={usagePercentage} 
              className="h-2"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>{limits.remaining_reviews} remaining</span>
              <span>{Math.round(usagePercentage)}% used</span>
            </div>
          </div>

          {/* Status Messages */}
          {isAtLimit && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Review limit reached!</strong> You've collected {limits.max_reviews} reviews on your {limits.plan_type} plan. 
                Upgrade to continue collecting reviews.
              </AlertDescription>
            </Alert>
          )}

          {isNearLimit && !isAtLimit && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Approaching limit:</strong> You've used {Math.round(usagePercentage)}% of your review allowance. 
                Consider upgrading to avoid interruption.
              </AlertDescription>
            </Alert>
          )}

          {/* Action Status */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className={`p-3 rounded-lg ${limits.can_collect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="text-sm font-medium text-gray-700">Collect</div>
              <div className={`text-xs ${limits.can_collect ? 'text-green-600' : 'text-red-600'}`}>
                {limits.can_collect ? 'Enabled' : 'Disabled'}
              </div>
            </div>
            <div className={`p-3 rounded-lg ${limits.can_share ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="text-sm font-medium text-gray-700">Share</div>
              <div className={`text-xs ${limits.can_share ? 'text-green-600' : 'text-red-600'}`}>
                {limits.can_share ? 'Enabled' : 'Disabled'}
              </div>
            </div>
            <div className={`p-3 rounded-lg ${limits.can_send ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="text-sm font-medium text-gray-700">Send</div>
              <div className={`text-xs ${limits.can_send ? 'text-green-600' : 'text-red-600'}`}>
                {limits.can_send ? 'Enabled' : 'Disabled'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upgrade Recommendation */}
      {upgradeRecommendation && upgradeRecommendation.recommended_plan !== upgradeRecommendation.current_plan && (
        <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Crown className="w-5 h-5 text-purple-600" />
              Upgrade Recommended
            </CardTitle>
            <CardDescription>
              You're using {upgradeRecommendation.usage_percentage}% of your {upgradeRecommendation.current_plan} plan. 
              Upgrade to {upgradeRecommendation.recommended_plan} for more capacity.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Upgrade Benefits:</h4>
              <ul className="space-y-1">
                {upgradeRecommendation.upgrade_benefits.map((benefit: string, index: number) => (
                  <li key={index} className="flex items-center gap-2 text-sm text-gray-700">
                    <TrendingUp className="w-3 h-3 text-green-500" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={onUpgrade}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Crown className="w-4 h-4 mr-2" />
                Upgrade Plan
              </Button>
              <Button variant="outline" size="sm">
                <ExternalLink className="w-4 h-4 mr-2" />
                View Pricing
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
