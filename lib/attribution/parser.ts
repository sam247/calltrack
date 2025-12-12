import type { AttributionData } from './tracker';

export interface ParsedAttribution {
  source: string;
  medium: string;
  campaign?: string;
  term?: string;
  content?: string;
  referrer?: string;
  landingPage: string;
}

/**
 * Parse UTM parameters into structured attribution
 */
export function parseUTMAttribution(data: AttributionData): ParsedAttribution {
  return {
    source: data.utm_source || 'direct',
    medium: data.utm_medium || 'none',
    campaign: data.utm_campaign,
    term: data.utm_term,
    content: data.utm_content,
    referrer: data.referrer,
    landingPage: data.landing_page,
  };
}

/**
 * Extract domain from referrer URL
 */
export function extractReferrerDomain(referrer?: string): string | null {
  if (!referrer) return null;
  
  try {
    const url = new URL(referrer);
    return url.hostname;
  } catch {
    return null;
  }
}

/**
 * Parse referrer to determine source
 */
export function parseReferrer(referrer?: string): {
  source: string;
  medium: string;
} {
  if (!referrer) {
    return { source: 'direct', medium: 'none' };
  }
  
  const domain = extractReferrerDomain(referrer);
  if (!domain) {
    return { source: 'direct', medium: 'none' };
  }
  
  // Common referrer patterns
  const searchEngines = ['google.com', 'bing.com', 'yahoo.com', 'duckduckgo.com'];
  const socialNetworks = ['facebook.com', 'twitter.com', 'linkedin.com', 'instagram.com', 'tiktok.com'];
  
  if (searchEngines.some(se => domain.includes(se))) {
    return { source: domain.split('.')[0], medium: 'organic' };
  }
  
  if (socialNetworks.some(sn => domain.includes(sn))) {
    return { source: domain.split('.')[0], medium: 'social' };
  }
  
  return { source: domain, medium: 'referral' };
}

