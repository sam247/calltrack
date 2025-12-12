import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/integrations/supabase/server';
import { forwardCall } from '@/lib/twilio/calls';
import { incrementCallUsage } from '@/lib/workspace/quota';
import twilio from 'twilio';

export const dynamic = 'force-dynamic';

// Verify Twilio webhook signature
function validateTwilioRequest(request: NextRequest): boolean {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken) {
    console.error('TWILIO_AUTH_TOKEN not set');
    return false;
  }

  const url = request.url;
  const params = Object.fromEntries(request.nextUrl.searchParams);
  
  // Reconstruct the signature
  const signature = request.headers.get('X-Twilio-Signature');
  if (!signature) {
    return false;
  }

  return twilio.validateRequest(
    authToken,
    signature,
    url,
    params
  );
}

export async function POST(request: NextRequest) {
  try {
    // Validate Twilio signature
    if (!validateTwilioRequest(request)) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const callSid = formData.get('CallSid') as string;
    const callStatus = formData.get('CallStatus') as string;
    const from = formData.get('From') as string;
    const to = formData.get('To') as string;
    const direction = formData.get('Direction') as string;
    const callDuration = formData.get('CallDuration') as string;

    const supabase = await createClient();

    // Find the tracking number
    const { data: trackingNumber, error: trackingError } = await (supabase
      .from('tracking_numbers' as any)
      .select('*, workspaces(*)')
      .eq('phone_number', to)
      .eq('is_active', true)
      .single() as any);

    const trackingNumberData = trackingNumber as { id: string; workspace_id: string; forwarding_number: string | null; twilio_number_sid: string | null; source: string | null; campaign: string | null } | null;
    if (trackingError || !trackingNumberData) {
      console.error('Tracking number not found:', trackingError);
      // Return empty TwiML to hang up
      const twiml = new twilio.twiml.VoiceResponse();
      twiml.say('Sorry, this number is not configured.');
      twiml.hangup();
      return new NextResponse(twiml.toString(), {
        headers: { 'Content-Type': 'text/xml' },
      });
    }

    const workspaceId = trackingNumberData.workspace_id;

    // Get attribution data from caller (if available via custom parameters or lookup)
    // In a real implementation, you'd get this from a database lookup based on caller number
    // or from URL parameters if the tracking number was clicked
    let attributionData: any = null;
    
    // Try to get attribution from visitor lookup (if caller number matches a recent visitor)
    // This is a simplified version - in production, you'd have a more sophisticated matching system
    const callerId = formData.get('CallerName') as string;
    
    // Handle different call statuses
    if (callStatus === 'ringing' || callStatus === 'in-progress') {
      // Create or update call log
      const { data: existingCall } = await (supabase
        .from('call_logs' as any)
        .select('id')
        .eq('workspace_id', workspaceId)
        .eq('caller_number', from)
        .order('call_started_at', { ascending: false })
        .limit(1)
        .single() as any);

      if (!existingCall) {
        // Try to get attribution from recent visitor activity
        // Look for recent attribution paths that might match this caller
        const { data: recentAttribution } = await (supabase
          .from('attribution_paths' as any)
          .select('last_touch')
          .eq('workspace_id', workspaceId)
          .order('updated_at', { ascending: false })
          .limit(1)
          .single() as any);

        const lastTouch = recentAttribution?.last_touch as any;
        
        // Create new call log with attribution
        const insertQuery = supabase.from('call_logs' as any) as any;
        const insertResult = await insertQuery.insert({
          workspace_id: workspaceId,
          tracking_number_id: trackingNumberData.id,
          caller_number: from,
          caller_name: callerId || null,
          source: trackingNumberData.source || lastTouch?.source || null,
          campaign: trackingNumberData.campaign || lastTouch?.campaign || null,
          utm_source: lastTouch?.source || null,
          utm_medium: lastTouch?.medium || null,
          utm_campaign: lastTouch?.campaign || null,
          landing_page: lastTouch?.landing_page || null,
          referrer: lastTouch?.referrer || null,
          status: 'completed', // Will update on completion
          call_started_at: new Date().toISOString(),
        } as any).select().single();
        const newCall = insertResult.data as { id: string } | null;

        if (newCall) {
          // Create call event
          const eventsInsertQuery = supabase.from('call_events' as any) as any;
          await eventsInsertQuery.insert({
            call_log_id: newCall.id,
            workspace_id: workspaceId,
            event_type: callStatus,
            twilio_call_sid: callSid,
            metadata: {
              from,
              to,
              direction,
            },
          } as any);

          // Increment call usage
          await incrementCallUsage(workspaceId);
        }
      } else {
        // Create call event for existing call
        const existingCallData = existingCall as { id: string };
        const eventsInsertQuery2 = supabase.from('call_events' as any) as any;
        await eventsInsertQuery2.insert({
          call_log_id: existingCallData.id,
          workspace_id: workspaceId,
          event_type: callStatus,
          twilio_call_sid: callSid,
          metadata: {
            from,
            to,
            direction,
          },
        } as any);
      }

      // Forward the call if forwarding number is set
      if (trackingNumberData.forwarding_number) {
        const twimlXml = await forwardCall({
          to: trackingNumberData.forwarding_number,
          from: to,
          recordingEnabled: true, // Enable recording for V2
          recordingStatusCallback: `${request.nextUrl.origin}/api/webhooks/twilio/recording`,
        });

        return new NextResponse(twimlXml, {
          headers: { 'Content-Type': 'text/xml' },
        });
      } else {
        // No forwarding number configured
        const twiml = new twilio.twiml.VoiceResponse();
        twiml.say('This number is not configured to forward calls.');
        twiml.hangup();
        return new NextResponse(twiml.toString(), {
          headers: { 'Content-Type': 'text/xml' },
        });
      }
    } else if (callStatus === 'completed' || callStatus === 'busy' || callStatus === 'no-answer' || callStatus === 'failed') {
      // Update call log with completion status
      const { data: callLog } = await (supabase
        .from('call_logs' as any)
        .select('id')
        .eq('workspace_id', workspaceId)
        .eq('caller_number', from)
        .order('call_started_at', { ascending: false })
        .limit(1)
        .single() as any);

      const callLogData = callLog as { id: string } | null;
      if (callLogData) {
        const finalStatus = callStatus === 'completed' ? 'completed' : 
                           callStatus === 'busy' || callStatus === 'no-answer' ? 'missed' : 'abandoned';

        const updateQuery = supabase.from('call_logs' as any) as any;
        await updateQuery
          .update({
            status: finalStatus,
            duration_seconds: callDuration ? parseInt(callDuration) : 0,
            call_ended_at: new Date().toISOString(),
          } as any)
          .eq('id', callLogData.id);

        // Create completion event
        const eventsInsertQuery3 = supabase.from('call_events' as any) as any;
        await eventsInsertQuery3.insert({
          call_log_id: callLogData.id,
          workspace_id: workspaceId,
          event_type: callStatus,
          twilio_call_sid: callSid,
          metadata: {
            from,
            to,
            direction,
            duration: callDuration,
          },
        } as any);

        // Track conversions for completed calls
        if (finalStatus === 'completed') {
          // Get full call log with attribution data
          const { data: fullCallLog } = await (supabase
            .from('call_logs' as any)
            .select('*')
            .eq('id', callLogData.id)
            .single() as any);

          if (fullCallLog) {
            // Track Google Ads conversion if GCLID exists
            const attributionPath = fullCallLog.attribution_path as any;
            const gclid = attributionPath?.gclid || fullCallLog.utm_source === 'google' && attributionPath?.gclid;
            
            if (gclid && process.env.GOOGLE_ADS_CUSTOMER_ID) {
              try {
                await fetch(`${request.nextUrl.origin}/api/integrations/google-ads`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    workspace_id: workspaceId,
                    call_log_id: callLog.id,
                    gclid,
                  }),
                });
              } catch (error) {
                console.error('Error tracking Google Ads conversion:', error);
              }
            }

            // Track Facebook Ads conversion if Facebook IDs exist
            const fbp = attributionPath?.fbp;
            const fbc = attributionPath?.fbc || attributionPath?.facebook_click_id;
            
            if ((fbp || fbc) && process.env.FACEBOOK_PIXEL_ID) {
              try {
                await fetch(`${request.nextUrl.origin}/api/integrations/facebook-ads`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    workspace_id: workspaceId,
                    call_log_id: callLogData.id,
                    fbp,
                    fbc,
                  }),
                });
              } catch (error) {
                console.error('Error tracking Facebook Ads conversion:', error);
              }
            }
          }
        }
      }
    }

    // Return empty TwiML for status callbacks
    const twiml = new twilio.twiml.VoiceResponse();
    return new NextResponse(twiml.toString(), {
      headers: { 'Content-Type': 'text/xml' },
    });
  } catch (error: any) {
    console.error('Error handling Twilio webhook:', error);
    const twiml = new twilio.twiml.VoiceResponse();
    twiml.say('An error occurred processing your call.');
    twiml.hangup();
    return new NextResponse(twiml.toString(), {
      headers: { 'Content-Type': 'text/xml' },
      status: 500,
    });
  }
}

