import type { TagCoverageData, TagCoverageEnvelope, TagCoverageRow } from "../types";

const DEFAULT_COVERAGE: TagCoverageData = {
  taggedCost: 0,
  untaggedCost: 0,
  taggedPercent: 0,
  untaggedPercent: 0,
  missingTags: [],
};

export function normalizeTagCoverageResponse(res: unknown): TagCoverageData {
  const source = (res as TagCoverageEnvelope | TagCoverageData | null | undefined) ?? null;
  const payload =
    source && typeof source === "object" && "data" in source && source.data && typeof source.data === "object"
      ? source.data
      : source;

  if (!payload) {
    return DEFAULT_COVERAGE;
  }

  const raw = payload as Partial<TagCoverageData>;
  return {
    taggedCost: Number(raw.taggedCost ?? 0),
    untaggedCost: Number(raw.untaggedCost ?? 0),
    taggedPercent: Number(raw.taggedPercent ?? 0),
    untaggedPercent: Number(raw.untaggedPercent ?? 0),
    missingTags: Array.isArray(raw.missingTags) ? (raw.missingTags as TagCoverageRow[]) : [],
  };
}
