import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Building2, 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Mail,
  Globe,
  Settings,
  User
} from 'lucide-react';
import { useCreateTenant } from '@/hooks/useSuperAdmin';
import type { CreateTenantData } from '@/types/tenant.types';

interface WizardStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const steps: WizardStep[] = [
  {
    id: 'basic-info',
    title: 'Basic Information',
    description: 'Enter tenant name and basic details',
    icon: Building2
  },
  {
    id: 'admin-setup',
    title: 'Admin Setup',
    description: 'Configure the tenant administrator',
    icon: User
  },
  {
    id: 'settings',
    title: 'Settings',
    description: 'Configure tenant settings and preferences',
    icon: Settings
  },
  {
    id: 'review',
    title: 'Review',
    description: 'Review and confirm tenant creation',
    icon: Check
  }
];

export function TenantCreateWizard() {
  const navigate = useNavigate();
  const createTenant = useCreateTenant();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<CreateTenantData & { adminEmail: string }>({
    name: '',
    domain: '',
    plan_type: 'basic',
    settings: {},
    billing_email: '',
    adminEmail: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 0: // Basic Info
        if (!formData.name.trim()) {
          newErrors.name = 'Tenant name is required';
        }
        if (formData.domain && !isValidDomain(formData.domain)) {
          newErrors.domain = 'Please enter a valid domain (e.g., example.com)';
        }
        break;
      case 1: // Admin Setup
        if (!formData.adminEmail.trim()) {
          newErrors.adminEmail = 'Admin email is required';
        } else if (!isValidEmail(formData.adminEmail)) {
          newErrors.adminEmail = 'Please enter a valid email address';
        }
        if (!formData.billing_email?.trim()) {
          newErrors.billing_email = 'Billing email is required';
        } else if (!isValidEmail(formData.billing_email)) {
          newErrors.billing_email = 'Please enter a valid billing email address';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const isValidDomain = (domain: string): boolean => {
    return /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/.test(domain);
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    try {
      const { adminEmail, ...tenantData } = formData;
      const result = await createTenant.mutateAsync({
        tenantData,
        adminEmail
      });

      if (result.success) {
        navigate(`/master/tenants/${result.data?.id}`);
      }
    } catch (error) {
      console.error('Failed to create tenant:', error);
    }
  };

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Basic Information
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Tenant Name *</Label>
              <Input
                id="name"
                placeholder="Acme Corporation"
                value={formData.name}
                onChange={(e) => updateFormData('name', e.target.value)}
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
            </div>

            <div>
              <Label htmlFor="domain">Domain (Optional)</Label>
              <Input
                id="domain"
                placeholder="acme.com"
                value={formData.domain}
                onChange={(e) => updateFormData('domain', e.target.value)}
                className={errors.domain ? 'border-destructive' : ''}
              />
              {errors.domain && <p className="text-sm text-destructive">{errors.domain}</p>}
              <p className="text-sm text-muted-foreground mt-1">
                Custom domain for the tenant (without https://)
              </p>
            </div>

            <div>
              <Label htmlFor="plan">Plan Type</Label>
              <Select value={formData.plan_type} onValueChange={(value: any) => updateFormData('plan_type', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Basic - $29/month</SelectItem>
                  <SelectItem value="pro">Pro - $99/month</SelectItem>
                  <SelectItem value="enterprise">Enterprise - Custom pricing</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground mt-1">
                Choose the appropriate plan for this tenant
              </p>
            </div>
          </div>
        );

      case 1: // Admin Setup
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="adminEmail">Admin Email Address *</Label>
              <Input
                id="adminEmail"
                type="email"
                placeholder="admin@acme.com"
                value={formData.adminEmail}
                onChange={(e) => updateFormData('adminEmail', e.target.value)}
                className={errors.adminEmail ? 'border-destructive' : ''}
              />
              {errors.adminEmail && <p className="text-sm text-destructive">{errors.adminEmail}</p>}
              <p className="text-sm text-muted-foreground mt-1">
                This user will be the tenant administrator
              </p>
            </div>

            <div>
              <Label htmlFor="billing_email">Billing Email Address *</Label>
              <Input
                id="billing_email"
                type="email"
                placeholder="billing@acme.com"
                value={formData.billing_email}
                onChange={(e) => updateFormData('billing_email', e.target.value)}
                className={errors.billing_email ? 'border-destructive' : ''}
              />
              {errors.billing_email && <p className="text-sm text-destructive">{errors.billing_email}</p>}
              <p className="text-sm text-muted-foreground mt-1">
                Email address for billing and account notifications
              </p>
            </div>
          </div>
        );

      case 2: // Settings
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="settings">Additional Settings (JSON)</Label>
              <Textarea
                id="settings"
                placeholder='{"feature_flags": {"advanced_analytics": true}, "limits": {"max_users": 50}}'
                value={JSON.stringify(formData.settings, null, 2)}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    updateFormData('settings', parsed);
                  } catch {
                    // Invalid JSON, keep as string for now
                  }
                }}
                rows={6}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Optional JSON configuration for tenant-specific settings
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox id="auto-activate" defaultChecked />
                <Label htmlFor="auto-activate">Auto-activate tenant</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="send-welcome" defaultChecked />
                <Label htmlFor="send-welcome">Send welcome email to admin</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="enable-analytics" defaultChecked />
                <Label htmlFor="enable-analytics">Enable analytics tracking</Label>
              </div>
            </div>
          </div>
        );

      case 3: // Review
        return (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Tenant Summary</CardTitle>
                <CardDescription>Review the tenant configuration before creating</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Name:</span>
                  <span className="text-sm">{formData.name}</span>
                </div>
                {formData.domain && (
                  <div className="flex items-center space-x-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Domain:</span>
                    <span className="text-sm">{formData.domain}</span>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">Plan:</span>
                  <span className="text-sm capitalize">{formData.plan_type}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Admin:</span>
                  <span className="text-sm">{formData.adminEmail}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Billing:</span>
                  <span className="text-sm">{formData.billing_email}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <a href="/master/tenants">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tenants
            </a>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create New Tenant</h1>
            <p className="text-muted-foreground">
              Set up a new tenant organization
            </p>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center space-x-2 ${
                  index <= currentStep ? 'text-primary' : 'text-muted-foreground'
                }`}>
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                    index < currentStep 
                      ? 'bg-primary text-primary-foreground' 
                      : index === currentStep 
                        ? 'bg-primary/10 text-primary border-2 border-primary' 
                        : 'bg-muted text-muted-foreground'
                  }`}>
                    {index < currentStep ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <step.icon className="h-4 w-4" />
                    )}
                  </div>
                  <div className="hidden sm:block">
                    <div className="text-sm font-medium">{step.title}</div>
                    <div className="text-xs text-muted-foreground">{step.description}</div>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden sm:block w-16 h-px bg-border mx-4" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            {React.createElement(steps[currentStep].icon, { className: "h-5 w-5" })}
            <span>{steps[currentStep].title}</span>
          </CardTitle>
          <CardDescription>
            {steps[currentStep].description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderStepContent()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 0}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        {currentStep === steps.length - 1 ? (
          <Button
            onClick={handleSubmit}
            disabled={createTenant.isPending}
          >
            {createTenant.isPending ? 'Creating...' : 'Create Tenant'}
          </Button>
        ) : (
          <Button onClick={handleNext}>
            Next
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}
