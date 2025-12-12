'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Phone, Plus, Trash2, Edit } from 'lucide-react';
import { useWorkspace } from '@/hooks/useWorkspace';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface TrackingNumber {
  id: string;
  phone_number: string;
  label: string | null;
  source: string | null;
  campaign: string | null;
  forwarding_number: string | null;
  is_active: boolean;
  created_at: string;
}

export default function TrackingNumbersPage() {
  const { currentWorkspace } = useWorkspace();
  const [trackingNumbers, setTrackingNumbers] = useState<TrackingNumber[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    phone_number: '',
    area_code: '',
    label: '',
    source: '',
    campaign: '',
    forwarding_number: '',
  });

  useEffect(() => {
    if (currentWorkspace) {
      fetchTrackingNumbers();
    }
  }, [currentWorkspace]);

  const fetchTrackingNumbers = async () => {
    if (!currentWorkspace) return;

    try {
      const response = await fetch(
        `/api/tracking-numbers?workspace_id=${currentWorkspace.id}`
      );
      const data = await response.json();
      setTrackingNumbers(data.data || []);
    } catch (error) {
      console.error('Error fetching tracking numbers:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch tracking numbers',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!currentWorkspace) return;

    if (!formData.phone_number && !formData.area_code) {
      toast({
        title: 'Error',
        description: 'Please provide either a phone number or area code',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch('/api/tracking-numbers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: currentWorkspace.id,
          phone_number: formData.phone_number || undefined,
          area_code: formData.area_code || undefined,
          label: formData.label || undefined,
          source: formData.source || undefined,
          campaign: formData.campaign || undefined,
          forwarding_number: formData.forwarding_number || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Tracking number created successfully',
        });
        setIsDialogOpen(false);
        setFormData({
          phone_number: '',
          area_code: '',
          label: '',
          source: '',
          campaign: '',
          forwarding_number: '',
        });
        fetchTrackingNumbers();
      } else {
        throw new Error(data.error || 'Failed to create tracking number');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tracking number?')) return;

    try {
      const response = await fetch(`/api/tracking-numbers?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Tracking number deleted successfully',
        });
        fetchTrackingNumbers();
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete tracking number');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold">Tracking Numbers</h1>
            <p className="text-muted-foreground">
              Manage phone numbers for call tracking
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Number
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Tracking Number</DialogTitle>
                <DialogDescription>
                  Purchase a new phone number or use an existing one
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="phone_number">Phone Number (optional)</Label>
                  <Input
                    id="phone_number"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    placeholder="+1234567890"
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Or specify an area code below
                  </p>
                </div>
                <div>
                  <Label htmlFor="area_code">Area Code (optional)</Label>
                  <Input
                    id="area_code"
                    value={formData.area_code}
                    onChange={(e) => setFormData({ ...formData, area_code: e.target.value })}
                    placeholder="415"
                    className="mt-1"
                    maxLength={3}
                  />
                </div>
                <div>
                  <Label htmlFor="label">Label</Label>
                  <Input
                    id="label"
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    placeholder="Google Ads Campaign"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="source">Source</Label>
                  <Input
                    id="source"
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    placeholder="google_ads"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="campaign">Campaign</Label>
                  <Input
                    id="campaign"
                    value={formData.campaign}
                    onChange={(e) => setFormData({ ...formData, campaign: e.target.value })}
                    placeholder="Summer Sale"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="forwarding_number">Forwarding Number</Label>
                  <Input
                    id="forwarding_number"
                    value={formData.forwarding_number}
                    onChange={(e) => setFormData({ ...formData, forwarding_number: e.target.value })}
                    placeholder="+1234567890"
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Where calls to this number should be forwarded
                  </p>
                </div>
                <Button onClick={handleCreate} className="w-full">
                  Create Tracking Number
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading tracking numbers...</p>
          </div>
        ) : trackingNumbers.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Phone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">No tracking numbers yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first tracking number to start tracking calls
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Number
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trackingNumbers.map((number) => (
              <Card key={number.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{number.phone_number}</CardTitle>
                    <Badge variant={number.is_active ? 'default' : 'secondary'}>
                      {number.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  {number.label && (
                    <CardDescription>{number.label}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-2">
                  {number.source && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Source: </span>
                      <span className="font-medium">{number.source}</span>
                    </div>
                  )}
                  {number.campaign && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Campaign: </span>
                      <span className="font-medium">{number.campaign}</span>
                    </div>
                  )}
                  {number.forwarding_number && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Forwards to: </span>
                      <span className="font-medium">{number.forwarding_number}</span>
                    </div>
                  )}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(number.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

