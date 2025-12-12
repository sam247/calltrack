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

export type AttributionModel = 'first-touch' | 'last-touch' | 'linear' | 'time-decay' | 'position-based';

export interface AttributionWeight {
  touchpointIndex: number;
  weight: number;
  source: string;
  medium: string;
  campaign?: string;
}

/**
 * Calculate first-touch attribution weights
 */
export function calculateFirstTouchWeights(path: AttributionPath): AttributionWeight[] {
  const touchpoints = (path.touchpoints as any[]) || [];
  if (touchpoints.length === 0) return [];

  const firstTouch = touchpoints[0];
  return [{
    touchpointIndex: 0,
    weight: 1.0,
    source: firstTouch.source || 'direct',
    medium: firstTouch.medium || 'none',
    campaign: firstTouch.campaign,
  }];
}

/**
 * Calculate last-touch attribution weights
 */
export function calculateLastTouchWeights(path: AttributionPath): AttributionWeight[] {
  const touchpoints = (path.touchpoints as any[]) || [];
  if (touchpoints.length === 0) return [];

  const lastTouch = touchpoints[touchpoints.length - 1];
  return [{
    touchpointIndex: touchpoints.length - 1,
    weight: 1.0,
    source: lastTouch.source || 'direct',
    medium: lastTouch.medium || 'none',
    campaign: lastTouch.campaign,
  }];
}

/**
 * Calculate linear attribution weights (equal weight to all touchpoints)
 */
export function calculateLinearWeights(path: AttributionPath): AttributionWeight[] {
  const touchpoints = (path.touchpoints as any[]) || [];
  if (touchpoints.length === 0) return [];

  const weight = 1.0 / touchpoints.length;

  return touchpoints.map((touchpoint, index) => ({
    touchpointIndex: index,
    weight,
    source: touchpoint.source || 'direct',
    medium: touchpoint.medium || 'none',
    campaign: touchpoint.campaign,
  }));
}

/**
 * Calculate time-decay attribution weights (more recent touchpoints get more weight)
 */
export function calculateTimeDecayWeights(path: AttributionPath, halfLifeDays: number = 7): AttributionWeight[] {
  const touchpoints = (path.touchpoints as any[]) || [];
  if (touchpoints.length === 0) return [];

  const now = Date.now();
  const halfLifeMs = halfLifeDays * 24 * 60 * 60 * 1000;

  // Calculate weights based on time decay
  const weights = touchpoints.map((touchpoint) => {
    const touchpointTime = new Date(touchpoint.timestamp).getTime();
    const daysSinceTouch = (now - touchpointTime) / (24 * 60 * 60 * 1000);
    const weight = Math.pow(0.5, daysSinceTouch / halfLifeDays);
    return {
      touchpointIndex: touchpoints.indexOf(touchpoint),
      weight,
      source: touchpoint.source || 'direct',
      medium: touchpoint.medium || 'none',
      campaign: touchpoint.campaign,
    };
  });

  // Normalize weights to sum to 1.0
  const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);
  return weights.map(w => ({
    ...w,
    weight: w.weight / totalWeight,
  }));
}

/**
 * Calculate position-based attribution weights (40% first, 40% last, 20% middle)
 */
export function calculatePositionBasedWeights(path: AttributionPath): AttributionWeight[] {
  const touchpoints = (path.touchpoints as any[]) || [];
  if (touchpoints.length === 0) return [];

  if (touchpoints.length === 1) {
    return [{
      touchpointIndex: 0,
      weight: 1.0,
      source: touchpoints[0].source || 'direct',
      medium: touchpoints[0].medium || 'none',
      campaign: touchpoints[0].campaign,
    }];
  }

  const firstWeight = 0.4;
  const lastWeight = 0.4;
  const middleWeight = touchpoints.length > 2 ? 0.2 / (touchpoints.length - 2) : 0;

  return touchpoints.map((touchpoint, index) => {
    let weight: number;
    if (index === 0) {
      weight = firstWeight;
    } else if (index === touchpoints.length - 1) {
      weight = lastWeight;
    } else {
      weight = middleWeight;
    }

    return {
      touchpointIndex: index,
      weight,
      source: touchpoint.source || 'direct',
      medium: touchpoint.medium || 'none',
      campaign: touchpoint.campaign,
    };
  });
}

/**
 * Calculate attribution weights for a given model
 */
export function calculateAttributionWeights(
  path: AttributionPath,
  model: AttributionModel
): AttributionWeight[] {
  switch (model) {
    case 'first-touch':
      return calculateFirstTouchWeights(path);
    case 'last-touch':
      return calculateLastTouchWeights(path);
    case 'linear':
      return calculateLinearWeights(path);
    case 'time-decay':
      return calculateTimeDecayWeights(path);
    case 'position-based':
      return calculatePositionBasedWeights(path);
    default:
      return calculateLastTouchWeights(path);
  }
}

/**
 * Aggregate attribution weights across multiple paths
 */
export function aggregateAttributionWeights(
  paths: AttributionPath[],
  model: AttributionModel
): Record<string, number> {
  const aggregated: Record<string, number> = {};

  paths.forEach((path) => {
    const weights = calculateAttributionWeights(path, model);
    weights.forEach((weight) => {
      const key = `${weight.source}:${weight.medium}`;
      aggregated[key] = (aggregated[key] || 0) + weight.weight;
    });
  });

  return aggregated;
}

