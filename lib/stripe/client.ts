import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
});

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

