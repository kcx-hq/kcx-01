import { useState } from 'react';
import type { UseFlaggedResourcesResult } from "../types";

export function useFlaggedResources(): UseFlaggedResourcesResult {
  const [flaggedResources, setFlaggedResources] = useState<Set<string>>(new Set());

  const toggleFlag = (resourceId: string) => {
    setFlaggedResources((prev: Set<string>) => {
      const next = new Set(prev);
      if (next.has(resourceId)) next.delete(resourceId);
      else next.add(resourceId);
      return next;
    });
  };

  return { flaggedResources, toggleFlag };
}



