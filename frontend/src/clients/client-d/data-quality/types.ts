import type { Dispatch, ReactNode, SetStateAction } from "react";
import type { ApiClient, Capabilities } from "../../../services/apiClient";
import type { DashboardFilters } from "../../../core-dashboard/dashboard/types";
import type {
  DataQualityComplianceItem,
  DataQualityIssueRow as CoreDataQualityIssueRow,
  DataQualityStats as CoreDataQualityStats,
} from "../../../core-dashboard/data-quality/types";

export type DataQualityTab = "overview" | "untagged" | "missingMeta" | "anomalies";

export type DataQualityIssueRow = CoreDataQualityIssueRow;

export interface TagDimensionStat {
  pctPresent?: number;
  missingCount?: number;
  missingCost?: number;
  presentCount?: number;
}

export interface TopOffender {
  name?: string;
  count?: number;
  cost?: number;
}

export interface TrendPoint {
  date?: string;
  score: number;
}

export interface DataQualityBuckets {
  untagged: DataQualityIssueRow[];
  missingMeta: DataQualityIssueRow[];
  anomalies: DataQualityIssueRow[];
  all: DataQualityIssueRow[];
  [key: string]: DataQualityIssueRow[];
}

export interface DataQualityStats extends CoreDataQualityStats {
  buckets: DataQualityBuckets;
  compliance: DataQualityComplianceItem[];
  tagDimensions: Record<string, TagDimensionStat>;
  trendData: TrendPoint[];
  topOffenders: TopOffender[];
}

export interface DataQualityProps {
  filters: DashboardFilters;
  api: ApiClient | null;
  caps: Capabilities | null;
}

export interface UseDataQualityParams {
  filters: DashboardFilters;
  api: ApiClient | null;
  caps: Capabilities | null;
}

export interface UseDataQualityResult {
  loading: boolean;
  stats: DataQualityStats | null;
  error: string | null;
}

export interface DataQualityViewProps {
  loading: boolean;
  error: string | null;
  stats: DataQualityStats | null;
  activeTab: DataQualityTab;
  currentPage: number;
  totalPages: number;
  actualTotalPages: number;
  accessiblePages: number;
  itemsPerPage: number;
  selectedIssue: DataQualityIssueRow | null;
  setSelectedIssue: Dispatch<SetStateAction<DataQualityIssueRow | null>>;
  isLocked: boolean;
  isAccessingPremiumPage: boolean;
  currentListData: DataQualityIssueRow[];
  onTabChange: (tabId: DataQualityTab) => void;
  onRowClick: (row: DataQualityIssueRow) => void;
  onPrev: () => void;
  onNext: () => void;
  maxAllowedPage: number;
}

export interface PanelProps {
  title: string;
  children: ReactNode;
  right?: ReactNode;
}

export interface StatChipProps {
  label: string;
  value: string;
  sub?: string | undefined;
}

export interface DataQualityPayload {
  score?: number;
  totalRows?: number;
  costAtRisk?: number;
  compliance?: DataQualityComplianceItem[];
  buckets?: Partial<DataQualityBuckets>;
  tagDimensions?: Record<string, TagDimensionStat>;
  trendData?: TrendPoint[];
  topOffenders?: TopOffender[];
}

export interface DataQualityEnvelope {
  success?: boolean;
  data?: DataQualityPayload | null;
}

export interface ApiLikeError {
  code?: string;
  name?: string;
  message?: string;
}
