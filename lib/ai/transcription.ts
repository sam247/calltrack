/**
 * AI Transcription Service
 * 
 * Supports both OpenAI Whisper and Deepgram for transcription
 */

export interface TranscriptionResult {
  text: string;
  language?: string;
  confidence?: number;
  segments?: Array<{
    start: number;
    end: number;
    text: string;
  }>;
}

/**
 * Transcribe audio using OpenAI Whisper API
 */
export async function transcribeWithOpenAI(
  audioUrl: string,
  apiKey: string
): Promise<TranscriptionResult> {
  try {
    // Download audio file
    const audioResponse = await fetch(audioUrl);
    const audioBlob = await audioResponse.blob();

    // Convert to File for FormData
    const formData = new FormData();
    formData.append('file', audioBlob, 'recording.mp3');
    formData.append('model', 'whisper-1');
    formData.append('response_format', 'verbose_json');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Transcription failed');
    }

    const result = await response.json();

    return {
      text: result.text,
      language: result.language,
      segments: result.segments?.map((seg: any) => ({
        start: seg.start,
        end: seg.end,
        text: seg.text,
      })),
    };
  } catch (error: any) {
    console.error('OpenAI transcription error:', error);
    throw error;
  }
}

/**
 * Transcribe audio using Deepgram API
 */
export async function transcribeWithDeepgram(
  audioUrl: string,
  apiKey: string
): Promise<TranscriptionResult> {
  try {
    const response = await fetch('https://api.deepgram.com/v1/listen', {
      method: 'POST',
      headers: {
        Authorization: `Token ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: audioUrl,
        model: 'nova-2',
        punctuate: true,
        paragraphs: true,
        utterances: true,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Transcription failed');
    }

    const result = await response.json();
    const transcript = result.results?.channels?.[0]?.alternatives?.[0];

    return {
      text: transcript?.transcript || '',
      confidence: transcript?.confidence,
      segments: transcript?.paragraphs?.paragraphs?.map((para: any) => ({
        start: para.start,
        end: para.end,
        text: para.sentences.map((s: any) => s.text).join(' '),
      })),
    };
  } catch (error: any) {
    console.error('Deepgram transcription error:', error);
    throw error;
  }
}

/**
 * Transcribe audio using the configured service
 */
export async function transcribeAudio(
  audioUrl: string
): Promise<TranscriptionResult> {
  // Prefer Deepgram if available (better for phone calls)
  if (process.env.DEEPGRAM_API_KEY) {
    return transcribeWithDeepgram(audioUrl, process.env.DEEPGRAM_API_KEY);
  }

  // Fallback to OpenAI Whisper
  if (process.env.OPENAI_API_KEY) {
    return transcribeWithOpenAI(audioUrl, process.env.OPENAI_API_KEY);
  }

  throw new Error('No transcription service configured. Set DEEPGRAM_API_KEY or OPENAI_API_KEY');
}

