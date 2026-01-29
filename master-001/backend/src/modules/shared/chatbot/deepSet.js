/**
 * Deep set utility for setting nested object properties using dot notation
 * @param {Object} obj - Target object
 * @param {string} pathStr - Dot-separated path (e.g., "project.features")
 * @param {any} value - Value to set
 */
export function setDeep(obj, pathStr, value) {
  const parts = pathStr.split('.');
  let cur = obj;

  for (let i = 0; i < parts.length; i++) {
    const key = parts[i];

    if (i === parts.length - 1) {
      // Last part: set the value
      cur[key] = value;
    } else {
      // Intermediate part: navigate or create
      if (cur[key] == null || typeof cur[key] !== 'object') {
        cur[key] = {};
      }
      cur = cur[key];
    }
  }
}
