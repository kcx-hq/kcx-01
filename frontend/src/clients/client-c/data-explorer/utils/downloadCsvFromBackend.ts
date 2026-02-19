// frontend/clients/client-c/data-explorer/utils/downloadCsvFromBackend.js
export async function downloadCsvFromBackend({
  api,
  caps,
  filters,
  currentPage,
  rowsPerPage,
  sortConfig,
  selectedIndices,
  visibleColumns,
  uploadId
}) {
  try {
    if (!api || !caps) {
      alert("API not available");
      return;
    }

    const blob = await api.call("dataExplorer", "exportCsv", {
      params: {
        provider: filters?.provider !== "All" ? filters.provider : undefined,
        service: filters?.service !== "All" ? filters.service : undefined,
        region: filters?.region !== "All" ? filters.region : undefined,
        page: currentPage,
        limit: rowsPerPage,
        sortBy: sortConfig?.key || undefined,
        sortOrder: sortConfig?.direction || "asc",
        selectedIndices: selectedIndices.size > 0 ? JSON.stringify(Array.from(selectedIndices)) : undefined,
        visibleColumns: visibleColumns?.length > 0 ? JSON.stringify(visibleColumns) : undefined,
        uploadId: uploadId
      },
      responseType: "blob",
    });

    if (!blob) return;

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ClientC_DataExplorer_Export_${new Date().toISOString()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error downloading CSV:", error);
    alert("Failed to export CSV. Please try again.");
  }
}