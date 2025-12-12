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
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('calls_included, calls_used, overage_calls, status')
    .eq('workspace_id', workspaceId)
    .single();

  if (!subscription) {
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
  if (subscription.status !== 'active' && subscription.status !== 'trialing') {
    return {
      allowed: false,
      callsUsed: subscription.calls_used || 0,
      callsIncluded: subscription.calls_included || 0,
      overageCalls: subscription.overage_calls || 0,
      isUnlimited: subscription.calls_included === -1,
    };
  }

  const callsIncluded = subscription.calls_included || 0;
  const callsUsed = subscription.calls_used || 0;
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
    overageCalls: subscription.overage_calls || 0,
    isUnlimited: false,
  };
}

/**
 * Increment call usage for a workspace
 */
export async function incrementCallUsage(workspaceId: string): Promise<void> {
  const supabase = await createClient();

  // Get subscription
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('calls_included, calls_used, overage_calls')
    .eq('workspace_id', workspaceId)
    .single();

  if (!subscription) {
    // No subscription - create trial usage tracking
    return;
  }

  const callsIncluded = subscription.calls_included || 0;
  const callsUsed = (subscription.calls_used || 0) + 1;
  const isUnlimited = callsIncluded === -1;

  if (isUnlimited) {
    // Just increment usage for tracking
    await supabase
      .from('subscriptions')
      .update({
        calls_used: callsUsed,
        updated_at: new Date().toISOString(),
      })
      .eq('workspace_id', workspaceId);
  } else {
    // Check if overage
    const overageCalls = callsUsed > callsIncluded ? (subscription.overage_calls || 0) + 1 : (subscription.overage_calls || 0);

    await supabase
      .from('subscriptions')
      .update({
        calls_used: callsUsed,
        overage_calls: overageCalls,
        updated_at: new Date().toISOString(),
      })
      .eq('workspace_id', workspaceId);
  }
}

