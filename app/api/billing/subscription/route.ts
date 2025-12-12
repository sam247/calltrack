import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/integrations/supabase/server';
import { createSubscription, updateSubscription, cancelSubscription, resumeSubscription, type PlanTier } from '@/lib/stripe/subscriptions';

export const dynamic = 'force-dynamic';

/**
 * GET /api/billing/subscription
 * Get subscription for a workspace
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workspaceId = request.nextUrl.searchParams.get('workspace_id');
    if (!workspaceId) {
      return NextResponse.json({ error: 'workspace_id required' }, { status: 400 });
    }

    // Verify user has access to workspace
    const { data: member } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (!member) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('workspace_id', workspaceId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      throw error;
    }

    return NextResponse.json({ data: subscription || null });
  } catch (error: any) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch subscription' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/billing/subscription
 * Create a new subscription
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { workspace_id, plan_tier, trial_days } = body;

    if (!workspace_id || !plan_tier) {
      return NextResponse.json(
        { error: 'workspace_id and plan_tier required' },
        { status: 400 }
      );
    }

    // Verify user has access to workspace
    const { data: member } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspace_id)
      .eq('user_id', user.id)
      .single();

    const memberData = member as { role: string } | null;
    if (!memberData || memberData.role !== 'owner') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get user email
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', user.id)
      .single();

    const profileData = profile as { email?: string; full_name?: string } | null;

    // Create subscription
    const result = await createSubscription({
      workspaceId: workspace_id,
      customerEmail: profileData?.email || user.email || '',
      customerName: profileData?.full_name || undefined,
      planTier: plan_tier as PlanTier,
      trialDays: trial_days || 14,
    });

    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating subscription:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create subscription' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/billing/subscription
 * Update subscription (change plan, cancel, resume)
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { workspace_id, action, plan_tier } = body;

    if (!workspace_id || !action) {
      return NextResponse.json(
        { error: 'workspace_id and action required' },
        { status: 400 }
      );
    }

    // Verify user has access to workspace
    const { data: member } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspace_id)
      .eq('user_id', user.id)
      .single();

    const memberData = member as { role: string } | null;
    if (!memberData || memberData.role !== 'owner') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('stripe_subscription_id')
      .eq('workspace_id', workspace_id)
      .single();

    const subscriptionData = subscription as { stripe_subscription_id: string } | null;
    if (!subscriptionData) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    // Handle different actions
    switch (action) {
      case 'update_plan':
        if (!plan_tier) {
          return NextResponse.json(
            { error: 'plan_tier required for update_plan action' },
            { status: 400 }
          );
        }
        await updateSubscription(subscriptionData.stripe_subscription_id, plan_tier as PlanTier);
        break;

      case 'cancel':
        await cancelSubscription(subscriptionData.stripe_subscription_id, false);
        break;

      case 'cancel_immediately':
        await cancelSubscription(subscriptionData.stripe_subscription_id, true);
        break;

      case 'resume':
        await resumeSubscription(subscriptionData.stripe_subscription_id);
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating subscription:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update subscription' },
      { status: 500 }
    );
  }
}

