/**
 * Sentiment Analysis Service
 * 
 * Analyzes call transcripts for sentiment and extracts keywords
 */

export interface SentimentResult {
  score: number; // -1 (negative) to 1 (positive)
  label: 'positive' | 'neutral' | 'negative';
  confidence: number;
  keywords: string[];
  topics: string[];
}

/**
 * Analyze sentiment using OpenAI
 */
export async function analyzeSentimentWithOpenAI(
  text: string,
  apiKey: string
): Promise<SentimentResult> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a sentiment analysis expert. Analyze the following call transcript and return a JSON object with:
- score: a number between -1 (very negative) and 1 (very positive)
- label: "positive", "neutral", or "negative"
- confidence: a number between 0 and 1
- keywords: an array of 5-10 key words or phrases from the conversation
- topics: an array of main topics discussed

Return ONLY valid JSON, no other text.`,
          },
          {
            role: 'user',
            content: text,
          },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Sentiment analysis failed');
    }

    const result = await response.json();
    const analysis = JSON.parse(result.choices[0].message.content);

    return {
      score: analysis.score || 0,
      label: analysis.label || 'neutral',
      confidence: analysis.confidence || 0.5,
      keywords: analysis.keywords || [],
      topics: analysis.topics || [],
    };
  } catch (error: any) {
    console.error('OpenAI sentiment analysis error:', error);
    throw error;
  }
}

/**
 * Extract keywords from text
 */
export function extractKeywords(text: string, maxKeywords: number = 10): string[] {
  // Simple keyword extraction (can be enhanced with NLP libraries)
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3);

  const wordFreq: Record<string, number> = {};
  words.forEach(word => {
    wordFreq[word] = (wordFreq[word] || 0) + 1;
  });

  return Object.entries(wordFreq)
    .sort(([, a], [, b]) => b - a)
    .slice(0, maxKeywords)
    .map(([word]) => word);
}

/**
 * Analyze sentiment of a transcript
 */
export async function analyzeSentiment(text: string): Promise<SentimentResult> {
  if (!process.env.OPENAI_API_KEY) {
    // Fallback to simple keyword extraction
    const keywords = extractKeywords(text);
    return {
      score: 0,
      label: 'neutral',
      confidence: 0.5,
      keywords,
      topics: [],
    };
  }

  return analyzeSentimentWithOpenAI(text, process.env.OPENAI_API_KEY);
}

