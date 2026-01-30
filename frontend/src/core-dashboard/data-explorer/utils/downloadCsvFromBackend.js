// frontend/shared/utils/downloadCsvFromBackend.js
export async function downloadCsvFromBackend({
  api,
  caps,
  moduleKey = "overview",
  endpointKey = "exportCsv",
  // params
  filters,
  currentPage,
  rowsPerPage,
  sortConfig,
  filenamePrefix = "data-explorer-export",
}) {
  try {
    if (!api || !caps) return;

    const endpointDef =
      caps?.modules?.[moduleKey]?.enabled &&
      caps?.modules?.[moduleKey]?.endpoints?.[endpointKey];

    if (!endpointDef) return;

    const res = await api.call(moduleKey, endpointKey, {
      params: {
        provider: filters?.provider !== "All" ? filters.provider : undefined,
        service: filters?.service !== "All" ? filters.service : undefined,
        region: filters?.region !== "All" ? filters.region : undefined,
        page: currentPage,
        limit: rowsPerPage,
        sortBy: sortConfig?.key || undefined,
        sortOrder: sortConfig?.direction || "asc",
      },
      responseType: "blob",
    });

    // ✅ supports axios shapes: either res.data is Blob OR res itself is Blob
    const blob = res?.data instanceof Blob ? res.data : res;
    if (!(blob instanceof Blob)) return;

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filenamePrefix}-${new Date().toISOString()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error downloading CSV:", error);
    alert("Failed to export CSV. Please try again.");
  }
}
