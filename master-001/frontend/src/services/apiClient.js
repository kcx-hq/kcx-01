import { http } from "./http";
import { useDashboardStore } from "../store/Dashboard.store"; 

/**
 * Creates a dynamic API client based on capabilities response.
 *
 * Usage:
 *   const api = createApiClient(caps);
 *   const data = await api.call("reports", "summary", { params: {...} });
 */
export function createApiClient(caps) {
  const apiBase = caps?.apiBase || "/api";

  function getEndpoint(moduleKey, endpointKey) {
    const mod = caps?.modules?.[moduleKey];
    if (!mod?.enabled) return null;

    const ep = mod?.endpoints?.[endpointKey];
    if (!ep) return null;

    if (ep === true) return { method: "GET", path: `/${moduleKey}/${endpointKey}` };
    if (typeof ep === "object") return ep;

    return null;
  }

  // ✅ helper: safely get uploadIds from Zustand outside React
  function getUploadIdsFromStore() {
    try {
      const ids = useDashboardStore.getState().uploadIds;
      return Array.isArray(ids) ? ids : [];
    } catch {
      return [];
    }
  }

  async function call(moduleKey, endpointKey, options = {}) {
    const ep = getEndpoint(moduleKey, endpointKey);
    if (!ep) {
      const err = new Error(`Endpoint not supported: ${moduleKey}.${endpointKey}`);
      err.code = "NOT_SUPPORTED";
      throw err;
    }

    const method = (ep.method || "GET").toUpperCase();
    const url = `${apiBase}${ep.path}`;

    // ✅ Pull uploadIds from store
    const uploadIds = getUploadIdsFromStore();

    // ✅ merge params: user params + uploadIds
    const mergedParams = {
      ...(options.params || {}),
      ...(uploadIds.length > 0 ? { uploadIds: uploadIds.join(",") } : {}), // query: uploadIds=1,2,3
      // If your backend expects uploadId (single) too:
      // ...(uploadIds.length === 1 ? { uploadId: uploadIds[0] } : {}),
    };

    const requestConfig = {
      url,
      method,
      responseType: ep.responseType || options.responseType,
      headers: options.headers,
      params: mergedParams,
    };

    // ✅ include body (for POST/PUT/PATCH)
    if (options.data && ["POST", "PUT", "PATCH"].includes(method)) {
      requestConfig.data = options.data;
    }

    // ✅ OPTIONAL: also inject uploadIds into body (if backend expects in req.body)
    // if (["POST", "PUT", "PATCH"].includes(method)) {
    //   requestConfig.data = {
    //     ...(requestConfig.data || {}),
    //     ...(uploadIds.length > 0 ? { uploadIds } : {}),
    //   };
    // }

    const res = await http.request(requestConfig);
    return res.data;
  }

  return { call, getEndpoint };
}
