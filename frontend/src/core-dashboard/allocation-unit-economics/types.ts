export type CoverageState = 'green' | 'amber' | 'red' | 'na';

export interface AllocationCoverageMetric {
  label: string;
  valuePct: number | null;
  state: CoverageState;
}

export interface CoverageModel {
  team: AllocationCoverageMetric;
  product: AllocationCoverageMetric;
  owner: AllocationCoverageMetric;
  unallocatedAmount: number;
  unallocatedPct: number | null;
}

export interface ShowbackRow {
  team: string;
  product: string;
  environment: string;
  directCost: number;
  sharedAllocatedCost: number;
  totalCost: number;
  pctOfTotal: number;
  budget: number | null;
  budgetVariance: number | null;
}

export interface SharedPoolModel {
  total: number;
  ruleApplied: string;
  redistributedAmount: number;
  rows: ShowbackRow[];
}

export interface UnitTrendPoint {
  date: string;
  cost: number;
  quantity: number;
  unitPrice: number;
}

export interface UnitEconomicsModel {
  totalCost: number;
  totalQuantity: number;
  avgUnitPrice: number;
  unitPriceChangePct: number;
  trend: UnitTrendPoint[];
  efficiencyStatus: 'gain' | 'drop' | 'stable' | 'insufficient_data';
  efficiencyInsight: string;
  costGrowthPct: number;
  volumeGrowthPct: number;
}

export interface VarianceRow {
  name: string;
  previous: number;
  current: number;
  delta: number;
  deltaPct: number;
  contributionPct: number;
}

export interface HeatmapCell {
  team: string;
  environment: string;
  spend: number;
  pctOfTotal: number;
  intensityBand: 1 | 2 | 3 | 4 | 5;
  riskFlags: string[];
}

export interface ExportRow {
  team: string;
  product: string;
  environment: string;
  directCost: number;
  sharedCost: number;
  totalCost: number;
  period: string;
  costBasis: string;
  allocationRuleUsed: string;
}

export interface AllocationUnitEconomicsViewModel {
  kpis: UnitEconomicsModel;
  coverage: CoverageModel;
  sharedPool: SharedPoolModel;
  showbackRows: ShowbackRow[];
  teamVariance: VarianceRow[];
  productVariance: VarianceRow[];
  heatmap: HeatmapCell[];
  exportRows: ExportRow[];
  periodLabel: string;
  notes: string[];
}

export interface AllocationUnitEconomicsControls {
  period: '30d' | '90d' | 'month';
  basis: 'actual' | 'amortized' | 'net';
  compareTo: 'previous_period' | 'same_period_last_month';
}
