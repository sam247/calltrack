import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/integrations/supabase/server';
import { classifyAttribution } from '@/lib/attribution/classifier';
import { parseUTMAttribution, parseReferrer } from '@/lib/attribution/parser';

export const dynamic = 'force-dynamic';

/**
 * POST /api/attribution/track
 * Track visitor attribution data
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      workspace_id,
      utm_source,
      utm_medium,
      utm_campaign,
      utm_term,
      utm_content,
      referrer,
      landing_page,
      session_id,
      visitor_id,
    } = body;

    if (!workspace_id || !visitor_id) {
      return NextResponse.json(
        { error: 'workspace_id and visitor_id required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Parse attribution
    const parsedAttribution = parseUTMAttribution({
      utm_source: utm_source || 'direct',
      utm_medium: utm_medium || 'none',
      utm_campaign: utm_campaign,
      utm_term: utm_term,
      utm_content: utm_content,
      referrer,
      landing_page: landing_page || '',
      session_id,
      visitor_id,
      timestamp: new Date().toISOString(),
    });

    // If no UTM params, try to parse from referrer
    if (!utm_source && !utm_medium && referrer) {
      const referrerData = parseReferrer(referrer);
      parsedAttribution.source = referrerData.source;
      parsedAttribution.medium = referrerData.medium;
    }

    // Classify attribution
    const classified = classifyAttribution(parsedAttribution);

    // Store or update attribution path
    const touchpoint = {
      timestamp: new Date().toISOString(),
      source: classified.source,
      medium: classified.medium,
      campaign: classified.campaign,
      landing_page: landing_page,
      referrer: referrer,
      source_type: classified.sourceType,
      is_paid: classified.isPaid,
    };

    // Get existing attribution path
    const { data: existingPath } = await supabase
      .from('attribution_paths')
      .select('*')
      .eq('visitor_id', visitor_id)
      .eq('workspace_id', workspace_id)
      .single();

    if (existingPath) {
      // Update existing path
      const touchpoints = (existingPath.touchpoints as any[]) || [];
      touchpoints.push(touchpoint);

      // First touch should remain the first touchpoint (don't update)
      const firstTouch = existingPath.first_touch || touchpoint;
      
      // Update last touch
      const lastTouch = touchpoint;

      await supabase
        .from('attribution_paths')
        .update({
          touchpoints: touchpoints,
          first_touch: firstTouch, // Preserve original first touch
          last_touch: lastTouch,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingPath.id);
    } else {
      // Create new attribution path - this is the first touch
      await supabase.from('attribution_paths').insert({
        visitor_id,
        workspace_id,
        touchpoints: [touchpoint],
        first_touch: touchpoint, // First touch is this touchpoint
        last_touch: touchpoint,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error tracking attribution:', error);
    return NextResponse.json(
      { error: 'Failed to track attribution' },
      { status: 500 }
    );
  }
}

