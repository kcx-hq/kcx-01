import { useEffect, useMemo, useState } from 'react';
import type {
  AllocationUnitEconomicsControls,
  AllocationUnitEconomicsViewModel,
  CoverageState,
  ExportRow,
  HeatmapCell,
  ShowbackRow,
  VarianceRow,
} from '../types';

const DEFAULT_VIEW_MODEL: AllocationUnitEconomicsViewModel = {
  kpis: {
    totalCost: 0,
    totalQuantity: 0,
    avgUnitPrice: 0,
    unitPriceChangePct: 0,
    trend: [],
    efficiencyStatus: 'insufficient_data',
    efficiencyInsight: 'Insufficient data for efficiency signal.',
    costGrowthPct: 0,
    volumeGrowthPct: 0,
  },
  coverage: {
    team: { label: 'Allocated to Team', valuePct: null, state: 'na' },
    product: { label: 'Allocated to Product', valuePct: null, state: 'na' },
    owner: { label: 'Allocated to Owner', valuePct: null, state: 'na' },
    unallocatedAmount: 0,
    unallocatedPct: null,
  },
  sharedPool: {
    total: 0,
    ruleApplied: 'No shared pool detected',
    redistributedAmount: 0,
    rows: [],
  },
  showbackRows: [],
  teamVariance: [],
  productVariance: [],
  heatmap: [],
  exportRows: [],
  periodLabel: 'N/A',
  notes: [
    'Product and environment allocation dimensions are currently limited by available backend tags.',
  ],
};

const toNumber = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const growthPct = (curr: number, prev: number): number => {
  if (!prev) return curr > 0 ? 100 : 0;
  return ((curr - prev) / prev) * 100;
};

const getCoverageState = (pct: number | null): CoverageState => {
  if (pct === null || !Number.isFinite(pct)) return 'na';
  if (pct >= 95) return 'green';
  if (pct >= 80) return 'amber';
  return 'red';
};

const parsePayload = (value: unknown) => {
  if (!value || typeof value !== 'object') return {};
  const root = value as { success?: boolean; data?: unknown };
  if (root.success && root.data && typeof root.data === 'object') return root.data as Record<string, unknown>;
  if (root.data && typeof root.data === 'object') return root.data as Record<string, unknown>;
  return value as Record<string, unknown>;
};

const mapPeriod = (period: AllocationUnitEconomicsControls['period']): string => {
  if (period === '90d') return 'last90days';
  if (period === 'month') return 'month';
  return 'last30days';
};

const mapPeriodLabel = (period: AllocationUnitEconomicsControls['period']): string => {
  if (period === '90d') return 'Last 90 Days';
  if (period === 'month') return 'Month to Date';
  return 'Last 30 Days';
};

const buildShowbackRows = (accounts: Array<Record<string, unknown>>, totalCost: number): ShowbackRow[] => {
  if (!accounts.length) return [];

  const grouped = new Map<string, { direct: number }>();
  accounts.forEach((account) => {
    const owner = String(account.owner || '').trim() || 'Unassigned';
    const cost = toNumber(account.cost);
    const entry = grouped.get(owner) || { direct: 0 };
    entry.direct += cost;
    grouped.set(owner, entry);
  });

  const baseRows = Array.from(grouped.entries()).map(([team, value]) => ({
    team,
    directCost: value.direct,
  }));

  const directTotal = baseRows.reduce((sum, row) => sum + row.directCost, 0);
  const residualSharedPool = Math.max(0, totalCost - directTotal);

  return baseRows
    .map((row) => {
      const weight = directTotal > 0 ? row.directCost / directTotal : 0;
      const sharedAllocatedCost = residualSharedPool * weight;
      const total = row.directCost + sharedAllocatedCost;
      return {
        team: row.team,
        product: 'All Products',
        environment: 'All',
        directCost: Number(row.directCost.toFixed(2)),
        sharedAllocatedCost: Number(sharedAllocatedCost.toFixed(2)),
        totalCost: Number(total.toFixed(2)),
        pctOfTotal: totalCost > 0 ? Number(((total / totalCost) * 100).toFixed(2)) : 0,
        budget: null,
        budgetVariance: null,
      };
    })
    .sort((a, b) => b.totalCost - a.totalCost);
};

const buildHeatmap = (showbackRows: ShowbackRow[], totalCost: number): HeatmapCell[] => {
  return showbackRows.slice(0, 8).map((row) => {
    const pct = totalCost > 0 ? (row.totalCost / totalCost) * 100 : 0;
    const intensityBand: HeatmapCell['intensityBand'] =
      pct > 30 ? 5 : pct > 20 ? 4 : pct > 10 ? 3 : pct > 5 ? 2 : 1;
    const riskFlags: string[] = [];
    if (row.team === 'Unassigned' && pct > 8) riskFlags.push('no_owner');
    if (pct > 35) riskFlags.push('concentration');
    return {
      team: row.team,
      environment: row.environment,
      spend: row.totalCost,
      pctOfTotal: Number(pct.toFixed(2)),
      intensityBand,
      riskFlags,
    };
  });
};

const buildExportRows = (
  showbackRows: ShowbackRow[],
  periodLabel: string,
  basis: AllocationUnitEconomicsControls['basis'],
  allocationRule: string,
): ExportRow[] =>
  showbackRows.map((row) => ({
    team: row.team,
    product: row.product,
    environment: row.environment,
    directCost: row.directCost,
    sharedCost: row.sharedAllocatedCost,
    totalCost: row.totalCost,
    period: periodLabel,
    costBasis: basis,
    allocationRuleUsed: allocationRule,
  }));

interface UseAllocationUnitEconomicsDataInput {
  api: { call: (module: string, endpoint: string, options?: Record<string, unknown>) => Promise<unknown> } | null;
  caps: Record<string, unknown> | null;
  filters: { provider?: string; service?: string; region?: string };
  controls: AllocationUnitEconomicsControls;
}

export function useAllocationUnitEconomicsData({
  api,
  caps,
  filters,
  controls,
}: UseAllocationUnitEconomicsDataInput) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [model, setModel] = useState<AllocationUnitEconomicsViewModel>(DEFAULT_VIEW_MODEL);

  const requestParams = useMemo(
    () => ({
      provider: filters.provider && filters.provider !== 'All' ? filters.provider : undefined,
      service: filters.service && filters.service !== 'All' ? filters.service : undefined,
      region: filters.region && filters.region !== 'All' ? filters.region : undefined,
    }),
    [filters.provider, filters.service, filters.region],
  );

  useEffect(() => {
    if (!api || !caps) return;

    const modules = (caps as { modules?: Record<string, { enabled?: boolean }> }).modules || {};
    const canUnit = Boolean(modules.unitEconomics?.enabled);
    const canGovernance = Boolean(modules.governance?.enabled);
    const canDrivers = Boolean(modules.costDrivers?.enabled);

    let mounted = true;
    setLoading(true);
    setError(null);

    const run = async () => {
      try {
        const unitPromise = canUnit
          ? api.call('unitEconomics', 'summary', {
              params: {
                ...requestParams,
                period: mapPeriod(controls.period),
                costBasis: controls.basis,
              },
            })
          : Promise.resolve({});

        const governancePromise = canGovernance
          ? api.call('governance', 'accounts', {
              params: {
                ...requestParams,
                period: mapPeriod(controls.period),
                sortBy: 'cost',
                sortOrder: 'desc',
              },
            })
          : Promise.resolve({});

        const driversPromise = canDrivers
          ? api.call('costDrivers', 'costDrivers', {
              params: {
                ...requestParams,
                period: controls.period === '90d' ? 90 : 30,
                dimension: 'team',
                compareTo: controls.compareTo,
                costBasis: controls.basis,
                rowLimit: 20,
              },
            })
          : Promise.resolve({});

        const [unitRaw, governanceRaw, driversRaw] = await Promise.all([
          unitPromise,
          governancePromise,
          driversPromise,
        ]);

        if (!mounted) return;

        const unit = parsePayload(unitRaw);
        const governance = parsePayload(governanceRaw);
        const drivers = parsePayload(driversRaw);

        const trend = Array.isArray(unit.trend)
          ? unit.trend.map((point) => ({
              date: String((point as Record<string, unknown>).date || ''),
              cost: toNumber((point as Record<string, unknown>).cost),
              quantity: toNumber((point as Record<string, unknown>).quantity),
              unitPrice: toNumber((point as Record<string, unknown>).unitPrice),
            }))
          : [];

        const totalCost = toNumber((unit.kpis as Record<string, unknown> | undefined)?.totalCost);
        const totalQuantity = toNumber((unit.kpis as Record<string, unknown> | undefined)?.totalQuantity);
        const avgUnitPrice = toNumber((unit.kpis as Record<string, unknown> | undefined)?.avgUnitPrice);
        const unitPriceChangePct = toNumber(
          (unit.kpis as Record<string, unknown> | undefined)?.unitPriceChangePct,
        );

        const accounts = Array.isArray(governance.accounts)
          ? (governance.accounts as Array<Record<string, unknown>>)
          : [];
        const insights = (governance.insights as Record<string, unknown> | undefined) || {};

        const safeTotalSpend = totalCost || toNumber(insights.totalSpend);
        const showbackRows = buildShowbackRows(accounts, safeTotalSpend);
        const sharedPool = showbackRows.reduce((sum, row) => sum + row.sharedAllocatedCost, 0);

        const spendWithOwner = toNumber(insights.spendWithOwner);
        const spendWithoutOwner = toNumber(insights.spendWithoutOwner);
        const coverageTeamPct = safeTotalSpend > 0 ? (spendWithOwner / safeTotalSpend) * 100 : null;
        const coverageOwnerPct = coverageTeamPct;

        const half = Math.floor(trend.length / 2);
        const first = half > 0 ? trend.slice(0, half) : [];
        const second = half > 0 ? trend.slice(half) : [];
        const firstCostAvg =
          first.length > 0 ? first.reduce((sum, point) => sum + point.cost, 0) / first.length : 0;
        const secondCostAvg =
          second.length > 0 ? second.reduce((sum, point) => sum + point.cost, 0) / second.length : 0;
        const firstQtyAvg =
          first.length > 0 ? first.reduce((sum, point) => sum + point.quantity, 0) / first.length : 0;
        const secondQtyAvg =
          second.length > 0 ? second.reduce((sum, point) => sum + point.quantity, 0) / second.length : 0;
        const costGrowthPct = growthPct(secondCostAvg, firstCostAvg);
        const volumeGrowthPct = growthPct(secondQtyAvg, firstQtyAvg);
        const divergence = costGrowthPct - volumeGrowthPct;

        let efficiencyStatus: AllocationUnitEconomicsViewModel['kpis']['efficiencyStatus'] = 'insufficient_data';
        let efficiencyInsight = 'Insufficient data for efficiency signal.';
        if (trend.length >= 4) {
          if (divergence > 5) {
            efficiencyStatus = 'drop';
            efficiencyInsight = 'Cost is increasing faster than volume. Unit efficiency is degrading.';
          } else if (divergence < -5) {
            efficiencyStatus = 'gain';
            efficiencyInsight = 'Volume is increasing faster than cost. Unit efficiency is improving.';
          } else {
            efficiencyStatus = 'stable';
            efficiencyInsight = 'Cost and volume are moving in a similar range. Efficiency is stable.';
          }
        }

        const decomposition = (drivers.decomposition as Record<string, unknown> | undefined) || {};
        const tabs = (decomposition.tabs as Record<string, unknown> | undefined) || {};
        const teamRowsRaw = (tabs.team as Record<string, unknown> | undefined)?.rows;
        const serviceRowsRaw = (tabs.service as Record<string, unknown> | undefined)?.rows;
        const teamRows = Array.isArray(teamRowsRaw) ? (teamRowsRaw as Array<Record<string, unknown>>) : [];
        const serviceRows = Array.isArray(serviceRowsRaw)
          ? (serviceRowsRaw as Array<Record<string, unknown>>)
          : [];

        const mapVariance = (rows: Array<Record<string, unknown>>): VarianceRow[] =>
          rows.slice(0, 8).map((row) => ({
            name: String(row.name || row.key || 'Unknown'),
            previous: toNumber(row.previousSpend),
            current: toNumber(row.currentSpend),
            delta: toNumber(row.deltaValue),
            deltaPct: toNumber(row.deltaPercent),
            contributionPct: toNumber(row.contributionScore),
          }));

        const ruleApplied = sharedPool > 0 ? 'Residual pool redistributed by direct spend share' : 'No shared pool detected';
        const periodLabel = mapPeriodLabel(controls.period);

        const nextModel: AllocationUnitEconomicsViewModel = {
          kpis: {
            totalCost: safeTotalSpend,
            totalQuantity,
            avgUnitPrice,
            unitPriceChangePct,
            trend,
            efficiencyStatus,
            efficiencyInsight,
            costGrowthPct: Number(costGrowthPct.toFixed(2)),
            volumeGrowthPct: Number(volumeGrowthPct.toFixed(2)),
          },
          coverage: {
            team: {
              label: 'Allocated to Team',
              valuePct: coverageTeamPct === null ? null : Number(coverageTeamPct.toFixed(2)),
              state: getCoverageState(coverageTeamPct),
            },
            product: {
              label: 'Allocated to Product',
              valuePct: null,
              state: 'na',
            },
            owner: {
              label: 'Allocated to Owner',
              valuePct: coverageOwnerPct === null ? null : Number(coverageOwnerPct.toFixed(2)),
              state: getCoverageState(coverageOwnerPct),
            },
            unallocatedAmount: spendWithoutOwner || Math.max(0, safeTotalSpend - spendWithOwner),
            unallocatedPct:
              safeTotalSpend > 0
                ? Number((((spendWithoutOwner || Math.max(0, safeTotalSpend - spendWithOwner)) / safeTotalSpend) * 100).toFixed(2))
                : null,
          },
          sharedPool: {
            total: Number(sharedPool.toFixed(2)),
            ruleApplied,
            redistributedAmount: Number(sharedPool.toFixed(2)),
            rows: showbackRows,
          },
          showbackRows,
          teamVariance: mapVariance(teamRows),
          productVariance: mapVariance(serviceRows),
          heatmap: buildHeatmap(showbackRows, safeTotalSpend),
          exportRows: buildExportRows(showbackRows, periodLabel, controls.basis, ruleApplied),
          periodLabel,
          notes: [
            'Product and environment allocation dimensions are currently limited by available backend tags.',
            sharedPool > 0
              ? 'Shared pool uses residual allocation by direct spend share in this version.'
              : 'Shared pool is zero for the selected scope.',
          ],
        };

        setModel(nextModel);
      } catch (fetchError) {
        console.error('Allocation & Unit Economics load failed:', fetchError);
        if (!mounted) return;
        setError('Failed to load Allocation & Unit Economics data.');
        setModel(DEFAULT_VIEW_MODEL);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    run();

    return () => {
      mounted = false;
    };
  }, [api, caps, requestParams, controls.period, controls.basis, controls.compareTo]);

  return { loading, error, model };
}
