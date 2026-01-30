export function detectType(values = [], header = "") {
  const nonEmpty = values.filter(v => v !== null && v !== "");

  if (!nonEmpty.length) return "string";

  // 🔒 IDs should NEVER be numeric
  if (/id$|_id$|account|subscription|project/i.test(header)) {
    return "string";
  }

  const numberRatio =
    nonEmpty.filter(v => !isNaN(v)).length / nonEmpty.length;

  if (numberRatio > 0.9) return "number";

  const dateRatio =
    nonEmpty.filter(v =>
      typeof v === "string" &&
      /^\d{4}-\d{2}-\d{2}/.test(v)
    ).length / nonEmpty.length;

  if (dateRatio > 0.9) return "date";

  return "string";
}

export const FIELD_TYPES = {
  billingcurrency: "string",
  subaccountid: "string",
  sub_account_name: "string",
  servicecategory: "string",
  servicename: "string",
  regionname: "string",

  chargeperiodstart: "date",
  chargeperiodend: "date",

  consumedquantity: "number",
  listunitprice: "number",
  billedcost: "number",
};
