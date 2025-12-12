/**
 * CallTrack Attribution Tracking Script
 * Embed this script on your website to track visitor attribution
 * 
 * Usage:
 * <script src="https://your-domain.com/tracking.js" data-workspace-id="your-workspace-id"></script>
 */

(function() {
  'use strict';
  
  // Get workspace ID from script tag
  const script = document.currentScript || document.querySelector('script[data-workspace-id]');
  const workspaceId = script?.getAttribute('data-workspace-id');
  
  if (!workspaceId) {
    console.warn('CallTrack: workspace-id not found');
    return;
  }
  
  // Get API endpoint from script tag or use default
  const apiEndpoint = script?.getAttribute('data-api-endpoint') || 
                      `https://${window.location.hostname}/api/attribution/track`;
  
  // Generate visitor ID (persistent)
  function getVisitorId() {
    const stored = localStorage.getItem('ct_visitor_id');
    if (stored) return stored;
    
    const visitorId = 'vis_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('ct_visitor_id', visitorId);
    return visitorId;
  }
  
  // Generate session ID (per session)
  function getSessionId() {
    const stored = sessionStorage.getItem('ct_session_id');
    if (stored) return stored;
    
    const sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    sessionStorage.setItem('ct_session_id', sessionId);
    return sessionId;
  }
  
  // Parse UTM parameters
  function parseUTMParams() {
    const params = new URLSearchParams(window.location.search);
    return {
      utm_source: params.get('utm_source'),
      utm_medium: params.get('utm_medium'),
      utm_campaign: params.get('utm_campaign'),
      utm_term: params.get('utm_term'),
      utm_content: params.get('utm_content'),
    };
  }
  
  // Collect attribution data
  function collectAttributionData() {
    const utm = parseUTMParams();
    
    return {
      workspace_id: workspaceId,
      utm_source: utm.utm_source || null,
      utm_medium: utm.utm_medium || null,
      utm_campaign: utm.utm_campaign || null,
      utm_term: utm.utm_term || null,
      utm_content: utm.utm_content || null,
      referrer: document.referrer || null,
      landing_page: window.location.href,
      session_id: getSessionId(),
      visitor_id: getVisitorId(),
      timestamp: new Date().toISOString(),
    };
  }
  
  // Store attribution data
  function storeAttributionData(data) {
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
  
  // Send attribution data to API
  function sendAttributionData(data) {
    // Use sendBeacon for better reliability
    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
      navigator.sendBeacon(apiEndpoint, blob);
    } else {
      // Fallback to fetch
      fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        keepalive: true,
      }).catch(function(error) {
        console.error('CallTrack: Failed to send attribution data', error);
      });
    }
  }
  
  // Initialize tracking on page load
  function init() {
    const attributionData = collectAttributionData();
    storeAttributionData(attributionData);
    sendAttributionData(attributionData);
  }
  
  // Run on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
  // Expose function to get attribution data for phone number clicks
  window.CallTrack = {
    getAttribution: function() {
      const stored = localStorage.getItem('ct_attribution');
      return stored ? JSON.parse(stored) : null;
    },
    getFirstTouch: function() {
      const stored = localStorage.getItem('ct_first_touch');
      return stored ? JSON.parse(stored) : null;
    },
  };
})();

