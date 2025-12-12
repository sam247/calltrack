import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/integrations/supabase/server';
import { transcribeAudio } from '@/lib/ai/transcription';
import { analyzeSentiment } from '@/lib/ai/sentiment';
import { generateCallInsights } from '@/lib/ai/insights';
import { storeRecordingInStorage } from '@/lib/storage/recordings';

export const dynamic = 'force-dynamic';

/**
 * POST /api/transcriptions/process
 * Process a call recording: transcribe, analyze sentiment, and generate insights
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { call_log_id, recording_url } = body;

    if (!call_log_id || !recording_url) {
      return NextResponse.json(
        { error: 'call_log_id and recording_url required' },
        { status: 400 }
      );
    }

    // Get call log
    const { data: callLog, error: callLogError } = await supabase
      .from('call_logs')
      .select('*, workspaces(*)')
      .eq('id', call_log_id)
      .single();

    if (callLogError || !callLog) {
      return NextResponse.json(
        { error: 'Call log not found' },
        { status: 404 }
      );
    }

    // Verify user has access
    const { data: member } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', callLog.workspace_id)
      .eq('user_id', user.id)
      .single();

    if (!member) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update status to processing
    await supabase
      .from('call_recordings')
      .update({ transcription_status: 'processing' })
      .eq('call_log_id', call_log_id);

    try {
      // Store recording in Supabase Storage
      const storageResult = await storeRecordingInStorage(
        recording_url,
        call_log_id,
        callLog.workspace_id
      );

      // Transcribe audio
      const transcription = await transcribeAudio(recording_url);

      // Analyze sentiment
      const sentiment = await analyzeSentiment(transcription.text);

      // Generate insights
      const insights = await generateCallInsights(transcription.text, {
        duration: callLog.duration_seconds || undefined,
        callerNumber: callLog.caller_number,
        source: callLog.source || undefined,
      });

      // Update call recording with all results
      const { error: updateError } = await supabase
        .from('call_recordings')
        .update({
          transcription: transcription.text,
          transcription_status: 'completed',
          sentiment_score: sentiment.score,
          keywords: sentiment.keywords,
          summary: insights.summary,
          storage_path: storageResult.storagePath || recording_url,
          processed_at: new Date().toISOString(),
        })
        .eq('call_log_id', call_log_id);

      if (updateError) {
        throw updateError;
      }

      // Store insights in metadata (could be a separate table in production)
      await supabase
        .from('call_logs')
        .update({
          // Store insights as JSON in a metadata field if available
          // For now, we'll just log it
        })
        .eq('id', call_log_id);

      return NextResponse.json({
        success: true,
        transcription: transcription.text,
        sentiment,
        insights,
      });
    } catch (error: any) {
      // Update status to failed
      await supabase
        .from('call_recordings')
        .update({ transcription_status: 'failed' })
        .eq('call_log_id', call_log_id);

      throw error;
    }
  } catch (error: any) {
    console.error('Error processing transcription:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

