import { CAPABILITIES_MAP } from "./capabilities.map.js";

export function getCapabilities(req, res) {
  const clientId = req.clientId;
  const caps = CAPABILITIES_MAP[clientId] || CAPABILITIES_MAP.core;

  return res.json({
    ...caps,
    // Helpful metadata
    serverTime: new Date().toISOString(),
  });
}
