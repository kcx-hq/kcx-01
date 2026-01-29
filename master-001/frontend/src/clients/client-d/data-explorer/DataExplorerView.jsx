// frontend/clients/client-d/dashboards/overview/data-explorer/DataExplorerView.jsx
import React, { useCallback } from "react";
import DataExplorerStates from "../../../core-dashboard/data-explorer/components/DataExplorerStates.jsx";
import DetailPanel from "../../../core-dashboard/data-explorer/components/DetailPanel.jsx";
import { downloadCsvFromBackend } from "../../../core-dashboard/data-explorer/utils/downloadCsvFromBackend.js";

import HeaderBar from "./components/HeaderBar.jsx";
import TableView from "./components/TableView.jsx";
import PivotView from "./components/PivotView.jsx";
import ColumnsDrawer from "./components/ColumnDrawer.jsx";

const DataExplorerView = (props) => {
  const {
    // meta
    api,
    caps,
    loading,
    isInitialLoad,
    isFiltering,
    data,
    totalPages,

    // state
    selectedRow,
    setSelectedRow,
    viewMode,

    // export inputs
    filters,
    currentPage,
    rowsPerPage,
    sortConfig,
  } = props;

  // initial loader
  if (loading && isInitialLoad && (!data || data.length === 0)) {
    return <DataExplorerStates type="loading" />;
  }

  // empty
  if (!loading && (!data || data.length === 0)) {
    return <DataExplorerStates type="empty" />;
  }

  const onExportCsv = useCallback(async () => {
    await downloadCsvFromBackend({
      api,
      caps,
      moduleKey: "overview",
      endpointKey: "exportCsv",
      filters,
      currentPage,
      rowsPerPage,
      sortConfig,
      filenamePrefix: "client-d-data-explorer",
    });
  }, [api, caps, filters, currentPage, rowsPerPage, sortConfig]);

  return (
    <div className="w-full h-[calc(100vh-140px)] rounded-2xl border border-white/10 bg-[#0f0f11] shadow-2xl overflow-hidden relative">
      <HeaderBar {...props} onExportCsv={onExportCsv} />

      {/* BODY */}
      <div className="h-[calc(100%-230px)] bg-[#0f0f11] relative">
        <div className="h-full p-4">
          <div className="h-full rounded-2xl border border-white/10 bg-[#121319] overflow-hidden">
            {viewMode === "table" ? (
              <TableView {...props} totalPages={totalPages} />
            ) : (
              <PivotView {...props} />
            )}
          </div>
        </div>
      </div>

      <DetailPanel
        selectedRow={selectedRow}
        setSelectedRow={setSelectedRow}
        allColumns={props.allColumns}
      />

      <ColumnsDrawer
        open={!!props.showColumnMenu}
        onClose={() => props.setShowColumnMenu(false)}
        allColumns={props.allColumns || []}
        hiddenColumns={props.hiddenColumns || []}
        toggleColumn={props.toggleColumn}
        searchTerm={props.searchTerm}
      />
    </div>
  );
};

export default DataExplorerView;
