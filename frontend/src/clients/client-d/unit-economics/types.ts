import type { Dispatch, SetStateAction } from "react";
import type { ApiClient, Capabilities } from "../../../services/apiClient";
import type { DashboardFilters } from "../../../core-dashboard/dashboard/types";

export interface UnitEconomicsKpis {
  totalCost: number;
  totalQuantity: number;
  avgUnitPrice: number;
  unitPriceChangePct: number;
  driftDetected: boolean;
}

export interface UnitEconomicsTrendPoint {
  date?: string;
  unitPrice?: number;
  quantity?: number;
  cost?: number;
}

export interface UnitEconomicsDrift {
  baselineUnitPrice?: number;
  currentUnitPrice?: number;
  changePct?: number;
  thresholdPct?: number;
  status?: string;
}

export interface UnitEconomicsSkuItem {
  sku?: string;
  cost?: number;
  quantity?: number;
  effectiveUnitPrice?: number;
  listUnitPrice?: number;
  committed?: boolean;
}

export interface UnitEconomicsData {
  kpis: UnitEconomicsKpis;
  trend: UnitEconomicsTrendPoint[];
  drift: UnitEconomicsDrift | null;
  skuEfficiency: UnitEconomicsSkuItem[];
}

export interface UnitEconomicsProps {
  filters?: Partial<DashboardFilters>;
  api: ApiClient | null;
  caps: Capabilities | null;
}

export interface UnitEconomicsViewProps {
  isLocked: boolean;
  kpis: UnitEconomicsKpis;
  drift: UnitEconomicsDrift | null;
  trend: UnitEconomicsTrendPoint[];
  skuEfficiency: UnitEconomicsSkuItem[];
  skuSearch: string;
  setSkuSearch: Dispatch<SetStateAction<string>>;
}

export interface SkuTableProps {
  skuEfficiency: UnitEconomicsSkuItem[];
}

export interface TileProps {
  label: string;
  value: string;
  sub?: string;
}

export interface RowProps {
  left: string;
  right: string;
}

export interface DriftSummary {
  baseline: number | undefined;
  current: number | undefined;
  changePct: number | undefined;
  threshold: number | undefined;
  status: string | undefined;
}

export interface UseUnitEconomicsDataParams {
  api: ApiClient | null;
  caps: Capabilities | null;
  filters: Partial<DashboardFilters>;
}

export interface UseUnitEconomicsDataResult {
  loading: boolean;
  data: UnitEconomicsData;
  error: string | null;
}

export interface UnitEconomicsApiResponse {
  success?: boolean;
  data?: UnitEconomicsData | UnitEconomicsApiResponse | null;
}

export interface ApiLikeError {
  code?: string;
  message?: string;
}
