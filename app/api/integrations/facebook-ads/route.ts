import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/integrations/supabase/server';
import { trackFacebookAdsConversion } from '@/lib/integrations/facebook-ads';

export const dynamic = 'force-dynamic';

/**
 * POST /api/integrations/facebook-ads
 * Track a Facebook Ads conversion
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      workspace_id,
      call_log_id,
      fbp,
      fbc,
      conversion_value,
    } = body;

    if (!workspace_id || !call_log_id) {
      return NextResponse.json(
        { error: 'workspace_id and call_log_id required' },
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

    if (!member) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get workspace Facebook Ads config
    const config = {
      pixelId: process.env.FACEBOOK_PIXEL_ID || '',
      accessToken: process.env.FACEBOOK_ACCESS_TOKEN || '',
      testEventCode: process.env.FACEBOOK_TEST_EVENT_CODE,
    };

    // Get call log details
    const { data: callLog } = await supabase
      .from('call_logs')
      .select('*')
      .eq('id', call_log_id)
      .eq('workspace_id', workspace_id)
      .single();

    const callLogData = callLog as {
      call_started_at: string;
      landing_page: string | null;
      caller_number: string;
    } | null;

    if (!callLogData) {
      return NextResponse.json({ error: 'Call log not found' }, { status: 404 });
    }

    // Get client IP and user agent from request
    const clientIp = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     '0.0.0.0';
    const userAgent = request.headers.get('user-agent') || '';

    // Track conversion
    const result = await trackFacebookAdsConversion(config, {
      eventName: 'Lead', // or 'Purchase' for paid conversions
      eventTime: Math.floor(new Date(callLogData.call_started_at).getTime() / 1000),
      eventSourceUrl: callLogData.landing_page || undefined,
      userData: {
        phone: callLogData.caller_number,
        clientIpAddress: clientIp,
        clientUserAgent: userAgent,
      },
      customData: {
        value: conversion_value || undefined,
        currency: 'USD',
        contentName: 'Phone Call',
        contentCategory: 'Lead',
      },
      fbp,
      fbc,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to track conversion' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error tracking Facebook Ads conversion:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

