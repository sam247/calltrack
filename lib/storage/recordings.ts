import { createClient } from '@/integrations/supabase/server';

/**
 * Download recording from Twilio and upload to Supabase Storage
 */
export async function storeRecordingInStorage(
  recordingUrl: string,
  callLogId: string,
  workspaceId: string
): Promise<{ success: boolean; storagePath?: string; error?: string }> {
  try {
    // Download recording from Twilio
    const auth = Buffer.from(
      `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
    ).toString('base64');

    const response = await fetch(recordingUrl, {
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to download recording: ${response.statusText}`);
    }

    const audioBuffer = await response.arrayBuffer();
    const fileName = `recordings/${workspaceId}/${callLogId}.mp3`;

    // Upload to Supabase Storage
    const supabase = await createClient();
    const { data, error } = await supabase.storage
      .from('call-recordings')
      .upload(fileName, audioBuffer, {
        contentType: 'audio/mpeg',
        upsert: true,
      });

    if (error) {
      throw error;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('call-recordings')
      .getPublicUrl(fileName);

    return {
      success: true,
      storagePath: urlData.publicUrl,
    };
  } catch (error: any) {
    console.error('Error storing recording:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

