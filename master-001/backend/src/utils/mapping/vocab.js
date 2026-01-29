export const VOCAB = {
  billingcurrency: ["usd", "eur", "inr", "gbp", "jpy"],

  regioncode: [
    "us-east-1", "us-west-2", "eu-west-1",
    "centralindia", "eastus", "westeurope"
  ],

  regionname: [
    "eastus", "westus", "westeurope",
    "centralindia", "uksouth"
  ],

  availabilityzone: [
    "us-east-1a", "us-east-1b", "eastus-1"
  ],

  servicename: [
    "ec2", "s3", "lambda", "rds",
    "compute", "storage", "sql"
  ],

  servicecategory: [
    "compute", "storage", "networking", "database"
  ],

  chargefrequency: [
    "hourly", "daily", "monthly", "one-time"
  ],

  consumedunit: [
    "hours", "gb", "gb-month", "requests", "seconds"
  ],
};

export function vocabMatch(values = [], field) {
  const vocab = VOCAB[field];
  if (!vocab) return false;

  const hits = values
    .filter(Boolean)
    .map(v => v.toString().toLowerCase())
    .filter(v => vocab.includes(v));

  return hits.length / values.length > 0.6;
}
