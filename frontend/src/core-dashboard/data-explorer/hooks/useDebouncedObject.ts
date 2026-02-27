import { useEffect, useState } from "react";

/**
 * Debounce any object (deep compare by JSON stringify for simplicity).
 * Keeps last stable value after delay.
 */
export const useDebouncedObject = (value: Record<string, string>, delay: number = 300) => {
  const [debounced, setDebounced] = useState<Record<string, string>>(value);

  useEffect(() => {
    const t = setTimeout(() => {
      // Clean empty strings (optional)
      const cleaned: Record<string, string> = {};
      Object.entries(value || {}).forEach(([k, v]: [string, string]) => {
        if (typeof v === "string") {
          if (v.trim()) cleaned[k] = v.trim();
        }
      });
      setDebounced(cleaned);
    }, delay);

    return () => clearTimeout(t);
  }, [value, delay]);

  return debounced;
};



