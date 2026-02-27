import type { Dispatch, SetStateAction } from "react";
import type { ChangeEvent } from "react";
import type { ApiClient, Capabilities } from "../../services/apiClient";
import type { DashboardFilters } from "../dashboard/types";

export type SortDirection = "asc" | "desc";

export interface DataExplorerSortConfig {
  key: string | null;
  direction: SortDirection;
}

export type ExplorerCell = string | number | boolean | null | undefined;

export interface DataExplorerRow {
  [key: string]: ExplorerCell | unknown;
}

export interface DataExplorerQuickStats {
  totalCost: number;
  avgCost: number;
}

export interface DataExplorerGroupedItem {
  name: string;
  rawValue: ExplorerCell;
  count: number;
  totalCost: number;
  percent: number;
}

export interface DataExplorerProps {
  filters?: DashboardFilters;
  api: ApiClient | null;
  caps: Capabilities | null;
}

export interface UseDataExplorerDataParams {
  api: ApiClient | null;
  caps: Capabilities | null;
  filters: DashboardFilters;
  currentPage: number;
  rowsPerPage: number;
  sortConfig: DataExplorerSortConfig;
  columnFilters: Record<string, string>;
}

export interface UseDataExplorerDataResult {
  loading: boolean;
  isInitialLoad: boolean;
  isFiltering: boolean;
  isPaginating: boolean;
  data: DataExplorerRow[];
  totalCount: number;
  allColumns: string[];
  quickStats: DataExplorerQuickStats | null;
  summaryData: Record<string, number | string | undefined>;
  columnMaxValues: Record<string, number>;
}

export interface UseClientSideSortParams {
  data: DataExplorerRow[];
  sortConfig: DataExplorerSortConfig;
}

export interface UseClientSideGroupingParams {
  data: DataExplorerRow[];
  groupByCol: string | null;
  allColumns: string[];
}

export interface DataExplorerViewProps {
  api: ApiClient | null;
  caps: Capabilities | null;
  loading: boolean;
  isInitialLoad: boolean;
  isFiltering: boolean;
  isPaginating: boolean;
  data: DataExplorerRow[];
  totalCount: number;
  allColumns: string[];
  quickStats: DataExplorerQuickStats | null;
  summaryData: Record<string, number | string | undefined>;
  columnMaxValues: Record<string, number>;
  totalPages: number;
  isLocked: boolean;
  searchTerm: string;
  setSearchTerm: Dispatch<SetStateAction<string>>;
  selectedRow: DataExplorerRow | null;
  setSelectedRow: Dispatch<SetStateAction<DataExplorerRow | null>>;
  sortConfig: DataExplorerSortConfig;
  setSortConfig: Dispatch<SetStateAction<DataExplorerSortConfig>>;
  filterInputs: Record<string, string>;
  setFilterInputs: Dispatch<SetStateAction<Record<string, string>>>;
  columnFilters: Record<string, string>;
  showFilterRow: boolean;
  setShowFilterRow: Dispatch<SetStateAction<boolean>>;
  hiddenColumns: string[];
  showColumnMenu: boolean;
  setShowColumnMenu: Dispatch<SetStateAction<boolean>>;
  currentPage: number;
  setCurrentPage: Dispatch<SetStateAction<number>>;
  rowsPerPage: number;
  setRowsPerPage: Dispatch<SetStateAction<number>>;
  density: string;
  setDensity: Dispatch<SetStateAction<string>>;
  showDataBars: boolean;
  setShowDataBars: Dispatch<SetStateAction<boolean>>;
  selectedIndices: Set<number>;
  setSelectedIndices: Dispatch<SetStateAction<Set<number>>>;
  viewMode: "table" | "pivot";
  setViewMode: Dispatch<SetStateAction<"table" | "pivot">>;
  groupByCol: string | null;
  setGroupByCol: Dispatch<SetStateAction<string | null>>;
  visibleColumns: string[];
  tableDataToRender: DataExplorerRow[];
  clientSideGroupedData: DataExplorerGroupedItem[];
  getRowHeight: () => string;
  getColumnWidth: (index: number) => number;
  toggleColumn: (col: string) => void;
  handleRowSelect: (globalIndex: number) => void;
  handleRowClick: (row: DataExplorerRow) => void;
  removeFilter: (key: string) => void;
  resetFilters: () => void;
  handleDrillDown: (group: DataExplorerGroupedItem) => void;
  filters: DashboardFilters;
}

export interface TableRowProps {
  row: DataExplorerRow;
  rIdx: number;
  globalIndex: number;
  isSelected: boolean;
  visibleColumns: string[];
  columnMaxValues: Record<string, number>;
  showDataBars: boolean;
  getRowHeight: () => string;
  onSelect: () => void;
  onRowClick: () => void;
}

export interface DetailPanelProps {
  selectedRow: DataExplorerRow | null;
  setSelectedRow: Dispatch<SetStateAction<DataExplorerRow | null>>;
  allColumns: string[];
}

export interface DataExplorerStatesProps {
  type: "loading" | "empty";
}

export interface DownloadCsvFromBackendParams {
  api: ApiClient | null;
  caps: Capabilities | null;
  moduleKey?: string;
  endpointKey?: string;
  filters: DashboardFilters;
  currentPage: number;
  rowsPerPage: number;
  sortConfig: DataExplorerSortConfig;
  selectedIndices?: Set<number>;
  filenamePrefix?: string;
}

export type ExplorerInputChange = ChangeEvent<HTMLInputElement>;
export type ExplorerSelectChange = ChangeEvent<HTMLSelectElement>;

export interface ApiLikeError {
  code?: string;
  name?: string;
  message?: string;
}
