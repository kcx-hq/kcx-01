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

export interface AllocationOverviewModel {
  totalCloudCost: number;
  allocatedPct: number;
  unallocatedPct: number;
  sharedCostPoolAmount: number;
  allocationMethod: string;
  allocationConfidence: {
    score: number;
    level: 'high' | 'medium' | 'low';
    factors: {
      tagCoveragePct: number;
      sharedPoolRatioPct: number;
      ruleCompletenessPct: number;
      dataConsistencyPct: number;
    };
  };
}

export interface SharedPoolTransparencyRow {
  sharedCategory: string;
  cost: number;
  allocationRule: string;
  weightBasis: string;
  distributedAmount: number;
  rowCount: number;
}

export interface UnallocatedInsightModel {
  unallocatedAmount: number;
  unallocatedPct: number;
  topContributingServices: Array<{ service: string; amount: number }>;
  tagCoveragePct: number;
  governanceMaturity: 'strong' | 'medium' | 'weak';
}

export interface UnitTrendPoint {
  date: string;
  cost: number;
  quantity: number;
  unitPrice: number;
  previousCost: number;
  previousQuantity: number;
  previousUnitPrice: number;
  elasticity: number | null;
  isChangePoint: boolean;
  isOptimizationEvent: boolean;
}

export type UnitEfficiencyStatus =
  | 'improving'
  | 'degrading'
  | 'stable'
  | 'volatile'
  | 'insufficient_data';

export type UnitElasticityClass =
  | 'scale_advantage'
  | 'efficient'
  | 'linear'
  | 'inefficient'
  | 'undefined';

export interface UnitDecompositionComponent {
  id:
    | 'traffic_growth_effect'
    | 'infra_growth_effect'
    | 'price_change'
    | 'optimization_savings'
    | 'mix_shift'
    | 'commitment_benefit'
    | 'shared_allocation_impact';
  label: string;
  value: number;
  contributionPct: number;
}

export interface UnitForecastModel {
  projectedCost: number;
  projectedVolume: number;
  projectedUnitCost: number;
  lowerUnitCost: number;
  upperUnitCost: number;
  confidence: 'high' | 'medium' | 'low';
  method: string;
  assumptions: string[];
}

export interface UnitTargetModel {
  targetUnitCost: number | null;
  source: 'configured' | 'derived' | 'none';
  gapValue: number | null;
  gapPct: number | null;
  improvementNeededPct: number | null;
  impliedVolumeAtCurrentCost: number | null;
}

export interface UnitInsightModel {
  classification: 'efficient_scaling' | 'linear_scaling' | 'degrading_efficiency' | 'volatile_behavior' | 'insufficient_data';
  rootCause: string;
  riskFlags: string[];
  summary: string;
}

export interface UnitEconomicsModel {
  totalCost: number;
  previousTotalCost: number;
  directCost: number;
  sharedAllocatedCost: number;
  commitmentBenefit: number;
  totalQuantity: number;
  previousTotalQuantity: number;
  avgUnitPrice: number;
  previousAvgUnitPrice: number;
  unitPriceChangePct: number;
  unitPriceDelta: number;
  status: UnitEfficiencyStatus;
  comparisonLabel: string;
  elasticityScore: number | null;
  elasticityClass: UnitElasticityClass;
  elasticityConfidence: 'high' | 'medium' | 'low';
  volatilityPct: number;
  volatilityState: 'low' | 'medium' | 'high';
  trend: UnitTrendPoint[];
  efficiencyStatus: 'gain' | 'drop' | 'stable' | 'insufficient_data'; // legacy support
  efficiencyInsight: string;
  costGrowthPct: number;
  volumeGrowthPct: number;
  decomposition: {
    startUnitCost: number;
    endUnitCost: number;
    components: UnitDecompositionComponent[];
    validationDelta: number;
  };
  forecast: UnitForecastModel;
  target: UnitTargetModel;
  insightPanel: UnitInsightModel;
}

export interface TeamProductUnitRow {
  team: string;
  product: string;
  volume: number;
  finalCost: number;
  unitCost: number;
  deltaPct: number;
}

export interface EnvironmentUnitRow {
  environment: string;
  volume: number;
  finalCost: number;
  unitCost: number;
  deltaPct: number;
}

export interface MarginModel {
  available: boolean;
  revenuePerUnit: number | null;
  costPerUnit: number | null;
  marginPerUnit: number | null;
  marginTrendPct: number | null;
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
  allocationOverview: AllocationOverviewModel;
  coverage: CoverageModel;
  sharedPool: SharedPoolModel;
  sharedPoolTransparency: SharedPoolTransparencyRow[];
  unallocatedInsight: UnallocatedInsightModel;
  showbackRows: ShowbackRow[];
  teamProductUnitRows: TeamProductUnitRow[];
  environmentUnitRows: EnvironmentUnitRow[];
  margin: MarginModel;
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
