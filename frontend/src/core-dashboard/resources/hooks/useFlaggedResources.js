import { useState } from 'react';

export function useFlaggedResources() {
  const [flaggedResources, setFlaggedResources] = useState(new Set());

  const toggleFlag = (resourceId) => {
    setFlaggedResources((prev) => {
      const next = new Set(prev);
      if (next.has(resourceId)) next.delete(resourceId);
      else next.add(resourceId);
      return next;
    });
  };

  return { flaggedResources, toggleFlag };
}
