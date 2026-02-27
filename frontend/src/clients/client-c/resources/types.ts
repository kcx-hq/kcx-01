import type { Dispatch, SetStateAction } from "react";
import type { ApiClient, Capabilities } from "../../../services/apiClient";

export interface ResourceInventoryFilters {
  provider: string;
  service: string;
  region: string;
  uploadId?: string;
}

export interface ResourceInventoryItem {
  id: string;
  service: string;
  status: "Active" | "Zombie" | "Spiking" | "New" | string;
  region: string;
  department?: string;
  totalCost?: number;
  [key: string]: unknown;
}

export interface ResourceInventoryStats {
  total?: number;
  zombieCount?: number;
  untaggedCount?: number;
  spikingCount?: number;
  availableServices?: string[];
  [key: string]: unknown;
}

export interface ResourceInventoryData {
  inventory: ResourceInventoryItem[];
  stats: ResourceInventoryStats;
}

export interface ResourceInventoryPayload {
  success?: boolean;
  data?: ResourceInventoryData;
  error?: string;
}

export interface ResourceInventoryProps {
  api: ApiClient | null;
  caps: Capabilities | null;
}

export interface ResourceInventoryViewProps {
  api: ApiClient | null;
  caps: Capabilities | null;
  filters: ResourceInventoryFilters;
  onFilterChange: (next: Partial<ResourceInventoryFilters>) => void;
  onReset: () => void;
  loading: boolean;
  isFiltering: boolean;
  resourceData: ResourceInventoryData | null;
  extractedData: ResourceInventoryData | null;
  isEmptyState: boolean;
  error: string | null;
}

export interface UseClientCResourceInventoryDataResult {
  data: ResourceInventoryData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export interface ApiLikeError {
  code?: string;
  name?: string;
  message?: string;
}

export interface CountDatum {
  name: string;
  value: number;
}

export interface ChartColors {
  services: string[];
  status: string[];
  departments: string[];
}
