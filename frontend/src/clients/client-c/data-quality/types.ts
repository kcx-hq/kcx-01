import type { ApiClient, Capabilities } from "../../../services/apiClient";

export type QualitySeverity = "high" | "medium" | "low";

export interface ApiLikeError {
  code?: string;
  name?: string;
  message?: string;
}

export interface ClientCDataQualityProps {
  api: ApiClient | null;
  caps: Capabilities | null;
}

export interface DataQualityFilters {
  provider?: string;
  service?: string;
  region?: string;
  uploadId?: string;
}

export interface DataQualityFilterOptions {
  providers: string[];
  services: string[];
  regions: string[];
}

export interface RawComplianceItem {
  key?: string;
  pct?: number;
  count?: number;
}

export interface RawBucketData {
  untagged?: unknown[];
  anomalies?: unknown[];
  all?: unknown[];
  [key: string]: unknown[] | undefined;
}

export interface RawDepartmentCompliance {
  name?: string;
  score?: number;
  missingTags?: number;
}

export interface RawTopOffender {
  name?: string;
  count?: number;
  cost?: number;
}

export interface RawTrendPoint {
  date?: string;
  score?: number;
}

export interface DataQualityRawData {
  score?: number;
  totalRows?: number;
  costAtRisk?: number;
  compliance?: RawComplianceItem[];
  buckets?: RawBucketData;
  departmentCompliance?: RawDepartmentCompliance[];
  topOffenders?: RawTopOffender[];
  trendData?: RawTrendPoint[];
  qualityData?: unknown[];
  [key: string]: unknown;
}

export interface DataQualityEnvelope {
  data?: DataQualityRawData;
  [key: string]: unknown;
}

export type DataQualityApiPayload = DataQualityRawData | DataQualityEnvelope | null;

export interface QualityMetrics {
  overallScore: number;
  totalRows: number;
  costAtRisk: number;
  complianceRate: number;
  untaggedCount: number;
  anomaliesCount: number;
  allCount: number;
  departmentCompliance: number;
  topOffendersCount: number;
  highestOffenderCost: number;
}

export interface QualityDataPoint {
  id: string;
  metric: string;
  score: number;
  description: string;
  timestamp: string;
}

export interface QualityIssue {
  id: string;
  type: string;
  count: number;
  severity: QualitySeverity;
  description: string;
  category: string;
}

export interface NormalizedDataQualityData {
  qualityData: QualityDataPoint[];
  qualityMetrics: QualityMetrics;
  qualityIssues: QualityIssue[];
  metadata: {
    isEmptyState: boolean;
  };
}

export interface ClientCDataQualityViewProps {
  api: ApiClient | null;
  caps: Capabilities | null;
  loading: boolean;
  qualityData: DataQualityApiPayload;
  extractedData: NormalizedDataQualityData;
  isEmptyState: boolean;
  dataError: string | null;
}

export interface UseClientCDataQualityDataResult {
  qualityData: DataQualityApiPayload;
  loading: boolean;
  isFiltering: boolean;
  error: string | null;
}

export interface UseClientCDataQualityFiltersResult {
  filterOptions: DataQualityFilterOptions;
  loading: boolean;
  error: string | null;
}

export interface PieTooltipFormatterPayload {
  payload?: {
    category?: string;
    payload?: {
      cost?: number;
    };
    type?: string;
  };
  value?: number;
}

export interface LegendPayloadItem {
  color?: string;
  value?: string;
  payload?: {
    type?: string;
  };
}
