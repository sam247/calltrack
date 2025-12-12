import { createClient } from '@/integrations/supabase/server';

export interface QuotaCheck {
  allowed: boolean;
  callsUsed: number;
  callsIncluded: number;
  overageCalls: number;
  isUnlimited: boolean;
}

/**
 * Check if workspace has quota remaining for calls
 */
export async function checkCallQuota(workspaceId: string): Promise<QuotaCheck> {
  const supabase = await createClient();

  // Get subscription
  const { data: subscription } = await (supabase
    .from('subscriptions' as any)
    .select('calls_included, calls_used, overage_calls, status')
    .eq('workspace_id', workspaceId)
    .single() as any);

  const subscriptionData = subscription as { status: string; calls_used: number; calls_included: number; overage_calls: number } | null;
  if (!subscriptionData) {
    // No subscription - allow calls but track for trial
    return {
      allowed: true,
      callsUsed: 0,
      callsIncluded: 0,
      overageCalls: 0,
      isUnlimited: false,
    };
  }

  // Check if subscription is active
  if (subscriptionData.status !== 'active' && subscriptionData.status !== 'trialing') {
    return {
      allowed: false,
      callsUsed: subscriptionData.calls_used || 0,
      callsIncluded: subscriptionData.calls_included || 0,
      overageCalls: subscriptionData.overage_calls || 0,
      isUnlimited: subscriptionData.calls_included === -1,
    };
  }

  const callsIncluded = subscriptionData.calls_included || 0;
  const callsUsed = subscriptionData.calls_used || 0;
  const isUnlimited = callsIncluded === -1;

  // Unlimited plan
  if (isUnlimited) {
    return {
      allowed: true,
      callsUsed,
      callsIncluded: -1,
      overageCalls: 0,
      isUnlimited: true,
    };
  }

  // Check if quota exceeded
  const allowed = callsUsed < callsIncluded;

  return {
    allowed,
    callsUsed,
    callsIncluded,
    overageCalls: subscriptionData.overage_calls || 0,
    isUnlimited: false,
  };
}

/**
 * Increment call usage for a workspace
 */
export async function incrementCallUsage(workspaceId: string): Promise<void> {
  const supabase = await createClient();

  // Get subscription
  const { data: subscription } = await (supabase
    .from('subscriptions' as any)
    .select('calls_included, calls_used, overage_calls')
    .eq('workspace_id', workspaceId)
    .single() as any);

  const subscriptionData = subscription as { calls_included: number; calls_used: number; overage_calls: number } | null;
  if (!subscriptionData) {
    // No subscription - create trial usage tracking
    return;
  }

  const callsIncluded = subscriptionData.calls_included || 0;
  const callsUsed = (subscriptionData.calls_used || 0) + 1;
  const isUnlimited = callsIncluded === -1;

  if (isUnlimited) {
    // Just increment usage for tracking
    const updateQuery = supabase.from('subscriptions' as any) as any;
    await updateQuery
      .update({
        calls_used: callsUsed,
        updated_at: new Date().toISOString(),
      } as any)
      .eq('workspace_id', workspaceId);
  } else {
    // Check if overage
    const overageCalls = callsUsed > callsIncluded ? (subscriptionData.overage_calls || 0) + 1 : (subscriptionData.overage_calls || 0);

    const updateQuery2 = supabase.from('subscriptions' as any) as any;
    await updateQuery2
      .update({
        calls_used: callsUsed,
        overage_calls: overageCalls,
        updated_at: new Date().toISOString(),
      } as any)
      .eq('workspace_id', workspaceId);
  }
}

