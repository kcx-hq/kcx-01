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
  const fieldLabels = {
    'client.identity': 'Client Information',
    'project.type': 'Project Type',
    'project.problem': 'Problem Statement',
    'project.users': 'Target Users',
    'project.features': 'Features',
    'project.integrations': 'Integrations',
    'constraints.timeline': 'Timeline',
    'constraints.budget': 'Budget'
  };

  const summary = {};

  // Ensure requirements is an object
  const req = (typeof requirements === 'object' && requirements !== null) ? requirements : {};

  for (const [field, label] of Object.entries(fieldLabels)) {
    const parts = field.split('.');
    let value = req;

    // Navigate through nested properties
    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        value = undefined;
        break;
      }
    }

    // Include all fields - show value or empty string if not filled
    if (value !== undefined && value !== null && value !== '' && (!Array.isArray(value) || value.length > 0)) {
      summary[label] = value;
    } else {
      summary[label] = ''; // Show empty field for unfilled questions
    }
  }

  return summary;
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
