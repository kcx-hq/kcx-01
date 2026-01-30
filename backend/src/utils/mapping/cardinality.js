export function cardinality(values = []) {
  const nonEmpty = values.filter(v => v !== null && v !== "");
  if (!nonEmpty.length) return 0;

  return new Set(nonEmpty).size / nonEmpty.length;
}
