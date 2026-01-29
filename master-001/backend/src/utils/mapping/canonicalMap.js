import { normalize } from "./normalize.js";

export const CANONICAL_MAP = {
  linkedaccount : "id" ,
  regionid: "regioncode", // CSV RegionId → internal regioncode
  id: "id",               // Id → id
  tags: "tags",    
};

export function canonicalMatch(csvColumn) {
  const norm = normalize(csvColumn);
  return CANONICAL_MAP[norm] || null;
}
