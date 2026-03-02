import type { ChangeEvent, Dispatch, SetStateAction } from "react";
import type { LucideIcon } from "lucide-react";
import type { ApiClient, Capabilities } from "../../services/apiClient";
import type { DashboardFilters } from "../dashboard/types";

export type ResourceStatus = "Active" | "Spiking" | "Zombie" | "New" | string;
export type ResourceTab = "all" | "zombie" | "untagged" | "spiking";
export type ResourceGrouping = "none" | "service" | "region";
export type KpiTone = "neutral" | "warning" | "critical" | "info";
export type PremiumOverlayVariant = "card" | "inlineBadge" | "full";
export type ResourceTagValue = string | number | boolean | null | undefined;

export interface ResourceItem {
  id: string;
  service?: string;
  region?: string;
  status?: ResourceStatus;
  totalCost?: number;
  hasTags?: boolean;
  tags?: Record<string, ResourceTagValue>;
  trend?: number[];
  [key: string]: unknown;
}

export interface ResourceStats {
  total: number;
  totalCost: number;
  zombieCount: number;
  zombieCost: number;
  untaggedCount: number;
  untaggedCost: number;
  spikingCount: number;
  spikingCost: number;
}

export interface ResourceGroup {
  items: ResourceItem[];
  total: number;
}

export type GroupedResources = Record<string, ResourceGroup>;

export interface ResourceInventoryProps {
  filters: DashboardFilters;
  api: ApiClient | null;
  caps: Capabilities | null;
}

export interface UseResourceInventoryDataParams {
  filters: DashboardFilters;
  api: ApiClient | null;
  caps: Capabilities | null;
}

export interface ResourceInventoryPayload {
  inventory?: ResourceItem[];
  stats?: Partial<ResourceStats>;
}

export interface UseResourceInventoryDataResult {
  loading: boolean;
  refreshing: boolean;
  inventory: ResourceItem[];
  stats: ResourceStats;
}

export interface UseFilteredResourcesParams {
  inventory: ResourceItem[];
  searchTerm: string;
  activeTab: ResourceTab;
}

export interface UseGroupedResourcesParams {
  filteredData: ResourceItem[];
  grouping: ResourceGrouping;
}

export interface UseFlaggedResourcesResult {
  flaggedResources: Set<string>;
  toggleFlag: (resourceId: string) => void;
}

export interface ExportResourceInventoryCsvParams {
  activeTab: ResourceTab;
  filteredData: ResourceItem[];
  flaggedResources: Set<string>;
}

export interface ResourceInventoryViewProps {
  loading: boolean;
  refreshing: boolean;
  isPremiumMasked: boolean;
  searchTerm: string;
  activeTab: ResourceTab;
  grouping: ResourceGrouping;
  selectedResource: ResourceItem | null;
  stats: ResourceStats;
  filteredData: ResourceItem[];
  groupedData: GroupedResources;
  inventory: ResourceItem[];
  flaggedResources: Set<string>;
  onExportCSV: () => void;
  setSearchTerm: Dispatch<SetStateAction<string>>;
  setActiveTab: Dispatch<SetStateAction<ResourceTab>>;
  setGrouping: Dispatch<SetStateAction<ResourceGrouping>>;
  setSelectedResource: Dispatch<SetStateAction<ResourceItem | null>>;
  onToggleFlag: (resourceId: string) => void;
}

export interface ResourceTableProps {
  rows: ResourceItem[];
  isPremiumMasked: boolean;
  onRowClick: (resource: ResourceItem) => void;
  flaggedResources: Set<string>;
}

export interface GroupedListProps {
  groupedData: GroupedResources;
  isPremiumMasked: boolean;
  onRowClick: (resource: ResourceItem) => void;
}

export interface InspectorDrawerProps {
  selectedResource: ResourceItem | null;
  onClose: () => void;
  flaggedResources: Set<string>;
  onToggleFlag: (resourceId: string) => void;
}

export interface KpiCardToneStyle {
  icon: string;
  active: string;
}

export type KpiCardToneStyles = Record<KpiTone, KpiCardToneStyle>;

export interface KpiCardProps {
  title: string;
  count: number;
  cost: number;
  icon: LucideIcon;
  tone?: KpiTone;
  isActive: boolean;
  onClick: () => void;
  label: string;
}

export interface PremiumOverlayProps {
  variant?: PremiumOverlayVariant;
}

export interface SparklineProps {
  data?: number[] | undefined;
  color?: string | undefined;
}

export interface StatusBadgeProps {
  status?: ResourceStatus | undefined;
}

export interface ZombieListProps {
  data: ResourceItem[];
  onInspect: (resource: ResourceItem) => void;
}

export type ResourceInputChange = ChangeEvent<HTMLInputElement>;

export interface ApiLikeError {
  code?: string;
  name?: string;
  message?: string;
}
