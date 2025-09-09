import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ReviewLimitService } from '@/services/reviewLimitService';
import { useToast } from '@/hooks/use-toast';
import { 
  Crown, 
  Zap, 
  Building2, 
  Star, 
  CheckCircle, 
  ArrowRight,
  AlertTriangle,
  TrendingUp
} from 'lucide-react';

interface PlanUpgradePromptProps {
  tenantId: string;
  onUpgrade?: () => void;
  className?: string;
}

interface UpgradeRecommendation {
  current_plan: string;
  recommended_plan: string;
  usage_percentage: number;
  upgrade_benefits: string[];
}

export default function PlanUpgradePrompt({ tenantId, onUpgrade, className }: PlanUpgradePromptProps) {
  const { toast } = useToast();
  const [recommendation, setRecommendation] = useState<UpgradeRecommendation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUpgradeRecommendation();
  }, [tenantId]);

  const loadUpgradeRecommendation = async () => {
    try {
      setLoading(true);
      const response = await ReviewLimitService.getUpgradeRecommendation(tenantId);
      
      if (response.success && response.data) {
        setRecommendation(response.data);
      }
    } catch (error) {
      console.error('Error loading upgrade recommendation:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPlanIcon = (planType: string) => {
    switch (planType) {
      case 'basic':
        return <Star className="w-5 h-5 text-blue-500" />;
      case 'pro':
        return <Zap className="w-5 h-5 text-purple-500" />;
      case 'industry':
        return <Building2 className="w-5 h-5 text-orange-500" />;
      default:
        return <Star className="w-5 h-5 text-gray-500" />;
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

  const getPlanLimits = (planType: string) => {
    switch (planType) {
      case 'basic':
        return { reviews: 100, price: '$29' };
      case 'pro':
        return { reviews: 500, price: '$79' };
      case 'industry':
        return { reviews: 1000, price: '$199' };
      default:
        return { reviews: 100, price: '$29' };
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!recommendation || recommendation.recommended_plan === recommendation.current_plan) {
    return null;
  }

  const currentLimits = getPlanLimits(recommendation.current_plan);
  const recommendedLimits = getPlanLimits(recommendation.recommended_plan);

  return (
    <Card className={`border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50 ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Crown className="w-5 h-5 text-purple-600" />
          Upgrade Recommended
        </CardTitle>
        <CardDescription>
          You're using {recommendation.usage_percentage}% of your {recommendation.current_plan} plan. 
          Upgrade to {recommendation.recommended_plan} for more capacity.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current vs Recommended Plan Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Current Plan */}
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              {getPlanIcon(recommendation.current_plan)}
              <span className="font-medium capitalize">{recommendation.current_plan} Plan</span>
              <Badge variant="outline" className="text-xs">Current</Badge>
            </div>
            <div className="text-2xl font-bold text-gray-900">{currentLimits.reviews}</div>
            <div className="text-sm text-gray-500">reviews per month</div>
            <div className="text-lg font-semibold text-gray-700">{currentLimits.price}/month</div>
          </div>

          {/* Recommended Plan */}
          <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              {getPlanIcon(recommendation.recommended_plan)}
              <span className="font-medium capitalize">{recommendation.recommended_plan} Plan</span>
              <Badge className="bg-purple-600 text-white text-xs">Recommended</Badge>
            </div>
            <div className="text-2xl font-bold text-purple-900">{recommendedLimits.reviews}</div>
            <div className="text-sm text-purple-600">reviews per month</div>
            <div className="text-lg font-semibold text-purple-700">{recommendedLimits.price}/month</div>
          </div>
        </div>

        {/* Upgrade Benefits */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-500" />
            Upgrade Benefits
          </h4>
          <ul className="space-y-2">
            {recommendation.upgrade_benefits.map((benefit, index) => (
              <li key={index} className="flex items-center gap-2 text-sm text-gray-700">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                {benefit}
              </li>
            ))}
          </ul>
        </div>

        {/* Usage Warning */}
        {recommendation.usage_percentage >= 90 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-medium">Critical Usage Level</div>
              <div className="text-sm">
                You're at {recommendation.usage_percentage}% capacity. Review collection will be disabled 
                when you reach 100%. Upgrade now to avoid interruption.
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            onClick={onUpgrade}
            className="bg-purple-600 hover:bg-purple-700 flex-1"
          >
            <Crown className="w-4 h-4 mr-2" />
            Upgrade to {recommendation.recommended_plan.charAt(0).toUpperCase() + recommendation.recommended_plan.slice(1)}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          <Button 
            variant="outline" 
            onClick={() => window.open('/pricing', '_blank')}
            className="flex-1"
          >
            View All Plans
          </Button>
        </div>

        {/* Additional Info */}
        <div className="text-xs text-gray-500 space-y-1">
          <div>• Upgrade takes effect immediately</div>
          <div>• No setup fees or long-term contracts</div>
          <div>• Cancel or change plans anytime</div>
        </div>
      </CardContent>
    </Card>
  );
}
