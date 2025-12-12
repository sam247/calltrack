import type { ParsedAttribution } from './parser';

export type SourceType = 'organic' | 'paid' | 'direct' | 'referral' | 'social' | 'email' | 'other';

export interface ClassifiedAttribution extends ParsedAttribution {
  sourceType: SourceType;
  isPaid: boolean;
}

/**
 * Classify attribution source type
 */
export function classifySource(attribution: ParsedAttribution): SourceType {
  const { source, medium } = attribution;
  
  // Paid search indicators
  if (medium === 'cpc' || medium === 'ppc' || medium === 'paid' || source === 'google' && medium === 'cpc') {
    return 'paid';
  }
  
  // Organic search
  if (medium === 'organic' || (source === 'google' && !medium) || source === 'bing' || source === 'yahoo') {
    return 'organic';
  }
  
  // Social media
  if (medium === 'social' || ['facebook', 'twitter', 'linkedin', 'instagram', 'tiktok'].includes(source.toLowerCase())) {
    return 'social';
  }
  
  // Email
  if (medium === 'email' || source === 'email') {
    return 'email';
  }
  
  // Referral
  if (medium === 'referral' || attribution.referrer) {
    return 'referral';
  }
  
  // Direct
  if (source === 'direct' || medium === 'none' || (!source && !medium)) {
    return 'direct';
  }
  
  return 'other';
}

/**
 * Determine if attribution is from paid traffic
 */
export function isPaidTraffic(attribution: ParsedAttribution): boolean {
  const sourceType = classifySource(attribution);
  return sourceType === 'paid' || 
         attribution.medium === 'cpc' || 
         attribution.medium === 'ppc' ||
         attribution.medium === 'paid';
}

/**
 * Classify full attribution data
 */
export function classifyAttribution(attribution: ParsedAttribution): ClassifiedAttribution {
  const sourceType = classifySource(attribution);
  const isPaid = isPaidTraffic(attribution);
  
  return {
    ...attribution,
    sourceType,
    isPaid,
  };
}

/**
 * Get keyword from UTM term or referrer
 */
export function extractKeyword(attribution: ParsedAttribution): string | null {
  if (attribution.term) {
    return attribution.term;
  }
  
  // Try to extract from referrer if it's a search engine
  if (attribution.referrer) {
    try {
      const url = new URL(attribution.referrer);
      const query = url.searchParams.get('q') || url.searchParams.get('query');
      if (query) return query;
    } catch {
      // Invalid URL
    }
  }
  
  return null;
}

