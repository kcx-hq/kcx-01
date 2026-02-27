import type { ChangeEvent, ComponentType, Dispatch, SetStateAction } from "react";
import type { ApiClient, Capabilities } from "../../../services/apiClient";
import type { DashboardFilters } from "../../../core-dashboard/dashboard/types";
import type {
  DataExplorerGroupedItem as CoreDataExplorerGroupedItem,
  DataExplorerQuickStats as CoreDataExplorerQuickStats,
  DataExplorerRow as CoreDataExplorerRow,
  DataExplorerSortConfig as CoreDataExplorerSortConfig,
} from "../../../core-dashboard/data-explorer/types";

export type DataExplorerRow = CoreDataExplorerRow;
export type DataExplorerQuickStats = CoreDataExplorerQuickStats;
export type DataExplorerSortConfig = CoreDataExplorerSortConfig;
export type DataExplorerGroupedItem = CoreDataExplorerGroupedItem;

export type DataExplorerViewMode = "table" | "pivot";
export type DataExplorerDensity = "compact" | "standard" | "comfortable";
export type ColumnFilters = Record<string, string>;
export type SummaryData = Record<string, number | string | undefined>;
export type ColumnMaxValues = Record<string, number>;

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
  columnFilters: ColumnFilters;
}

export interface UseDataExplorerDataResult {
  loading: boolean;
  isInitialLoad: boolean;
  isFiltering: boolean;
  data: DataExplorerRow[];
  totalCount: number;
  allColumns: string[];
  quickStats: DataExplorerQuickStats | null;
  summaryData: SummaryData;
  columnMaxValues: ColumnMaxValues;
}

export interface DataExplorerPayload {
  success?: boolean;
  data?: DataExplorerRow[];
  pagination?: {
    total?: number;
  };
  allColumns?: string[];
  quickStats?: DataExplorerQuickStats | null;
  summaryData?: SummaryData;
  columnMaxValues?: ColumnMaxValues;
}

export interface DataExplorerEnvelope {
  success?: boolean;
  data?: DataExplorerPayload | null;
}

export interface DataExplorerViewProps {
  api: ApiClient | null;
  caps: Capabilities | null;
  loading: boolean;
  isInitialLoad: boolean;
  isFiltering: boolean;
  data: DataExplorerRow[];
  totalCount: number;
  allColumns: string[];
  quickStats: DataExplorerQuickStats | null;
  summaryData: SummaryData;
  columnMaxValues: ColumnMaxValues;
  totalPages: number;
  isLocked: boolean;
  searchTerm: string;
  setSearchTerm: Dispatch<SetStateAction<string>>;
  selectedRow: DataExplorerRow | null;
  setSelectedRow: Dispatch<SetStateAction<DataExplorerRow | null>>;
  sortConfig: DataExplorerSortConfig;
  setSortConfig: Dispatch<SetStateAction<DataExplorerSortConfig>>;
  filterInputs: ColumnFilters;
  setFilterInputs: Dispatch<SetStateAction<ColumnFilters>>;
  columnFilters: ColumnFilters;
  showFilterRow: boolean;
  setShowFilterRow: Dispatch<SetStateAction<boolean>>;
  hiddenColumns: string[];
  showColumnMenu: boolean;
  setShowColumnMenu: Dispatch<SetStateAction<boolean>>;
  currentPage: number;
  setCurrentPage: Dispatch<SetStateAction<number>>;
  rowsPerPage: number;
  setRowsPerPage: Dispatch<SetStateAction<number>>;
  density: DataExplorerDensity;
  setDensity: Dispatch<SetStateAction<DataExplorerDensity>>;
  showDataBars: boolean;
  setShowDataBars: Dispatch<SetStateAction<boolean>>;
  selectedIndices: Set<number>;
  setSelectedIndices: Dispatch<SetStateAction<Set<number>>>;
  viewMode: DataExplorerViewMode;
  setViewMode: Dispatch<SetStateAction<DataExplorerViewMode>>;
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

export interface HeaderBarProps extends DataExplorerViewProps {
  onExportCsv: () => Promise<void>;
}

export interface TableViewProps {
  visibleColumns: string[];
  tableDataToRender: DataExplorerRow[];
  columnMaxValues: ColumnMaxValues;
  summaryData: SummaryData;
  searchTerm: string;
  sortConfig: DataExplorerSortConfig;
  setSortConfig: Dispatch<SetStateAction<DataExplorerSortConfig>>;
  showFilterRow: boolean;
  filterInputs: ColumnFilters;
  setFilterInputs: Dispatch<SetStateAction<ColumnFilters>>;
  showDataBars: boolean;
  selectedIndices: Set<number>;
  setSelectedIndices: Dispatch<SetStateAction<Set<number>>>;
  currentPage: number;
  setCurrentPage: Dispatch<SetStateAction<number>>;
  rowsPerPage: number;
  setRowsPerPage: Dispatch<SetStateAction<number>>;
  totalPages: number;
  getColumnWidth: (index: number) => number;
  getRowHeight: () => string;
  handleRowSelect: (globalIndex: number) => void;
  handleRowClick: (row: DataExplorerRow) => void;
}

export interface PivotViewProps {
  isLocked: boolean;
  groupByCol: string | null;
  clientSideGroupedData: DataExplorerGroupedItem[];
  handleDrillDown: (group: DataExplorerGroupedItem) => void;
}

export interface ColumnDrawerProps {
  open: boolean;
  onClose: () => void;
  allColumns: string[];
  hiddenColumns: string[];
  toggleColumn: (col: string) => void;
  searchTerm: string;
}

export interface StatCardProps {
  icon: ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string | number;
  locked: boolean;
}

export type ExplorerInputChange = ChangeEvent<HTMLInputElement>;
export type ExplorerSelectChange = ChangeEvent<HTMLSelectElement>;

export interface ApiLikeError {
  code?: string;
  name?: string;
  message?: string;
}
