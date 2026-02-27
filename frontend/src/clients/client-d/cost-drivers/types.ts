import type { ChangeEvent, Dispatch, ReactNode, SetStateAction } from "react";
import type { ApiClient, Capabilities } from "../../../services/apiClient";
import type { DashboardFilters } from "../../../core-dashboard/dashboard/types";

export interface CostDriverFilters {
  provider: string;
  service: string;
  region: string;
}

export type DriverType = "inc" | "dec";
export type SortListBy = "diff" | "pct" | string;

export interface CostDriverItem {
  id?: string;
  name?: string;
  diff: number;
  pct: number;
  prev: number;
  curr: number;
  contribution?: number;
  isNew?: boolean;
  _driverType?: DriverType;
  [key: string]: unknown;
}

export interface DriverOverallStats {
  totalCurr: number;
  totalPrev: number;
  diff: number;
  pct: number;
  totalIncreases: number;
  totalDecreases: number;
}

export interface DriverDynamics {
  newSpend: number;
  expansion: number;
  deleted: number;
  optimization: number;
}

export interface DriverPeriods {
  current: Date | null;
  prev: Date | null;
  max: Date | null;
}

export interface DriverDetailsStats {
  trendData: Array<{ date?: string; val?: number; [key: string]: unknown }>;
  subDrivers: Array<{ name?: string; value?: number; [key: string]: unknown }>;
  topResources: unknown[];
  annualizedImpact: number;
  insightText: string;
  [key: string]: unknown;
}

export interface DriverDetailsResult {
  loading: boolean;
  stats: DriverDetailsStats;
}

export interface CostDriversProps {
  filters: CostDriverFilters;
  api: ApiClient | null;
  caps: Capabilities | null;
  onFilterChange?: (partial: Partial<DashboardFilters>) => void;
}

export interface CostDriversViewProps {
  api: ApiClient | null;
  caps: Capabilities | null;
  filters?: CostDriverFilters;
  isMasked: boolean;
  period: number;
  setPeriod: Dispatch<SetStateAction<number>>;
  dimension?: string;
  minChange?: number;
  activeServiceFilter: string;
  setActiveServiceFilter: Dispatch<SetStateAction<string>>;
  showTreeMap: boolean;
  setShowTreeMap: Dispatch<SetStateAction<boolean>>;
  selectedDriver: CostDriverItem | null;
  setSelectedDriver: Dispatch<SetStateAction<CostDriverItem | null>>;
  onSelectDriver: (driver: CostDriverItem, driverType: DriverType) => void;
  onBack: () => void;
  sortListBy: SortListBy;
  setSortListBy?: Dispatch<SetStateAction<SortListBy>>;
  loading: boolean;
  isRefreshing: boolean;
  errorMessage: string | null;
  increases: CostDriverItem[];
  decreases: CostDriverItem[];
  filteredIncreases: CostDriverItem[];
  filteredDecreases: CostDriverItem[];
  overallStats: DriverOverallStats;
  dynamics: DriverDynamics;
  periods: DriverPeriods;
  availableServices: string[];
  details: DriverDetailsResult;
}

export interface CostDriversHeaderProps {
  isMasked: boolean;
  period: number;
  setPeriod: Dispatch<SetStateAction<number>>;
  activeServiceFilter: string;
  setActiveServiceFilter: Dispatch<SetStateAction<string>>;
  availableServices: string[];
  showTreeMap: boolean;
  setShowTreeMap: Dispatch<SetStateAction<boolean>>;
  periods: DriverPeriods;
}

export interface CostDriversMessageProps {
  message: string;
}

export interface CostMapCardProps {
  showTreeMap: boolean;
  increases: CostDriverItem[];
  decreases: CostDriverItem[];
}

export interface DynamicsCardProps {
  showTreeMap: boolean;
  setShowTreeMap: Dispatch<SetStateAction<boolean>>;
  increases: CostDriverItem[];
  decreases: CostDriverItem[];
  dynamics: DriverDynamics;
}

export interface MetricProps {
  label: string;
  icon: ReactNode;
  tone: string;
  value: string;
}

export interface NetVarianceCardProps {
  overallStats: DriverOverallStats;
}

export type SelectChangeEvent = ChangeEvent<HTMLSelectElement>;
