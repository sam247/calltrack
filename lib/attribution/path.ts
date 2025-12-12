// AttributionPath type definition (not in generated types yet)
type AttributionPath = {
  id: string;
  visitor_id: string;
  workspace_id: string;
  touchpoints: any[];
  first_touch: any;
  last_touch: any;
  conversion_touch?: any;
  created_at: string;
  updated_at: string;
};

export interface Touchpoint {
  timestamp: string;
  source: string;
  medium: string;
  campaign?: string;
  landing_page?: string;
  referrer?: string;
  source_type?: string;
  is_paid?: boolean;
}

/**
 * Build or update an attribution path with a new touchpoint
 */
export function addTouchpointToPath(
  path: AttributionPath | null,
  touchpoint: Touchpoint
): AttributionPath {
  const touchpoints = (path?.touchpoints as Touchpoint[]) || [];
  const updatedTouchpoints = [...touchpoints, touchpoint];

  const firstTouch = path?.first_touch || touchpoint;
  const lastTouch = touchpoint;

  return {
    ...path,
    touchpoints: updatedTouchpoints,
    first_touch: firstTouch,
    last_touch: lastTouch,
    conversion_touch: touchpoint, // Update conversion touch
  } as AttributionPath;
}

/**
 * Get the conversion touchpoint (last touchpoint before conversion)
 */
export function getConversionTouchpoint(path: AttributionPath): Touchpoint | null {
  if (path.conversion_touch) {
    return path.conversion_touch as Touchpoint;
  }
  
  const touchpoints = (path.touchpoints as Touchpoint[]) || [];
  return touchpoints.length > 0 ? touchpoints[touchpoints.length - 1] : null;
}

/**
 * Get touchpoints within a time window
 */
export function getTouchpointsInWindow(
  path: AttributionPath,
  startDate: Date,
  endDate: Date
): Touchpoint[] {
  const touchpoints = (path.touchpoints as Touchpoint[]) || [];
  const start = startDate.getTime();
  const end = endDate.getTime();

  return touchpoints.filter((touchpoint) => {
    const touchpointTime = new Date(touchpoint.timestamp).getTime();
    return touchpointTime >= start && touchpointTime <= end;
  });
}

/**
 * Get unique sources in attribution path
 */
export function getUniqueSources(path: AttributionPath): string[] {
  const touchpoints = (path.touchpoints as Touchpoint[]) || [];
  const sources = new Set<string>();

  touchpoints.forEach((touchpoint) => {
    if (touchpoint.source) {
      sources.add(touchpoint.source);
    }
  });

  return Array.from(sources);
}

/**
 * Get unique campaigns in attribution path
 */
export function getUniqueCampaigns(path: AttributionPath): string[] {
  const touchpoints = (path.touchpoints as Touchpoint[]) || [];
  const campaigns = new Set<string>();

  touchpoints.forEach((touchpoint) => {
    if (touchpoint.campaign) {
      campaigns.add(touchpoint.campaign);
    }
  });

  return Array.from(campaigns);
}

/**
 * Calculate time between first and last touch
 */
export function getAttributionWindow(path: AttributionPath): number | null {
  const touchpoints = (path.touchpoints as Touchpoint[]) || [];
  if (touchpoints.length < 2) return null;

  const firstTime = new Date(touchpoints[0].timestamp).getTime();
  const lastTime = new Date(touchpoints[touchpoints.length - 1].timestamp).getTime();

  return lastTime - firstTime; // Returns milliseconds
}

/**
 * Check if path contains paid traffic
 */
export function hasPaidTraffic(path: AttributionPath): boolean {
  const touchpoints = (path.touchpoints as Touchpoint[]) || [];
  return touchpoints.some((touchpoint) => touchpoint.is_paid === true);
}

