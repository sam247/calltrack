import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/integrations/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Handle Twilio recording status callbacks
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const callSid = formData.get('CallSid') as string;
    const recordingSid = formData.get('RecordingSid') as string;
    const recordingUrl = formData.get('RecordingUrl') as string;
    const recordingStatus = formData.get('RecordingStatus') as string;
    const recordingDuration = formData.get('RecordingDuration') as string;

    const supabase = await createClient();

    // Find the call log by Twilio call SID
    const { data: callEvent } = await supabase
      .from('call_events')
      .select('call_log_id, workspace_id')
      .eq('twilio_call_sid', callSid)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (callEvent && recordingStatus === 'completed') {
      // Create or update call recording record
      const { data: existingRecording } = await supabase
        .from('call_recordings')
        .select('id')
        .eq('call_log_id', callEvent.call_log_id)
        .single();

      if (existingRecording) {
        await supabase
          .from('call_recordings')
          .update({
            storage_path: recordingUrl,
            duration_seconds: recordingDuration ? parseInt(recordingDuration) : null,
            transcription_status: 'pending', // Will be processed by AI service
          })
          .eq('id', existingRecording.id);
      } else {
        await supabase.from('call_recordings').insert({
          call_log_id: callEvent.call_log_id,
          storage_path: recordingUrl,
          duration_seconds: recordingDuration ? parseInt(recordingDuration) : null,
          transcription_status: 'pending',
        });
      }

      // Trigger transcription processing (async)
      if (recordingStatus === 'completed' && recordingUrl) {
        // Process in background - don't await
        fetch(`${request.nextUrl.origin}/api/transcriptions/process`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            call_log_id: callEvent.call_log_id,
            recording_url: recordingUrl,
          }),
        }).catch(error => {
          console.error('Error triggering transcription:', error);
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error handling recording callback:', error);
    return NextResponse.json(
      { error: 'Failed to process recording callback' },
      { status: 500 }
    );
  }
}

