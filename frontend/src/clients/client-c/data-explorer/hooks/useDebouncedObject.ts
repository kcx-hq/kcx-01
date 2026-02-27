import { useEffect, useState } from 'react';

export const useDebouncedObject = <T extends Record<string, string>>(obj: T, delay: number = 300) => {
  const [debouncedObj, setDebouncedObj] = useState<T>(obj);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedObj(obj);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [obj, delay]);

  return debouncedObj;
};
