import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/client';
import { handleStripeWebhook } from '@/lib/stripe/webhooks';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

/**
 * POST /api/stripe/webhook
 * Handle Stripe webhook events
 */
export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'No signature provided' },
      { status: 400 }
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set');
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  // Handle the event
  const result = await handleStripeWebhook(event);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error || 'Failed to process webhook' },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}

