import { http } from "./http";

export async function fetchCapabilities() {
  // Note: Backend has typo in route - using /capabililites (missing 'i')
  // http baseURL is just the host (e.g., "http://localhost:5000")
  // So we need the full path: /api/capabililites
  // If backend is fixed, change to /api/capabilities
  const res = await http.get("/api/capabililites");
  return res.data;
}
