/**
 * AI-Powered Call Insights
 * 
 * Auto-tagging, quality scoring, and intelligent call analysis
 */

export interface CallInsight {
  tags: string[];
  qualityScore: number; // 0-100
  summary: string;
  actionItems: string[];
  nextSteps: string[];
  competitiveMentions: string[];
  objections: string[];
}

/**
 * Generate call insights using OpenAI
 */
export async function generateCallInsights(
  transcript: string,
  metadata?: {
    duration?: number;
    callerNumber?: string;
    source?: string;
  }
): Promise<CallInsight> {
  if (!process.env.OPENAI_API_KEY) {
    return {
      tags: [],
      qualityScore: 50,
      summary: '',
      actionItems: [],
      nextSteps: [],
      competitiveMentions: [],
      objections: [],
    };
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a call analysis expert. Analyze the following call transcript and return a JSON object with:
- tags: an array of relevant tags (e.g., "interested", "pricing-question", "technical-inquiry", "follow-up-needed")
- qualityScore: a number from 0-100 indicating call quality (consider engagement, clarity, outcome)
- summary: a brief 2-3 sentence summary of the call
- actionItems: an array of action items or tasks mentioned
- nextSteps: an array of next steps or follow-ups needed
- competitiveMentions: an array of competitor names or products mentioned
- objections: an array of objections or concerns raised

Return ONLY valid JSON, no other text.`,
          },
          {
            role: 'user',
            content: `Call Transcript:\n${transcript}\n\nMetadata: ${JSON.stringify(metadata || {})}`,
          },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Insight generation failed');
    }

    const result = await response.json();
    const insights = JSON.parse(result.choices[0].message.content);

    return {
      tags: insights.tags || [],
      qualityScore: insights.qualityScore || 50,
      summary: insights.summary || '',
      actionItems: insights.actionItems || [],
      nextSteps: insights.nextSteps || [],
      competitiveMentions: insights.competitiveMentions || [],
      objections: insights.objections || [],
    };
  } catch (error: any) {
    console.error('Error generating call insights:', error);
    return {
      tags: [],
      qualityScore: 50,
      summary: '',
      actionItems: [],
      nextSteps: [],
      competitiveMentions: [],
      objections: [],
    };
  }
}

/**
 * Calculate quality score based on call metrics
 */
export function calculateQualityScore(
  duration: number,
  sentimentScore: number,
  hasActionItems: boolean,
  hasNextSteps: boolean
): number {
  let score = 50; // Base score

  // Duration factor (optimal: 2-10 minutes)
  if (duration >= 120 && duration <= 600) {
    score += 20;
  } else if (duration >= 60 && duration < 120) {
    score += 10;
  } else if (duration < 30) {
    score -= 20;
  }

  // Sentiment factor
  score += sentimentScore * 15;

  // Engagement factors
  if (hasActionItems) score += 10;
  if (hasNextSteps) score += 10;

  return Math.max(0, Math.min(100, Math.round(score)));
}

