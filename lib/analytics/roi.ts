import type { Database } from '@/integrations/supabase/types';

type CallLog = Database['public']['Tables']['call_logs']['Row'];
type CallAnalyticsDaily = Database['public']['Tables']['call_analytics_daily']['Row'];

export interface ROICalculation {
  source: string;
  medium: string;
  totalCalls: number;
  completedCalls: number;
  conversionRate: number;
  totalCost: number;
  revenue: number;
  roi: number;
  costPerCall: number;
  revenuePerCall: number;
  profit: number;
}

export interface ConversionFunnel {
  stage: string;
  count: number;
  percentage: number;
  dropoff: number;
}

/**
 * Calculate ROI for a set of calls
 */
export function calculateROI(
  calls: CallLog[],
  sourceCosts: Record<string, number> = {},
  averageRevenuePerCall: number = 0
): ROICalculation[] {
  // Group calls by source/medium
  const sourceMap = new Map<string, {
    calls: CallLog[];
    source: string;
    medium: string;
  }>();

  calls.forEach((call: any) => {
    const source = call.utm_source || call.source || 'direct';
    const medium = call.utm_medium || 'none';
    const key = `${source}:${medium}`;

    if (!sourceMap.has(key)) {
      sourceMap.set(key, {
        calls: [],
        source,
        medium,
      });
    }

    sourceMap.get(key)!.calls.push(call);
  });

  // Calculate ROI for each source
  const roiCalculations: ROICalculation[] = Array.from(sourceMap.entries()).map(([key, data]) => {
    const totalCalls = data.calls.length;
    const completedCalls = data.calls.filter(c => c.status === 'completed').length;
    const conversionRate = totalCalls > 0 ? (completedCalls / totalCalls) * 100 : 0;

    // Get cost for this source (default to 0 if not provided)
    const sourceKey = `${data.source}:${data.medium}`;
    const totalCost = sourceCosts[sourceKey] || sourceCosts[data.source] || 0;

    // Calculate revenue (assuming average revenue per completed call)
    const revenue = completedCalls * averageRevenuePerCall;

    // Calculate ROI
    const profit = revenue - totalCost;
    const roi = totalCost > 0 ? ((profit / totalCost) * 100) : (revenue > 0 ? Infinity : 0);
    const costPerCall = totalCalls > 0 ? totalCost / totalCalls : 0;
    const revenuePerCall = completedCalls > 0 ? revenue / completedCalls : 0;

    return {
      source: data.source,
      medium: data.medium,
      totalCalls,
      completedCalls,
      conversionRate,
      totalCost,
      revenue,
      roi: isFinite(roi) ? roi : 0,
      costPerCall,
      revenuePerCall,
      profit,
    };
  });

  return roiCalculations.sort((a, b) => b.roi - a.roi);
}

/**
 * Build conversion funnel from call data
 */
export function buildConversionFunnel(calls: CallLog[]): ConversionFunnel[] {
  const totalVisits = calls.length;
  const initiatedCalls = calls.filter(c => c.status !== 'abandoned').length;
  const answeredCalls = calls.filter(c => c.status === 'completed' || c.status === 'voicemail').length;
  const completedCalls = calls.filter(c => c.status === 'completed').length;
  const qualifiedCalls = calls.filter(c => 
    c.status === 'completed' && (c.duration_seconds || 0) > 60
  ).length;

  const stages: ConversionFunnel[] = [
    {
      stage: 'Total Calls',
      count: totalVisits,
      percentage: 100,
      dropoff: 0,
    },
    {
      stage: 'Initiated',
      count: initiatedCalls,
      percentage: totalVisits > 0 ? (initiatedCalls / totalVisits) * 100 : 0,
      dropoff: totalVisits > 0 ? ((totalVisits - initiatedCalls) / totalVisits) * 100 : 0,
    },
    {
      stage: 'Answered',
      count: answeredCalls,
      percentage: totalVisits > 0 ? (answeredCalls / totalVisits) * 100 : 0,
      dropoff: initiatedCalls > 0 ? ((initiatedCalls - answeredCalls) / initiatedCalls) * 100 : 0,
    },
    {
      stage: 'Completed',
      count: completedCalls,
      percentage: totalVisits > 0 ? (completedCalls / totalVisits) * 100 : 0,
      dropoff: answeredCalls > 0 ? ((answeredCalls - completedCalls) / answeredCalls) * 100 : 0,
    },
    {
      stage: 'Qualified (>1min)',
      count: qualifiedCalls,
      percentage: totalVisits > 0 ? (qualifiedCalls / totalVisits) * 100 : 0,
      dropoff: completedCalls > 0 ? ((completedCalls - qualifiedCalls) / completedCalls) * 100 : 0,
    },
  ];

  return stages;
}

/**
 * Calculate campaign ROI from analytics data
 */
export function calculateCampaignROI(
  analytics: CallAnalyticsDaily[],
  campaignCosts: Record<string, number> = {},
  averageRevenuePerCall: number = 0
): {
  totalCalls: number;
  totalCompleted: number;
  totalCost: number;
  totalRevenue: number;
  totalROI: number;
  bySource: Record<string, ROICalculation>;
} {
  let totalCalls = 0;
  let totalCompleted = 0;
  let totalCost = 0;

  analytics.forEach((day: any) => {
    totalCalls += day.total_calls || 0;
    totalCompleted += day.completed_calls || 0;

    // Extract source costs from source_attribution if available
    if (day.source_attribution) {
      const attribution = day.source_attribution as Record<string, any>;
      Object.keys(attribution).forEach(source => {
        const sourceCost = campaignCosts[source] || 0;
        const sourceCalls = attribution[source]?.calls || 0;
        totalCost += sourceCost * (sourceCalls / (day.total_calls || 1));
      });
    }
  });

  const totalRevenue = totalCompleted * averageRevenuePerCall;
  const totalROI = totalCost > 0 ? ((totalRevenue - totalCost) / totalCost) * 100 : 0;

  // Calculate by source
  const bySource: Record<string, ROICalculation> = {};
  
  analytics.forEach((day: any) => {
    if (day.source_attribution) {
      const attribution = day.source_attribution as Record<string, any>;
      Object.entries(attribution).forEach(([source, data]) => {
        if (!bySource[source]) {
          bySource[source] = {
            source: source.split(':')[0] || source,
            medium: source.split(':')[1] || 'none',
            totalCalls: 0,
            completedCalls: 0,
            conversionRate: 0,
            totalCost: 0,
            revenue: 0,
            roi: 0,
            costPerCall: 0,
            revenuePerCall: 0,
            profit: 0,
          };
        }

        bySource[source].totalCalls += data.calls || 0;
        bySource[source].completedCalls += data.completed || 0;
        bySource[source].totalCost += (campaignCosts[source] || 0) * (data.calls || 0);
      });
    }
  });

  // Calculate final metrics for each source
  Object.values(bySource).forEach(calc => {
    calc.conversionRate = calc.totalCalls > 0 ? (calc.completedCalls / calc.totalCalls) * 100 : 0;
    calc.revenue = calc.completedCalls * averageRevenuePerCall;
    calc.profit = calc.revenue - calc.totalCost;
    calc.roi = calc.totalCost > 0 ? ((calc.profit / calc.totalCost) * 100) : 0;
    calc.costPerCall = calc.totalCalls > 0 ? calc.totalCost / calc.totalCalls : 0;
    calc.revenuePerCall = calc.completedCalls > 0 ? calc.revenue / calc.completedCalls : 0;
  });

  return {
    totalCalls,
    totalCompleted,
    totalCost,
    totalRevenue,
    totalROI: isFinite(totalROI) ? totalROI : 0,
    bySource,
  };
}

