import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/integrations/supabase/server';
import { trackGoogleAdsConversion } from '@/lib/integrations/google-ads';

export const dynamic = 'force-dynamic';

/**
 * POST /api/integrations/google-ads
 * Track a Google Ads conversion
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
      gclid,
      conversion_value,
    } = body;

    if (!workspace_id || !call_log_id || !gclid) {
      return NextResponse.json(
        { error: 'workspace_id, call_log_id, and gclid required' },
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

    // Get workspace Google Ads config
    // In a real implementation, you'd store this in a workspace_settings table
    // For now, we'll get it from environment or request
    const config = {
      customerId: process.env.GOOGLE_ADS_CUSTOMER_ID || '',
      conversionActionId: process.env.GOOGLE_ADS_CONVERSION_ACTION_ID || '',
      developerToken: process.env.GOOGLE_ADS_DEVELOPER_TOKEN || '',
      clientId: process.env.GOOGLE_ADS_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_ADS_CLIENT_SECRET || '',
      refreshToken: process.env.GOOGLE_ADS_REFRESH_TOKEN || '',
    };

    // Get call log details
    const { data: callLog } = await supabase
      .from('call_logs')
      .select('*')
      .eq('id', call_log_id)
      .eq('workspace_id', workspace_id)
      .single();

    if (!callLog) {
      return NextResponse.json({ error: 'Call log not found' }, { status: 404 });
    }

    // Track conversion
    const result = await trackGoogleAdsConversion(config, {
      conversionActionId: config.conversionActionId,
      gclid,
      conversionDateTime: new Date(callLog.call_started_at).toISOString(),
      conversionValue: conversion_value || undefined,
      currencyCode: 'USD',
      callerNumber: callLog.caller_number,
      callDuration: callLog.duration_seconds || undefined,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to track conversion' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error tracking Google Ads conversion:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

