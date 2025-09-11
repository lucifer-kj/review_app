import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Copy, ExternalLink, Plus, Edit, Trash2, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ReviewLinkService, type ReviewLinkWithUrl, type CreateReviewLinkData } from '@/services/reviewLinkService';
import { useCurrentTenant } from '@/hooks/useCurrentTenant';
import { CopyLinkButton } from '@/components/CopyLinkButton';

export default function ReviewLinkManager() {
  const { tenant } = useCurrentTenant();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<ReviewLinkWithUrl | null>(null);

  // Fetch review links
  const { data: reviewLinks, isLoading, error } = useQuery({
    queryKey: ['review-links', tenant?.id],
    queryFn: () => ReviewLinkService.getTenantReviewLinks(tenant!.id),
    enabled: !!tenant?.id,
  });

  // Create review link mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateReviewLinkData) => ReviewLinkService.createReviewLink(data),
    onSuccess: (response) => {
      if (response.success) {
        toast({
          title: "Review Link Created",
          description: "Your review link has been created successfully!",
        });
        queryClient.invalidateQueries({ queryKey: ['review-links', tenant?.id] });
        setIsCreateDialogOpen(false);
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to create review link",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create review link",
        variant: "destructive",
      });
    },
  });

  // Update review link mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateReviewLinkData> }) => 
      ReviewLinkService.updateReviewLink(id, data),
    onSuccess: () => {
      toast({
        title: "Review Link Updated",
        description: "Your review link has been updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ['review-links', tenant?.id] });
      setEditingLink(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update review link",
        variant: "destructive",
      });
    },
  });

  // Deactivate review link mutation
  const deactivateMutation = useMutation({
    mutationFn: (id: string) => ReviewLinkService.deactivateReviewLink(id),
    onSuccess: () => {
      toast({
        title: "Review Link Deactivated",
        description: "The review link has been deactivated.",
      });
      queryClient.invalidateQueries({ queryKey: ['review-links', tenant?.id] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to deactivate review link",
        variant: "destructive",
      });
    },
  });

  const handleCreateLink = (data: CreateReviewLinkData) => {
    createMutation.mutate(data);
  };

  const handleUpdateLink = (id: string, data: Partial<CreateReviewLinkData>) => {
    updateMutation.mutate({ id, data });
  };

  const handleDeactivateLink = (id: string) => {
    deactivateMutation.mutate(id);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Review Links</CardTitle>
          <CardDescription>Manage your public review collection links</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading review links...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Review Links</CardTitle>
          <CardDescription>Manage your public review collection links</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600">Failed to load review links</p>
            <Button 
              onClick={() => queryClient.invalidateQueries({ queryKey: ['review-links', tenant?.id] })}
              variant="outline"
              className="mt-2"
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Review Links</CardTitle>
            <CardDescription>Manage your public review collection links</CardDescription>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Link
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Review Link</DialogTitle>
                <DialogDescription>
                  Create a new public review link for your business
                </DialogDescription>
              </DialogHeader>
              <CreateReviewLinkForm
                onSubmit={handleCreateLink}
                onCancel={() => setIsCreateDialogOpen(false)}
                isLoading={createMutation.isPending}
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {!reviewLinks?.data || reviewLinks.data.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No review links created yet</p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Review Link
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {reviewLinks.data.map((link) => (
              <ReviewLinkCard
                key={link.id}
                link={link}
                onEdit={setEditingLink}
                onDeactivate={handleDeactivateLink}
                onUpdate={handleUpdateLink}
              />
            ))}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={!!editingLink} onOpenChange={(open) => !open && setEditingLink(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Review Link</DialogTitle>
              <DialogDescription>
                Update your review link settings
              </DialogDescription>
            </DialogHeader>
            {editingLink && (
              <EditReviewLinkForm
                link={editingLink}
                onSubmit={(data) => handleUpdateLink(editingLink.id, data)}
                onCancel={() => setEditingLink(null)}
                isLoading={updateMutation.isPending}
              />
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

// Create Review Link Form Component
function CreateReviewLinkForm({ 
  onSubmit, 
  onCancel, 
  isLoading 
}: { 
  onSubmit: (data: CreateReviewLinkData) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const { tenant } = useCurrentTenant();
  const [formData, setFormData] = useState({
    business_name: '',
    business_email: '',
    business_phone: '',
    business_address: '',
    google_business_url: '',
    form_customization: {
      primary_color: '#3b82f6',
      secondary_color: '#1e40af',
      welcome_message: '',
    },
    email_template: {
      subject: 'Thank you for your review!',
      body: 'We appreciate your feedback.',
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant?.id) return;

    onSubmit({
      tenant_id: tenant.id,
      ...formData,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="business_name">Business Name *</Label>
          <Input
            id="business_name"
            value={formData.business_name}
            onChange={(e) => setFormData(prev => ({ ...prev, business_name: e.target.value }))}
            placeholder="Your business name"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="business_email">Business Email</Label>
          <Input
            id="business_email"
            type="email"
            value={formData.business_email}
            onChange={(e) => setFormData(prev => ({ ...prev, business_email: e.target.value }))}
            placeholder="contact@yourbusiness.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="business_phone">Business Phone</Label>
          <Input
            id="business_phone"
            value={formData.business_phone}
            onChange={(e) => setFormData(prev => ({ ...prev, business_phone: e.target.value }))}
            placeholder="+1-555-0123"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="google_business_url">Google Business URL</Label>
          <Input
            id="google_business_url"
            value={formData.google_business_url}
            onChange={(e) => setFormData(prev => ({ ...prev, google_business_url: e.target.value }))}
            placeholder="https://g.page/your-business"
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="business_address">Business Address</Label>
        <Textarea
          id="business_address"
          value={formData.business_address}
          onChange={(e) => setFormData(prev => ({ ...prev, business_address: e.target.value }))}
          placeholder="123 Main Street, City, State 12345"
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="welcome_message">Welcome Message</Label>
        <Input
          id="welcome_message"
          value={formData.form_customization.welcome_message}
          onChange={(e) => setFormData(prev => ({ 
            ...prev, 
            form_customization: { 
              ...prev.form_customization, 
              welcome_message: e.target.value 
            }
          }))}
          placeholder={`Share your experience with ${formData.business_name || 'our business'}`}
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Creating...' : 'Create Link'}
        </Button>
      </div>
    </form>
  );
}

// Review Link Card Component
function ReviewLinkCard({ 
  link, 
  onEdit, 
  onDeactivate, 
  onUpdate 
}: { 
  link: ReviewLinkWithUrl;
  onEdit: (link: ReviewLinkWithUrl) => void;
  onDeactivate: (id: string) => void;
  onUpdate: (id: string, data: Partial<CreateReviewLinkData>) => void;
}) {
  const fullUrl = ReviewLinkService.generateReviewUrl(link.link_code);

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">{link.business_name}</h3>
          <p className="text-sm text-gray-500">Code: {link.link_code}</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={link.is_active ? 'default' : 'secondary'}>
            {link.is_active ? 'Active' : 'Inactive'}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onUpdate(link.id, { is_active: !link.is_active })}
          >
            <Switch checked={link.is_active} />
          </Button>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Input
          value={fullUrl}
          readOnly
          className="flex-1 text-sm"
        />
        <CopyLinkButton url={fullUrl} />
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open(fullUrl, '_blank')}
        >
          <ExternalLink className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(link)}
        >
          <Edit className="h-4 w-4 mr-1" />
          Edit
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDeactivate(link.id)}
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Deactivate
        </Button>
      </div>
    </div>
  );
}

// Edit Review Link Form Component
function EditReviewLinkForm({ 
  link, 
  onSubmit, 
  onCancel, 
  isLoading 
}: { 
  link: ReviewLinkWithUrl;
  onSubmit: (data: Partial<CreateReviewLinkData>) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    business_name: link.business_name,
    business_email: link.business_email || '',
    business_phone: link.business_phone || '',
    business_address: link.business_address || '',
    google_business_url: link.google_business_url || '',
    form_customization: link.form_customization || {
      primary_color: '#3b82f6',
      secondary_color: '#1e40af',
      welcome_message: '',
    },
    email_template: link.email_template || {
      subject: 'Thank you for your review!',
      body: 'We appreciate your feedback.',
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="business_name">Business Name *</Label>
          <Input
            id="business_name"
            value={formData.business_name}
            onChange={(e) => setFormData(prev => ({ ...prev, business_name: e.target.value }))}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="business_email">Business Email</Label>
          <Input
            id="business_email"
            type="email"
            value={formData.business_email}
            onChange={(e) => setFormData(prev => ({ ...prev, business_email: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="business_phone">Business Phone</Label>
          <Input
            id="business_phone"
            value={formData.business_phone}
            onChange={(e) => setFormData(prev => ({ ...prev, business_phone: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="google_business_url">Google Business URL</Label>
          <Input
            id="google_business_url"
            value={formData.google_business_url}
            onChange={(e) => setFormData(prev => ({ ...prev, google_business_url: e.target.value }))}
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="business_address">Business Address</Label>
        <Textarea
          id="business_address"
          value={formData.business_address}
          onChange={(e) => setFormData(prev => ({ ...prev, business_address: e.target.value }))}
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="welcome_message">Welcome Message</Label>
        <Input
          id="welcome_message"
          value={formData.form_customization.welcome_message}
          onChange={(e) => setFormData(prev => ({ 
            ...prev, 
            form_customization: { 
              ...prev.form_customization, 
              welcome_message: e.target.value 
            }
          }))}
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Updating...' : 'Update Link'}
        </Button>
      </div>
    </form>
  );
}
