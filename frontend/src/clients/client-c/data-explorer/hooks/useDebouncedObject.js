import { useEffect, useState } from 'react';

export const useDebouncedObject = (obj, delay = 300) => {
  const [debouncedObj, setDebouncedObj] = useState(obj);

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