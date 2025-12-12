/**
 * Facebook Ads Integration
 * 
 * This module handles Facebook Ads conversion tracking and reporting.
 * It integrates with Facebook Conversions API to track conversions.
 */

export interface FacebookAdsConversion {
  eventName: string; // 'Lead' or 'Purchase'
  eventTime: number; // Unix timestamp
  eventSourceUrl?: string;
  userData: {
    phone?: string;
    email?: string;
    clientIpAddress?: string;
    clientUserAgent?: string;
  };
  customData?: {
    value?: number;
    currency?: string;
    contentName?: string;
    contentCategory?: string;
  };
  fbp?: string; // Facebook browser ID
  fbc?: string; // Facebook click ID
}

export interface FacebookAdsConfig {
  pixelId: string;
  accessToken: string;
  testEventCode?: string; // For testing
}

/**
 * Track a conversion in Facebook Ads
 * 
 * This should be called when a call is completed and we have Facebook
 * click data from the attribution.
 */
export async function trackFacebookAdsConversion(
  config: FacebookAdsConfig,
  conversion: FacebookAdsConversion
): Promise<{ success: boolean; error?: string }> {
  try {
    // Facebook Conversions API endpoint
    const url = `https://graph.facebook.com/v18.0/${config.pixelId}/events`;

    const payload = {
      data: [{
        event_name: conversion.eventName,
        event_time: conversion.eventTime,
        event_source_url: conversion.eventSourceUrl,
        user_data: conversion.userData,
        custom_data: conversion.customData,
        fbp: conversion.fbp,
        fbc: conversion.fbc,
      }],
      access_token: config.accessToken,
      ...(config.testEventCode && { test_event_code: config.testEventCode }),
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Facebook API error');
    }

    const result = await response.json();
    return { success: true };
  } catch (error: any) {
    console.error('Error tracking Facebook Ads conversion:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Extract Facebook click ID (fbp/fbc) from cookies
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

  // Also check URL parameters for fbclid (Facebook click ID)
  const urlParams = new URLSearchParams(window.location.search);
  const fbclid = urlParams.get('fbclid');
  if (fbclid) {
    // Store in cookie
    document.cookie = `_fbc=${fbclid}; path=/; max-age=${30 * 24 * 60 * 60}`;
    ids.fbc = fbclid;
  }

  return ids;
}

/**
 * Store Facebook IDs in attribution data
 */
export function storeFacebookIdsInAttribution(attributionData: any): any {
  const { fbp, fbc } = extractFacebookIds();
  if (fbp || fbc) {
    return {
      ...attributionData,
      fbp,
      fbc,
      facebook_click_id: fbc,
      facebook_browser_id: fbp,
    };
  }
  return attributionData;
}

