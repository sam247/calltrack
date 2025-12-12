/**
 * Client-side attribution tracking
 * This script should be embedded on customer websites to track visitor attribution
 */

export interface AttributionData {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  referrer?: string;
  landing_page: string;
  session_id: string;
  visitor_id: string;
  timestamp: string;
  gclid?: string; // Google Ads click ID
  fbp?: string; // Facebook browser ID
  fbc?: string; // Facebook click ID
}

/**
 * Generate or retrieve visitor ID (stored in localStorage)
 */
export function getVisitorId(): string {
  if (typeof window === 'undefined') return '';
  
  const stored = localStorage.getItem('ct_visitor_id');
  if (stored) return stored;
  
  const visitorId = `vis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  localStorage.setItem('ct_visitor_id', visitorId);
  return visitorId;
}

/**
 * Generate or retrieve session ID (stored in sessionStorage)
 */
export function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  
  const stored = sessionStorage.getItem('ct_session_id');
  if (stored) return stored;
  
  const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  sessionStorage.setItem('ct_session_id', sessionId);
  return sessionId;
}

/**
 * Parse UTM parameters from URL
 */
export function parseUTMParams(): Partial<AttributionData> {
  if (typeof window === 'undefined') return {};
  
  const params = new URLSearchParams(window.location.search);
  const utmData: Partial<AttributionData> = {};
  
  const utmSource = params.get('utm_source');
  const utmMedium = params.get('utm_medium');
  const utmCampaign = params.get('utm_campaign');
  const utmTerm = params.get('utm_term');
  const utmContent = params.get('utm_content');
  
  if (utmSource) utmData.utm_source = utmSource;
  if (utmMedium) utmData.utm_medium = utmMedium;
  if (utmCampaign) utmData.utm_campaign = utmCampaign;
  if (utmTerm) utmData.utm_term = utmTerm;
  if (utmContent) utmData.utm_content = utmContent;
  
  return utmData;
}

/**
 * Get referrer information
 */
export function getReferrer(): string {
  if (typeof window === 'undefined') return '';
  return document.referrer || '';
}

/**
 * Get current landing page
 */
export function getLandingPage(): string {
  if (typeof window === 'undefined') return '';
  return window.location.href;
}

/**
 * Extract Google Ads click ID (GCLID)
 */
export function extractGclid(): string | null {
  if (typeof window === 'undefined') return null;
  
  // Check URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const gclid = urlParams.get('gclid');
  if (gclid) {
    // Store in cookie for later use
    document.cookie = `gclid=${gclid}; path=/; max-age=${30 * 24 * 60 * 60}`; // 30 days
    return gclid;
  }
  
  // Check cookies
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'gclid') {
      return value;
    }
  }
  
  return null;
}

/**
 * Extract Facebook IDs (fbp/fbc)
 */
export function extractFacebookIds(): { fbp?: string; fbc?: string } {
  if (typeof window === 'undefined') return {};
  
  const cookies = document.cookie.split(';');
  const ids: { fbp?: string; fbc?: string } = {};
  
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === '_fbp') {
      ids.fbp = value;
    } else if (name === '_fbc') {
      ids.fbc = value;
    }
  }
  
  // Also check URL parameters for fbclid
  const urlParams = new URLSearchParams(window.location.search);
  const fbclid = urlParams.get('fbclid');
  if (fbclid) {
    document.cookie = `_fbc=${fbclid}; path=/; max-age=${30 * 24 * 60 * 60}`;
    ids.fbc = fbclid;
  }
  
  return ids;
}

/**
 * Collect all attribution data
 */
export function collectAttributionData(): AttributionData {
  const utmData = parseUTMParams();
  const gclid = extractGclid();
  const { fbp, fbc } = extractFacebookIds();
  
  return {
    ...utmData,
    referrer: getReferrer(),
    landing_page: getLandingPage(),
    session_id: getSessionId(),
    visitor_id: getVisitorId(),
    timestamp: new Date().toISOString(),
    gclid: gclid || undefined,
    fbp,
    fbc,
  };
}

/**
 * Store attribution data in localStorage for later use (e.g., when call is made)
 */
export function storeAttributionData(data: AttributionData): void {
  if (typeof window === 'undefined') return;
  
  // Store current attribution
  localStorage.setItem('ct_attribution', JSON.stringify(data));
  
  // Store first-touch attribution if not already stored
  if (!localStorage.getItem('ct_first_touch')) {
    localStorage.setItem('ct_first_touch', JSON.stringify({
      utm_source: data.utm_source,
      utm_medium: data.utm_medium,
      utm_campaign: data.utm_campaign,
      timestamp: data.timestamp,
    }));
  }
}

/**
 * Get stored attribution data
 */
export function getStoredAttributionData(): AttributionData | null {
  if (typeof window === 'undefined') return null;
  
  const stored = localStorage.getItem('ct_attribution');
  if (!stored) return null;
  
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

/**
 * Get first-touch attribution data
 */
export function getFirstTouchAttribution(): Partial<AttributionData> | null {
  if (typeof window === 'undefined') return null;
  
  const stored = localStorage.getItem('ct_first_touch');
  if (!stored) return null;
  
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

/**
 * Initialize attribution tracking on page load
 */
export function initAttributionTracking(apiEndpoint: string): void {
  if (typeof window === 'undefined') return;
  
  const attributionData = collectAttributionData();
  storeAttributionData(attributionData);
  
  // Send attribution data to API
  if (apiEndpoint) {
    fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(attributionData),
    }).catch((error) => {
      console.error('Failed to send attribution data:', error);
    });
  }
}

