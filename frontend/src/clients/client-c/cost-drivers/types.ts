import type { Dispatch, SetStateAction } from "react";
import type { ApiClient, Capabilities } from "../../../services/apiClient";

export type DriverType = "inc" | "dec";
export type SortListBy = "diff" | "pct" | string;
export type NumericLike = number | string;

export interface ApiLikeError {
  code?: string;
  name?: string;
  message?: string;
}

export interface DriverPeriods {
  prev?: string | Date | null;
  current?: string | Date | null;
  [key: string]: unknown;
}

export interface DriverStats {
  previousValue?: number;
  currentValue?: number;
  contribution?: number;
  [key: string]: unknown;
}

export interface CostDriverItem {
  id?: string;
  name?: string;
  serviceName?: string;
  driverName?: string;
  description?: string;
  diff?: number;
  pct?: number;
  change?: number;
  previousValue?: number;
  currentValue?: number;
  absoluteChange?: number;
  percentChange?: number;
  impactPercentage?: number;
  value?: number;
  type?: string;
  _driverType?: DriverType;
  [key: string]: unknown;
}

export interface DriverOverallStats {
  diff?: number;
  pct?: number;
  totalIncreases?: number;
  totalDecreases?: number;
  previousValue?: number;
  currentValue?: number;
  [key: string]: unknown;
}

export interface CostDriversDataState {
  loading: boolean;
  isRefreshing: boolean;
  errorMessage: string | null;
  increases: CostDriverItem[];
  decreases: CostDriverItem[];
  overallStats: DriverOverallStats | null;
  periods: DriverPeriods | null;
  availableServices: string[];
}

export interface UseClientCCostDriversDataParams {
  api: ApiClient | null;
  caps: Capabilities | null;
  period: number;
  dimension: string;
  minChange: number;
  debouncedPeriod: number;
  debouncedDimension: string;
  debouncedMinChange: number;
}

export interface UseClientCCostDriversDataResult extends CostDriversDataState {
  refresh: () => Promise<void>;
}

export interface UseClientCDriverDetailsParams {
  api: ApiClient | null;
  caps: Capabilities | null;
  driver: CostDriverItem | null;
  uploadId?: string;
  period: number;
}

export interface DriverDetailsState {
  loading: boolean;
  errorMessage: string | null;
  stats: DriverStats | null;
}

export interface ClientCCostDriversProps {
  api: ApiClient | null;
  caps: Capabilities | null;
}

export interface ClientCCostDriversViewProps {
  api: ApiClient | null;
  caps: Capabilities | null;
  period: number;
  setPeriod: Dispatch<SetStateAction<number>>;
  dimension: string;
  minChange: number;
  showTreeMap: boolean;
  setShowTreeMap: Dispatch<SetStateAction<boolean>>;
  selectedDriver: CostDriverItem | null;
  setSelectedDriver: Dispatch<SetStateAction<CostDriverItem | null>>;
  onSelectDriver: (driver: CostDriverItem, driverType: DriverType) => void;
  onBack: () => void;
  sortListBy: SortListBy;
  setSortListBy: Dispatch<SetStateAction<SortListBy>>;
  loading: boolean;
  isRefreshing: boolean;
  errorMessage: string | null;
  increases: CostDriverItem[];
  decreases: CostDriverItem[];
  filteredIncreases: CostDriverItem[];
  filteredDecreases: CostDriverItem[];
  overallStats: DriverOverallStats | null;
  periods: DriverPeriods | null;
  availableServices: string[];
  details: DriverDetailsState;
  refresh?: () => Promise<void>;
}

export interface ClientCDriversListProps {
  title: string;
  items: CostDriverItem[];
  type: DriverType;
  onSelect: (driver: CostDriverItem, driverType: DriverType) => void;
  sortBy: SortListBy;
}

export interface ClientCVarianceBridgeProps {
  overallStats: DriverOverallStats | null;
}

export interface ClientCDriverDetailsDrawerProps {
  driver: CostDriverItem | null;
  period: number;
  onBack: () => void;
  isSavingsDriver: boolean;
  loadingDetails: boolean;
  stats: DriverStats | null;
}

export interface LegacyDriversListProps {
  drivers: CostDriverItem[];
  onDriverSelect: (driver: CostDriverItem) => void;
  selectedDriver: CostDriverItem | null;
}

export interface LegacyVarianceBridgeData {
  previousValue?: number;
  currentValue?: number;
  increases: CostDriverItem[];
  decreases: CostDriverItem[];
}

export interface LegacyVarianceBridgeProps {
  data: LegacyVarianceBridgeData | null;
}

export interface DynamicFilterOptions {
  providers: string[];
  services: string[];
  regions: string[];
  groupBy: string[];
}
