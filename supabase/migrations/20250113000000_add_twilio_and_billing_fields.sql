-- Add Twilio fields to tracking_numbers
ALTER TABLE public.tracking_numbers
ADD COLUMN IF NOT EXISTS twilio_number_sid TEXT,
ADD COLUMN IF NOT EXISTS forwarding_number TEXT;

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  plan_tier TEXT NOT NULL DEFAULT 'starter', -- 'starter', 'pro', 'enterprise'
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'canceled', 'past_due', 'trialing'
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  calls_included INTEGER NOT NULL DEFAULT 500,
  calls_used INTEGER NOT NULL DEFAULT 0,
  overage_calls INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (workspace_id)
);

-- Create billing_events table for audit trail
CREATE TABLE IF NOT EXISTS public.billing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'subscription_created', 'subscription_updated', 'payment_succeeded', 'payment_failed', etc.
  stripe_event_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enhance call_logs with attribution fields
ALTER TABLE public.call_logs
ADD COLUMN IF NOT EXISTS utm_source TEXT,
ADD COLUMN IF NOT EXISTS utm_medium TEXT,
ADD COLUMN IF NOT EXISTS utm_campaign TEXT,
ADD COLUMN IF NOT EXISTS utm_term TEXT,
ADD COLUMN IF NOT EXISTS utm_content TEXT,
ADD COLUMN IF NOT EXISTS first_touch_source TEXT,
ADD COLUMN IF NOT EXISTS first_touch_medium TEXT,
ADD COLUMN IF NOT EXISTS first_touch_campaign TEXT,
ADD COLUMN IF NOT EXISTS session_id TEXT,
ADD COLUMN IF NOT EXISTS visitor_id TEXT,
ADD COLUMN IF NOT EXISTS attribution_path JSONB;

-- Create call_events table for granular call event tracking
CREATE TABLE IF NOT EXISTS public.call_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_log_id UUID REFERENCES public.call_logs(id) ON DELETE CASCADE NOT NULL,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL, -- 'initiated', 'ringing', 'answered', 'completed', 'failed', etc.
  twilio_call_sid TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create attribution_paths table for multi-touch attribution
CREATE TABLE IF NOT EXISTS public.attribution_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id TEXT NOT NULL,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  touchpoints JSONB NOT NULL DEFAULT '[]',
  first_touch JSONB,
  last_touch JSONB,
  conversion_touch JSONB,
  attribution_weights JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (visitor_id, workspace_id)
);

-- Enhance call_analytics_daily with ROI fields
ALTER TABLE public.call_analytics_daily
ADD COLUMN IF NOT EXISTS conversion_value NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS roi NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS cost_per_call NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS source_attribution JSONB DEFAULT '{}';

-- Enable RLS on new tables
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attribution_paths ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tracking_numbers_twilio_sid ON public.tracking_numbers(twilio_number_sid);
CREATE INDEX IF NOT EXISTS idx_subscriptions_workspace_id ON public.subscriptions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON public.subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_call_events_call_log_id ON public.call_events(call_log_id);
CREATE INDEX IF NOT EXISTS idx_call_events_workspace_id ON public.call_events(workspace_id);
CREATE INDEX IF NOT EXISTS idx_attribution_paths_visitor_id ON public.attribution_paths(visitor_id);
CREATE INDEX IF NOT EXISTS idx_attribution_paths_workspace_id ON public.attribution_paths(workspace_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_visitor_id ON public.call_logs(visitor_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_session_id ON public.call_logs(session_id);

