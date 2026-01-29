import { useEffect, useState } from "react";

/**
 * Debounce any object (deep compare by JSON stringify for simplicity).
 * Keeps last stable value after delay.
 */
export const useDebouncedObject = (value, delay = 300) => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => {
      // Clean empty strings (optional)
      const cleaned = {};
      Object.entries(value || {}).forEach(([k, v]) => {
        if (typeof v === "string") {
          if (v.trim()) cleaned[k] = v.trim();
        } else if (v !== null && v !== undefined) {
          cleaned[k] = v;
        }
      });
      setDebounced(cleaned);
    }, delay);

    return () => clearTimeout(t);
  }, [value, delay]);

  return debounced;
};
