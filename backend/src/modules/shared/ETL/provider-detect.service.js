// services/billing/providerDetector.js
export function detectProvider(headers) {
  const h = headers.map(c => c.toLowerCase());

  if (h.some(c => c.includes("lineitem/"))) return "aws";
  if (h.includes("subscriptionid")) return "azure";
  if (h.includes("projectid")) return "gcp";

  return "generic";
}
