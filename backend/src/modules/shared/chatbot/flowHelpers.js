import { FLOW } from './flow.js';

/**
 * Get current step from FLOW array
 */
export function getCurrentStep(stepIndex) {
  return FLOW[stepIndex] || FLOW[FLOW.length - 1];
}

/**
 * Format requirements for summary display
 * Maps field paths to human-readable labels and filters empty values
 */
export function formatSummary(requirements) {
  // ✅ Labels updated for your NEW flow.js
  const LABELS = [
    { path: "client.identity", label: "Name" },
    { path: "client.company", label: "Company" },
    { path: "project.service", label: "Service Needed" },
    { path: "finops.provider", label: "Cloud Provider" },
    { path: "finops.spend", label: "Monthly Cloud Spend" },
    { path: "client.role", label: "Role" },
    { path: "project.message", label: "Message / Need" },
    { path: "meeting.want", label: "Schedule Meeting" },
    { path: "meeting.email", label: "Meeting Email" },
    { path: "meeting.message", label: "Meeting Note" },
  ];

  const req =
    requirements && typeof requirements === "object" ? requirements : {};

  const getByPath = (obj, path) => {
    return path.split(".").reduce((acc, key) => {
      if (acc && typeof acc === "object" && key in acc) return acc[key];
      return undefined;
    }, obj);
  };

  const hasValue = (v) => {
    if (v === undefined || v === null) return false;
    if (typeof v === "string") return v.trim().length > 0;
    if (Array.isArray(v)) return v.length > 0;
    return true; // numbers/booleans/objects
  };

  const normalize = (v) => {
    if (Array.isArray(v)) return v.join(", ");
    if (typeof v === "string") return v.trim();
    if (v === undefined || v === null) return "";
    return String(v);
  };

  // ✅ Build a clean summary object, keeping keys readable and values consistent
  return LABELS.reduce((acc, { path, label }) => {
    const value = getByPath(req, path);

    // keep fields visible even if empty (like your old behavior)
    acc[label] = hasValue(value) ? normalize(value) : "";
    return acc;
  }, {});
}


/**
 * Build a standard session response
 */
export function buildSessionResponse(session) {
  const step = getCurrentStep(session.step_index);
  const isDone = session.status === 'completed';

  return {
    sessionId: session.id,
    question: step.question,
    stepId: step.id,
    stepIndex: session.step_index,
    isDone,
    progress: {
      current: session.step_index + 1,
      total: FLOW.length
    }
  };
}
