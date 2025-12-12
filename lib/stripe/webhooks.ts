import { stripe } from './client';
import { createClient } from '@/integrations/supabase/server';
import Stripe from 'stripe';

/**
 * Handle Stripe webhook events
 */
export async function handleStripeWebhook(
  event: Stripe.Event
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionChange(supabase, subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(supabase, subscription);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentSucceeded(supabase, invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(supabase, invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error handling Stripe webhook:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Handle subscription created/updated
 */
async function handleSubscriptionChange(
  supabase: any,
  subscription: Stripe.Subscription
) {
  const workspaceId = subscription.metadata?.workspace_id;
  const planTier = subscription.metadata?.plan_tier || 'starter';

  if (!workspaceId) {
    throw new Error('workspace_id not found in subscription metadata');
  }

  const planConfig = {
    starter: { callsIncluded: 500 },
    pro: { callsIncluded: 5000 },
    enterprise: { callsIncluded: -1 },
  }[planTier as 'starter' | 'pro' | 'enterprise'] || { callsIncluded: 500 };

  // Check if subscription exists
  const { data: existing } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('stripe_subscription_id', subscription.id)
    .single();

  const subscriptionData = {
    workspace_id: workspaceId,
    stripe_subscription_id: subscription.id,
    stripe_customer_id: subscription.customer as string,
    plan_tier: planTier,
    status: subscription.status,
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    calls_included: planConfig.callsIncluded,
    updated_at: new Date().toISOString(),
  };

  if (existing) {
    // Update existing subscription
    await supabase
      .from('subscriptions')
      .update(subscriptionData)
      .eq('id', existing.id);
  } else {
    // Create new subscription
    await supabase.from('subscriptions').insert(subscriptionData);
  }

  // Log billing event
  await supabase.from('billing_events').insert({
    workspace_id: workspaceId,
    event_type: event.type,
    stripe_event_id: subscription.id,
    metadata: {
      plan_tier: planTier,
      status: subscription.status,
    },
  });
}

/**
 * Handle subscription deleted
 */
async function handleSubscriptionDeleted(
  supabase: any,
  subscription: Stripe.Subscription
) {
  const workspaceId = subscription.metadata?.workspace_id;

  if (!workspaceId) {
    throw new Error('workspace_id not found in subscription metadata');
  }

  // Update subscription status
  await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);

  // Log billing event
  await supabase.from('billing_events').insert({
    workspace_id: workspaceId,
    event_type: 'subscription_deleted',
    stripe_event_id: subscription.id,
    metadata: {},
  });
}

/**
 * Handle payment succeeded
 */
async function handlePaymentSucceeded(
  supabase: any,
  invoice: Stripe.Invoice
) {
  const subscriptionId = invoice.subscription as string;
  if (!subscriptionId) return;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const workspaceId = subscription.metadata?.workspace_id;

  if (!workspaceId) return;

  // Reset usage counters for new billing period
  await supabase
    .from('subscriptions')
    .update({
      calls_used: 0,
      overage_calls: 0,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscriptionId);

  // Log billing event
  await supabase.from('billing_events').insert({
    workspace_id: workspaceId,
    event_type: 'payment_succeeded',
    stripe_event_id: invoice.id,
    metadata: {
      amount: invoice.amount_paid,
      currency: invoice.currency,
    },
  });
}

/**
 * Handle payment failed
 */
async function handlePaymentFailed(
  supabase: any,
  invoice: Stripe.Invoice
) {
  const subscriptionId = invoice.subscription as string;
  if (!subscriptionId) return;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const workspaceId = subscription.metadata?.workspace_id;

  if (!workspaceId) return;

  // Update subscription status
  await supabase
    .from('subscriptions')
    .update({
      status: 'past_due',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscriptionId);

  // Log billing event
  await supabase.from('billing_events').insert({
    workspace_id: workspaceId,
    event_type: 'payment_failed',
    stripe_event_id: invoice.id,
    metadata: {
      amount: invoice.amount_due,
      currency: invoice.currency,
    },
  });
}

