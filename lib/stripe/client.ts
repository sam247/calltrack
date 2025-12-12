import Stripe from 'stripe';

let stripeInstance: Stripe | null = null;

/**
 * Get Stripe client instance (lazy initialization)
 * This allows the build to complete even if STRIPE_SECRET_KEY is not set
 */
function getStripe(): Stripe {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set');
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-11-17.clover' as any,
      typescript: true,
    });
  }
  return stripeInstance;
}

// Lazy proxy that only initializes Stripe when actually used
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    const instance = getStripe();
    const value = instance[prop as keyof Stripe];
    // If it's a function, bind it to the instance
    if (typeof value === 'function') {
      return value.bind(instance);
    }
    return value;
  },
}) as Stripe;

export type PlanTier = 'starter' | 'pro' | 'enterprise';

export const PLAN_CONFIG = {
  starter: {
    name: 'Starter',
    price: 4900, // $49.00 in cents
    callsIncluded: 500,
    features: ['1 workspace', 'Basic analytics', '7-day data retention', 'Email support'],
  },
  pro: {
    name: 'Pro',
    price: 14900, // $149.00 in cents
    callsIncluded: 5000,
    features: ['5 workspaces', 'Advanced analytics', '90-day data retention', 'Priority support', 'Custom integrations', 'API access'],
  },
  enterprise: {
    name: 'Enterprise',
    price: 39900, // $399.00 in cents
    callsIncluded: -1, // Unlimited
    features: ['Unlimited workspaces', 'Custom analytics', 'Unlimited data retention', 'Dedicated support', 'White-label options', 'SLA guarantee'],
  },
} as const;

