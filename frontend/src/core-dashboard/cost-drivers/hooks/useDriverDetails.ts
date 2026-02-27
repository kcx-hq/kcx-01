import { useEffect, useRef, useState } from 'react';
import type {
  CostDriverDetailPayload,
  CostDriversApi,
  CostDriversCaps,
  CostDriversDecompositionRow,
  CostDriversFilters,
} from '../types';

const EMPTY_STATS: CostDriverDetailPayload = {
  summary: null,
  trend: [],
  resourceBreakdown: [],
  topSkuChanges: [],
  links: {
    billingExplorer: '/dashboard/data-explorer',
    resourceExplorer: '/dashboard/data-explorer',
    optimization: '/dashboard/optimization',
  },
  actionPayload: null,

  // Legacy aliases for older views.
  trendData: [],
  subDrivers: [],
  topResources: [],
  annualizedImpact: 0,
  insightText: '',
};

const normalizeStats = (next: unknown): CostDriverDetailPayload => {
  const payload = next && typeof next === 'object' ? next : {};

  return {
    ...EMPTY_STATS,
    ...(payload as Partial<CostDriverDetailPayload>),
    trendData: Array.isArray((payload as Partial<CostDriverDetailPayload>).trendData)
      ? ((payload as Partial<CostDriverDetailPayload>).trendData as CostDriverDetailPayload['trendData'])
      : [],
    subDrivers: Array.isArray((payload as Partial<CostDriverDetailPayload>).subDrivers)
      ? ((payload as Partial<CostDriverDetailPayload>).subDrivers as CostDriverDetailPayload['subDrivers'])
      : [],
    topResources: Array.isArray((payload as Partial<CostDriverDetailPayload>).topResources)
      ? ((payload as Partial<CostDriverDetailPayload>).topResources as CostDriverDetailPayload['topResources'])
      : [],
    annualizedImpact: Number.isFinite(Number((payload as Partial<CostDriverDetailPayload>).annualizedImpact))
      ? Number((payload as Partial<CostDriverDetailPayload>).annualizedImpact)
      : 0,
    insightText:
      typeof (payload as Partial<CostDriverDetailPayload>).insightText === 'string'
        ? String((payload as Partial<CostDriverDetailPayload>).insightText)
        : '',
  };
};

export function useDriverDetails({
  api,
  caps,
  driver,
  period,
  filters = {},
  timeRange = null,
  compareTo = null,
  costBasis = null,
  startDate = null,
  endDate = null,
  previousStartDate = null,
  previousEndDate = null,
}: {
  api?: CostDriversApi;
  caps?: CostDriversCaps;
  driver: CostDriversDecompositionRow | null;
  period: number;
  filters?: CostDriversFilters;
  timeRange?: string | null;
  compareTo?: string | null;
  costBasis?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  previousStartDate?: string | null;
  previousEndDate?: string | null;
}) {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<CostDriverDetailPayload>(EMPTY_STATS);
  const cacheRef = useRef<Map<string, CostDriverDetailPayload>>(new Map());

  useEffect(() => {
    const run = async () => {
      if (!driver || !api || !caps?.modules?.costDrivers?.enabled) return;

      const driverDimension: string =
        driver?.dimension ||
        driver?.evidencePayload?.dimension ||
        driver?.detailsPayload?.dimension ||
        'service';
      const driverKey: string | null =
        driver?.key ||
        driver?.name ||
        driver?.id ||
        driver?.evidencePayload?.driverKey ||
        driver?.detailsPayload?.driverKey ||
        null;

      if (!driverKey) return;

      const cacheKey = JSON.stringify({
        key: driverKey,
        dimension: driverDimension,
        period,
        timeRange,
        compareTo,
        costBasis,
        startDate,
        endDate,
        previousStartDate,
        previousEndDate,
        filters,
      });

      const cached = cacheRef.current.get(cacheKey);
      if (cached) {
        setStats(cached);
        return;
      }

      setLoading(true);
      try {
        const payload = await api.call<unknown>('costDrivers', 'driverDetails', {
          data: {
            driver,
            driverKey,
            dimension: driverDimension,
            period,
            timeRange,
            compareTo,
            costBasis,
            startDate,
            endDate,
            previousStartDate,
            previousEndDate,
            filters,
          },
        });

        const normalized = normalizeStats(payload ?? EMPTY_STATS);
        setStats(normalized);
        cacheRef.current.set(cacheKey, normalized);
      } catch (error) {
        const err = error as { code?: string };
        if (err?.code !== 'NOT_SUPPORTED') {
          console.error('Error fetching driver details:', error);
        }
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [
    api,
    caps,
    driver,
    period,
    timeRange,
    compareTo,
    costBasis,
    startDate,
    endDate,
    previousStartDate,
    previousEndDate,
    filters,
  ]);

  return { loading, stats };
}



