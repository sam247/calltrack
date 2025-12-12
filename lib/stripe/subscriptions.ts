import { stripe, PLAN_CONFIG, type PlanTier } from './client';

export interface CreateSubscriptionParams {
  workspaceId: string;
  customerEmail: string;
  customerName?: string;
  planTier: PlanTier;
  trialDays?: number;
}

export interface SubscriptionResult {
  subscriptionId: string;
  customerId: string;
  clientSecret?: string; // For payment setup
}

/**
 * Create a Stripe customer
 */
export async function createCustomer(
  email: string,
  name?: string,
  metadata?: Record<string, string>
): Promise<string> {
  const customer = await stripe.customers.create({
    email,
    name,
    metadata,
  });

  return customer.id;
}

/**
 * Create a subscription for a workspace
 */
export async function createSubscription(
  params: CreateSubscriptionParams
): Promise<SubscriptionResult> {
  const { workspaceId, customerEmail, customerName, planTier, trialDays = 14 } = params;

  const planConfig = PLAN_CONFIG[planTier];

  // Create or get customer
  let customerId: string;
  const existingCustomers = await stripe.customers.list({
    email: customerEmail,
    limit: 1,
  });

  if (existingCustomers.data.length > 0) {
    customerId = existingCustomers.data[0].id;
  } else {
    customerId = await createCustomer(customerEmail, customerName, {
      workspace_id: workspaceId,
    });
  }

  // Create Stripe product and price if they don't exist
  // In production, you'd want to create these in Stripe dashboard and reference them
  const productName = `CallTrack ${planConfig.name}`;
  
  // Check if product exists
  const products = await stripe.products.list({
    limit: 100,
  });
  
  let product = products.data.find(p => p.name === productName);
  
  if (!product) {
    product = await stripe.products.create({
      name: productName,
      description: `CallTrack ${planConfig.name} Plan`,
    });
  }

  // Check if price exists
  const prices = await stripe.prices.list({
    product: product.id,
    limit: 100,
  });
  
  let price = prices.data.find(p => p.unit_amount === planConfig.price && p.recurring?.interval === 'month');

  if (!price) {
    price = await stripe.prices.create({
      product: product.id,
      unit_amount: planConfig.price,
      currency: 'usd',
      recurring: {
        interval: 'month',
      },
    });
  }

  // Create subscription with trial
  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: price.id }],
    trial_period_days: trialDays,
    metadata: {
      workspace_id: workspaceId,
      plan_tier: planTier,
    },
  });

  return {
    subscriptionId: subscription.id,
    customerId,
  };
}

/**
 * Update subscription plan
 */
export async function updateSubscription(
  subscriptionId: string,
  newPlanTier: PlanTier
): Promise<void> {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const newPlanConfig = PLAN_CONFIG[newPlanTier];

  // Get new price
  const productName = `CallTrack ${newPlanConfig.name}`;
  const products = await stripe.products.list({ limit: 100 });
  const product = products.data.find(p => p.name === productName);

  if (!product) {
    throw new Error(`Product not found for plan ${newPlanTier}`);
  }

  const prices = await stripe.prices.list({
    product: product.id,
    limit: 100,
  });
  const price = prices.data.find(p => p.unit_amount === newPlanConfig.price && p.recurring?.interval === 'month');

  if (!price) {
    throw new Error(`Price not found for plan ${newPlanTier}`);
  }

  // Update subscription
  await stripe.subscriptions.update(subscriptionId, {
    items: [{
      id: subscription.items.data[0].id,
      price: price.id,
    }],
    metadata: {
      ...subscription.metadata,
      plan_tier: newPlanTier,
    },
  });
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(
  subscriptionId: string,
  immediately: boolean = false
): Promise<void> {
  if (immediately) {
    await stripe.subscriptions.cancel(subscriptionId);
  } else {
    // Cancel at period end
    await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });
  }
}

/**
 * Resume canceled subscription
 */
export async function resumeSubscription(subscriptionId: string): Promise<void> {
  await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  });
}

/**
 * Get subscription details
 */
export async function getSubscription(subscriptionId: string) {
  return await stripe.subscriptions.retrieve(subscriptionId);
}

/**
 * Get customer subscriptions
 */
export async function getCustomerSubscriptions(customerId: string) {
  return await stripe.subscriptions.list({
    customer: customerId,
    limit: 100,
  });
}

