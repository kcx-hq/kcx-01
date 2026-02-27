// frontend/shared/utils/downloadCsvFromBackend.js
import type { ApiLikeError, DownloadCsvFromBackendParams } from "../types";

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
}: DownloadCsvFromBackendParams) {
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
    } as Parameters<typeof api.call>[2]);

    // ✅ supports axios shapes: either res.data is Blob OR res itself is Blob
    const blob = res instanceof Blob ? res : null;
    if (!(blob instanceof Blob)) return;

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filenamePrefix}-${new Date().toISOString()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (error: unknown) {
    const err = error as ApiLikeError;
    console.error("Error downloading CSV:", err);
    alert("Failed to export CSV. Please try again.");
  }
}



