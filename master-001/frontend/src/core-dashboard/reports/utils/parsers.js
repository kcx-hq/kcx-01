export const parseCurrency = (val) => {
  if (typeof val === "number") return val;
  if (!val) return 0;
  return parseFloat(val.toString().replace(/[$,]/g, "")) || 0;
};

export const parsePercentage = (val) => {
  if (typeof val === "number") return val;
  if (!val) return 0;
  return parseFloat(val.toString().replace(/%/g, "")) || 0;
};
