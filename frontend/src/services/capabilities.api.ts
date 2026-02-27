import { apiGet } from "./http";
import { isCapabilities } from "./apiClient";
import type { Capabilities } from "./apiClient";

export async function fetchCapabilities(): Promise<Capabilities | null> {
  // Backend route currently uses /capabililites (typo kept for compatibility)
  const data = await apiGet<unknown>("/api/capabililites", {
    suppressLegacyWarning: true,
  });
  return isCapabilities(data) ? data : null;
}
