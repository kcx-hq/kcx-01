export function normalize(str = "") {
  return str
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim();
}
