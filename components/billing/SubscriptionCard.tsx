'use client'

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useWorkspace } from '@/hooks/useWorkspace';
import { Loader2, CreditCard, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Subscription {
  id: string;
  plan_tier: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  calls_included: number;
  calls_used: number;
  overage_calls: number;
}

export function SubscriptionCard() {
  const { currentWorkspace } = useWorkspace();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!currentWorkspace) return;

    fetchSubscription();
  }, [currentWorkspace]);

  const fetchSubscription = async () => {
    if (!currentWorkspace) return;

    try {
      const response = await fetch(
        `/api/billing/subscription?workspace_id=${currentWorkspace.id}`
      );
      const data = await response.json();
      setSubscription(data.data);
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planTier: string) => {
    if (!currentWorkspace) return;

    try {
      const response = await fetch('/api/billing/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: currentWorkspace.id,
          plan_tier: planTier,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Subscription created',
          description: 'Redirecting to payment setup...',
        });
        // In production, redirect to Stripe Checkout or handle payment setup
        window.location.href = data.data.clientSecret || '/dashboard/settings';
      } else {
        throw new Error(data.error || 'Failed to create subscription');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
          <CardDescription>Choose a plan to get started</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['starter', 'pro', 'enterprise'].map((tier) => (
              <Card key={tier} className="border-border">
                <CardHeader>
                  <CardTitle className="text-lg capitalize">{tier}</CardTitle>
                  <CardDescription>
                    {tier === 'starter' && '$49/month'}
                    {tier === 'pro' && '$149/month'}
                    {tier === 'enterprise' && '$399/month'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => handleUpgrade(tier)}
                    className="w-full"
                    variant={tier === 'pro' ? 'default' : 'outline'}
                  >
                    Get Started
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const planNames: Record<string, string> = {
    starter: 'Starter',
    pro: 'Pro',
    enterprise: 'Enterprise',
  };

  const statusColors: Record<string, string> = {
    active: 'bg-success',
    trialing: 'bg-blue-500',
    past_due: 'bg-destructive',
    canceled: 'bg-muted',
  };

  const isUnlimited = subscription.calls_included === -1;
  const usagePercent = isUnlimited
    ? 0
    : (subscription.calls_used / subscription.calls_included) * 100;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Subscription</CardTitle>
            <CardDescription>
              {planNames[subscription.plan_tier] || subscription.plan_tier} Plan
            </CardDescription>
          </div>
          <Badge className={statusColors[subscription.status] || 'bg-muted'}>
            {subscription.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Usage this period</span>
            <span className="text-sm font-medium">
              {isUnlimited
                ? `${subscription.calls_used.toLocaleString()} calls`
                : `${subscription.calls_used.toLocaleString()} / ${subscription.calls_included.toLocaleString()} calls`}
            </span>
          </div>
          {!isUnlimited && (
            <div className="h-2 rounded-full bg-muted">
              <div
                className="h-2 rounded-full bg-foreground transition-all"
                style={{ width: `${Math.min(usagePercent, 100)}%` }}
              />
            </div>
          )}
        </div>

        {subscription.overage_calls > 0 && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive">
              {subscription.overage_calls} overage call{subscription.overage_calls !== 1 ? 's' : ''} this period
            </p>
          </div>
        )}

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CreditCard className="h-4 w-4" />
          <span>
            Renews on {new Date(subscription.current_period_end).toLocaleDateString()}
          </span>
        </div>

        <Button variant="outline" className="w-full">
          Manage Subscription
        </Button>
      </CardContent>
    </Card>
  );
}

