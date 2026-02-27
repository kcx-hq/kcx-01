import type { ChangeEvent, Dispatch, SetStateAction } from "react";
import type { ApiClient, ApiCallOptions, Capabilities } from "../../../services/apiClient";
import type { DashboardFilters } from "../../../core-dashboard/dashboard/types";
import type {
  DataExplorerGroupedItem,
  DataExplorerQuickStats,
  DataExplorerRow,
  DataExplorerSortConfig,
} from "../../../core-dashboard/data-explorer/types";

export type { DataExplorerGroupedItem, DataExplorerQuickStats, DataExplorerRow, DataExplorerSortConfig };

export interface ClientCDataExplorerFilters extends DashboardFilters {
  department?: string;
}

export interface ClientCDataExplorerProps {
  filters?: ClientCDataExplorerFilters;
  api: ApiClient | null;
  caps: Capabilities | null;
  uploadId?: string | null | undefined;
}

export type ClientCExplorerViewMode = "table" | "pivot";
export type ClientCColumnFilters = Record<string, string>;
export type ClientCSummaryData = Record<string, number | string | undefined>;
export type ClientCColumnMaxValues = Record<string, number>;
export type ClientCDepartmentBreakdownItem = Record<string, unknown>;

export interface ClientCGroupedRow extends DataExplorerRow {
  __group: string;
  __count: number;
  __rawValue: unknown;
  __children: DataExplorerRow[];
  rawValue?: unknown;
}

export interface ClientCDataExplorerPayload {
  data?: DataExplorerRow[];
  records?: DataExplorerRow[];
  total?: number;
  totalCount?: number;
  allColumns?: string[];
  columns?: string[];
  quickStats?: DataExplorerQuickStats | null;
  summaryData?: ClientCSummaryData;
  columnMaxValues?: ClientCColumnMaxValues;
  departmentBreakdown?: ClientCDepartmentBreakdownItem[];
  availableDepartments?: string[];
  pagination?: {
    totalPages?: number;
  };
  totalPages?: number;
}

export interface ClientCDataExplorerApiResponse {
  success?: boolean;
  data?: ClientCDataExplorerPayload;
}

export interface ClientCUseDataExplorerDataParams {
  api: ApiClient | null;
  caps: Capabilities | null;
  filters: ClientCDataExplorerFilters;
  currentPage: number;
  rowsPerPage: number;
  sortConfig: DataExplorerSortConfig;
  columnFilters: ClientCColumnFilters;
  uploadId?: string | null | undefined;
}

export interface ClientCUseDataExplorerDataResult {
  loading: boolean;
  isInitialLoad: boolean;
  isFiltering: boolean;
  data: DataExplorerRow[];
  totalCount: number;
  allColumns: string[];
  quickStats: DataExplorerQuickStats | null;
  summaryData: ClientCSummaryData;
  columnMaxValues: ClientCColumnMaxValues;
  departmentBreakdown: ClientCDepartmentBreakdownItem[];
  availableDepartments: string[];
}

export interface ClientCDataExplorerViewProps {
  api: ApiClient | null;
  caps: Capabilities | null;
  loading: boolean;
  isInitialLoad: boolean;
  isFiltering: boolean;
  data: DataExplorerRow[];
  totalCount: number;
  allColumns: string[];
  quickStats: DataExplorerQuickStats | null;
  summaryData: ClientCSummaryData;
  columnMaxValues: ClientCColumnMaxValues;
  departmentBreakdown: ClientCDepartmentBreakdownItem[];
  availableDepartments: string[];
  totalPages: number;
  searchTerm: string;
  setSearchTerm: Dispatch<SetStateAction<string>>;
  selectedRow: DataExplorerRow | null;
  setSelectedRow: Dispatch<SetStateAction<DataExplorerRow | null>>;
  sortConfig: DataExplorerSortConfig;
  setSortConfig: Dispatch<SetStateAction<DataExplorerSortConfig>>;
  filterInputs: ClientCColumnFilters;
  setFilterInputs: Dispatch<SetStateAction<ClientCColumnFilters>>;
  columnFilters: ClientCColumnFilters;
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
  viewMode: ClientCExplorerViewMode;
  setViewMode: Dispatch<SetStateAction<ClientCExplorerViewMode>>;
  groupByCol: string | null;
  setGroupByCol: Dispatch<SetStateAction<string | null>>;
  visibleColumns: string[];
  tableDataToRender: DataExplorerRow[];
  clientSideGroupedData: ClientCGroupedRow[];
  getRowHeight: () => string;
  getColumnWidth: (index: number) => number;
  toggleColumn: (col: string) => void;
  handleRowSelect: (globalIndex: number) => void;
  handleRowClick: (row: DataExplorerRow) => void;
  removeFilter: (key: string) => void;
  resetFilters: () => void;
  handleDrillDown: (group: ClientCGroupedRow) => void;
  filters: ClientCDataExplorerFilters;
  uploadId?: string | null | undefined;
}

export interface ClientCTableRowProps {
  row: DataExplorerRow;
  rowIndex: number;
  visibleColumns: string[];
  selectedIndices: Set<number>;
  handleRowSelect: (rowIndex: number) => void;
  handleRowClick: (row: DataExplorerRow) => void;
  getRowHeight: () => string;
  getColumnWidth: (index: number) => number;
  showDataBars: boolean;
  columnMaxValues: ClientCColumnMaxValues;
}

export interface DataExplorerStatesProps {
  type: "loading" | "empty";
}

export interface DownloadCsvFromBackendParams {
  api: ApiClient | null;
  caps: Capabilities | null;
  filters: ClientCDataExplorerFilters;
  currentPage: number;
  rowsPerPage: number;
  sortConfig: DataExplorerSortConfig;
  selectedIndices: Set<number>;
  visibleColumns: string[];
  uploadId?: string | null | undefined;
}

export type ClientCApiCallOptions = ApiCallOptions & {
  signal?: AbortSignal;
};

export type ExplorerInputChange = ChangeEvent<HTMLInputElement>;

export interface ApiLikeError {
  code?: string;
  name?: string;
  message?: string;
}
