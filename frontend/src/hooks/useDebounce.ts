import { useEffect, useState } from 'react';

/**
 * Custom hook to debounce a value
 * @param value - The value to debounce
 * @param {number} delay - Delay in milliseconds (default: 500ms)
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay = 500): T {
<<<<<<< HEAD
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
=======
  const [debouncedValue, setDebouncedValue] = useState(value);
>>>>>>> deploy

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

