import { z } from "zod";
import AppError from "../../errors/AppError.js";

const UUID_SCHEMA = z.string().uuid();
const NON_EMPTY_STRING = z.string().trim().min(1).max(5000);
const SAFE_STRING = z.string().trim().max(5000);
const EMAIL_SCHEMA = z.string().trim().email();
const AWS_REGION_SCHEMA = z.string().trim().regex(/^[a-z]{2}-[a-z-]+-\d$/);
const AWS_ACCOUNT_ID_SCHEMA = z.string().trim().regex(/^\d{12}$/);
const DATE_ONLY_SCHEMA = z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/);

function isPlainObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function normalizeRecordInput(input) {
  if (input === undefined || input === null) return {};
  if (typeof input !== "object" || Array.isArray(input)) return input;

  const normalized = {};
  for (const [key, value] of Object.entries(input)) {
    if (Array.isArray(value)) {
      normalized[key] = value.map((item) => String(item));
      continue;
    }
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean" ||
      value === null
    ) {
      normalized[key] = String(value ?? "");
      continue;
    }
    normalized[key] = value;
  }
  return normalized;
}

function normalizeBodyInput(input) {
  if (input === undefined || input === null) return {};
  return input;
}

const BASE_PARAMS_SCHEMA = z.preprocess(
  normalizeRecordInput,
  z.record(z.string(), z.string().trim().min(1).max(256)).default({})
);

const BASE_QUERY_SCHEMA = z.preprocess(
  normalizeRecordInput,
  z
    .record(
      z.string(),
      z.union([
        z.string().trim().max(2000),
        z.array(z.string().trim().max(2000)).max(100),
      ])
    )
    .default({})
);

const BASE_BODY_SCHEMA = z.preprocess(
  normalizeBodyInput,
  z.custom(
    (value) => isPlainObject(value),
    "Request body must be a JSON object"
  )
);

const S3_INGEST_SCHEMA = z.object({
  account: AWS_ACCOUNT_ID_SCHEMA,
  region: AWS_REGION_SCHEMA,
  detail: z.object({
    bucket: z.object({
      name: z.string().trim().min(3).max(63),
    }),
    object: z.object({
      key: z.string().trim().min(1).max(1024),
      size: z.coerce.number().int().min(0).max(10 * 1024 * 1024 * 1024),
      etag: z.string().trim().optional(),
      sequencer: z.string().trim().optional(),
    }),
  }),
});

const UPLOAD_ID_QUERY_SCHEMA = z
  .union([NON_EMPTY_STRING, z.array(NON_EMPTY_STRING).max(100)])
  .optional();

const OVERVIEW_COMMON_QUERY_SCHEMA = z.preprocess(
  normalizeRecordInput,
  z
    .object({
      provider: SAFE_STRING.optional(),
      service: SAFE_STRING.optional(),
      region: SAFE_STRING.optional(),
      budget: z.coerce.number().min(0).optional(),
      uploadid: UPLOAD_ID_QUERY_SCHEMA,
      uploadId: UPLOAD_ID_QUERY_SCHEMA,
      uploadids: UPLOAD_ID_QUERY_SCHEMA,
      uploadIds: UPLOAD_ID_QUERY_SCHEMA,
    })
    .strict()
);

const OVERVIEW_DATA_EXPLORER_QUERY_SCHEMA = z.preprocess(
  normalizeRecordInput,
  z
    .object({
      provider: SAFE_STRING.optional(),
      service: SAFE_STRING.optional(),
      region: SAFE_STRING.optional(),
      page: z.coerce.number().int().min(1).max(100000).optional(),
      limit: z.coerce.number().int().min(1).max(100000).optional(),
      sortBy: SAFE_STRING.optional(),
      sortOrder: z.string().trim().regex(/^(asc|desc)$/i).optional(),
      search: SAFE_STRING.optional(),
      columnFilters: SAFE_STRING.optional(),
      groupByCol: SAFE_STRING.optional(),
      viewMode: z.string().trim().regex(/^(table|pivot)$/i).optional(),
      selectedIndices: SAFE_STRING.optional(),
      visibleColumns: SAFE_STRING.optional(),
      uploadid: UPLOAD_ID_QUERY_SCHEMA,
      uploadId: UPLOAD_ID_QUERY_SCHEMA,
      uploadids: UPLOAD_ID_QUERY_SCHEMA,
      uploadIds: UPLOAD_ID_QUERY_SCHEMA,
    })
    .strict()
);

const COST_ANALYSIS_COMMON_QUERY_SCHEMA = z.preprocess(
  normalizeRecordInput,
  z
    .object({
      provider: SAFE_STRING.optional(),
      service: SAFE_STRING.optional(),
      region: SAFE_STRING.optional(),
      account: SAFE_STRING.optional(),
      subAccount: SAFE_STRING.optional(),
      app: SAFE_STRING.optional(),
      team: SAFE_STRING.optional(),
      env: SAFE_STRING.optional(),
      costCategory: SAFE_STRING.optional(),
      tagKey: SAFE_STRING.optional(),
      tagValue: SAFE_STRING.optional(),
      timeRange: z.enum(["7d", "30d", "90d", "mtd", "qtd", "custom"]).optional(),
      granularity: z.enum(["daily", "weekly", "monthly"]).optional(),
      compareTo: z
        .enum(["previous_period", "same_period_last_month", "none"])
        .optional(),
      costBasis: z.enum(["actual", "amortized", "net"]).optional(),
      currencyMode: z.enum(["usd"]).optional(),
      groupBy: z
        .enum([
          "ServiceName",
          "RegionName",
          "ProviderName",
          "Account",
          "Team",
          "App",
          "Env",
          "CostCategory",
        ])
        .optional(),
      startDate: DATE_ONLY_SCHEMA.optional(),
      endDate: DATE_ONLY_SCHEMA.optional(),
      uploadid: UPLOAD_ID_QUERY_SCHEMA,
      uploadId: UPLOAD_ID_QUERY_SCHEMA,
      uploadids: UPLOAD_ID_QUERY_SCHEMA,
      uploadIds: UPLOAD_ID_QUERY_SCHEMA,
    })
    .strict()
);

const COST_ANALYSIS_FILTERS_QUERY_SCHEMA = z.preprocess(
  normalizeRecordInput,
  z
    .object({
      uploadid: UPLOAD_ID_QUERY_SCHEMA,
      uploadId: UPLOAD_ID_QUERY_SCHEMA,
      uploadids: UPLOAD_ID_QUERY_SCHEMA,
      uploadIds: UPLOAD_ID_QUERY_SCHEMA,
    })
    .strict()
);

const COST_DRIVERS_COMMON_QUERY_SCHEMA = z.preprocess(
  normalizeRecordInput,
  z
    .object({
      provider: SAFE_STRING.optional(),
      service: SAFE_STRING.optional(),
      region: SAFE_STRING.optional(),
      account: SAFE_STRING.optional(),
      subAccount: SAFE_STRING.optional(),
      team: SAFE_STRING.optional(),
      app: SAFE_STRING.optional(),
      env: SAFE_STRING.optional(),
      costCategory: SAFE_STRING.optional(),
      tagKey: SAFE_STRING.optional(),
      tagValue: SAFE_STRING.optional(),
      period: z.coerce.number().int().min(1).max(366).optional(),
      timeRange: z.enum(["7d", "30d", "90d", "mtd", "qtd", "custom"]).optional(),
      compareTo: z
        .enum(["previous_period", "same_period_last_month", "custom_previous", "none"])
        .optional(),
      startDate: DATE_ONLY_SCHEMA.optional(),
      endDate: DATE_ONLY_SCHEMA.optional(),
      previousStartDate: DATE_ONLY_SCHEMA.optional(),
      previousEndDate: DATE_ONLY_SCHEMA.optional(),
      costBasis: z.enum(["actual", "amortized", "net"]).optional(),
      dimension: z
        .enum(["service", "account", "region", "team", "sku", "ServiceName", "Account", "RegionName", "Team", "SkuId"])
        .optional(),
      minChange: z.coerce.number().min(0).optional(),
      rowLimit: z.coerce.number().int().min(1).max(500).optional(),
      activeServiceFilter: SAFE_STRING.optional(),
      uploadid: UPLOAD_ID_QUERY_SCHEMA,
      uploadId: UPLOAD_ID_QUERY_SCHEMA,
      uploadids: UPLOAD_ID_QUERY_SCHEMA,
      uploadIds: UPLOAD_ID_QUERY_SCHEMA,
    })
    .strict()
);

const COST_DRIVERS_DETAILS_BODY_SCHEMA = z.preprocess(
  normalizeBodyInput,
  z
    .object({
      driver: z.record(z.string(), z.any()).optional(),
      driverKey: SAFE_STRING.optional(),
      key: SAFE_STRING.optional(),
      name: SAFE_STRING.optional(),
      dimension: SAFE_STRING.optional(),
      period: z.coerce.number().int().min(1).max(366).optional(),
      timeRange: SAFE_STRING.optional(),
      compareTo: SAFE_STRING.optional(),
      startDate: DATE_ONLY_SCHEMA.optional(),
      endDate: DATE_ONLY_SCHEMA.optional(),
      previousStartDate: DATE_ONLY_SCHEMA.optional(),
      previousEndDate: DATE_ONLY_SCHEMA.optional(),
      costBasis: SAFE_STRING.optional(),
      filters: z.record(z.string(), z.any()).optional(),
      uploadid: z.union([NON_EMPTY_STRING, z.array(NON_EMPTY_STRING)]).optional(),
      uploadId: z.union([NON_EMPTY_STRING, z.array(NON_EMPTY_STRING)]).optional(),
      uploadids: z.union([NON_EMPTY_STRING, z.array(NON_EMPTY_STRING)]).optional(),
      uploadIds: z.union([NON_EMPTY_STRING, z.array(NON_EMPTY_STRING)]).optional(),
    })
    .strict()
);

const UNIT_ECONOMICS_COMMON_QUERY_SCHEMA = z.preprocess(
  normalizeRecordInput,
  z
    .object({
      provider: SAFE_STRING.optional(),
      service: SAFE_STRING.optional(),
      region: SAFE_STRING.optional(),
      account: SAFE_STRING.optional(),
      subAccount: SAFE_STRING.optional(),
      team: SAFE_STRING.optional(),
      env: SAFE_STRING.optional(),
      product: SAFE_STRING.optional(),
      period: z.enum(["last30days", "last90days", "month", "30d", "90d"]).optional(),
      compareTo: z.enum(["previous_period", "same_period_last_month", "none"]).optional(),
      costBasis: z.enum(["actual", "amortized", "net"]).optional(),
      unitMetric: SAFE_STRING.optional(),
      uploadid: UPLOAD_ID_QUERY_SCHEMA,
      uploadId: UPLOAD_ID_QUERY_SCHEMA,
      uploadids: UPLOAD_ID_QUERY_SCHEMA,
      uploadIds: UPLOAD_ID_QUERY_SCHEMA,
    })
    .strict()
);

const DATA_QUALITY_COMMON_QUERY_SCHEMA = z.preprocess(
  normalizeRecordInput,
  z
    .object({
      provider: SAFE_STRING.optional(),
      service: SAFE_STRING.optional(),
      region: SAFE_STRING.optional(),
      account: SAFE_STRING.optional(),
      environment: SAFE_STRING.optional(),
      team: SAFE_STRING.optional(),
      owner: SAFE_STRING.optional(),
      startDate: DATE_ONLY_SCHEMA.optional(),
      endDate: DATE_ONLY_SCHEMA.optional(),
      currencyMode: SAFE_STRING.optional(),
      costBasisMode: SAFE_STRING.optional(),
      uploadid: UPLOAD_ID_QUERY_SCHEMA,
      uploadId: UPLOAD_ID_QUERY_SCHEMA,
      uploadids: UPLOAD_ID_QUERY_SCHEMA,
      uploadIds: UPLOAD_ID_QUERY_SCHEMA,
    })
    .strict()
);

const RESOURCES_COMMON_QUERY_SCHEMA = z.preprocess(
  normalizeRecordInput,
  z
    .object({
      provider: SAFE_STRING.optional(),
      service: SAFE_STRING.optional(),
      region: SAFE_STRING.optional(),
      uploadid: UPLOAD_ID_QUERY_SCHEMA,
      uploadId: UPLOAD_ID_QUERY_SCHEMA,
      uploadids: UPLOAD_ID_QUERY_SCHEMA,
      uploadIds: UPLOAD_ID_QUERY_SCHEMA,
    })
    .strict()
);

const OPTIMIZATION_COMMON_QUERY_SCHEMA = z.preprocess(
  normalizeRecordInput,
  z
    .object({
      provider: SAFE_STRING.optional(),
      service: SAFE_STRING.optional(),
      region: SAFE_STRING.optional(),
      period: z
        .enum(["last30days", "last90days", "month", "30d", "90d", "mtd", "qtd"])
        .optional(),
      uploadid: UPLOAD_ID_QUERY_SCHEMA,
      uploadId: UPLOAD_ID_QUERY_SCHEMA,
      uploadids: UPLOAD_ID_QUERY_SCHEMA,
      uploadIds: UPLOAD_ID_QUERY_SCHEMA,
    })
    .strict()
);

const GOVERNANCE_COMMON_QUERY_SCHEMA = z.preprocess(
  normalizeRecordInput,
  z
    .object({
      provider: SAFE_STRING.optional(),
      service: SAFE_STRING.optional(),
      region: SAFE_STRING.optional(),
      period: SAFE_STRING.optional(),
      uploadid: UPLOAD_ID_QUERY_SCHEMA,
      uploadId: UPLOAD_ID_QUERY_SCHEMA,
      uploadids: UPLOAD_ID_QUERY_SCHEMA,
      uploadIds: UPLOAD_ID_QUERY_SCHEMA,
    })
    .strict()
);

const GOVERNANCE_ACCOUNTS_QUERY_SCHEMA = z.preprocess(
  normalizeRecordInput,
  z
    .object({
      provider: SAFE_STRING.optional(),
      service: SAFE_STRING.optional(),
      region: SAFE_STRING.optional(),
      period: SAFE_STRING.optional(),
      ownershipStatus: SAFE_STRING.optional(),
      search: SAFE_STRING.optional(),
      sortBy: SAFE_STRING.optional(),
      sortOrder: z.string().trim().regex(/^(asc|desc)$/i).optional(),
      uploadid: UPLOAD_ID_QUERY_SCHEMA,
      uploadId: UPLOAD_ID_QUERY_SCHEMA,
      uploadids: UPLOAD_ID_QUERY_SCHEMA,
      uploadIds: UPLOAD_ID_QUERY_SCHEMA,
    })
    .strict()
);

const FORECASTING_BUDGETS_QUERY_SCHEMA = z.preprocess(
  normalizeRecordInput,
  z
    .object({
      provider: SAFE_STRING.optional(),
      service: SAFE_STRING.optional(),
      region: SAFE_STRING.optional(),
      period: z.enum(["mtd", "qtd", "30d", "90d"]).optional(),
      compareTo: z.enum(["previous_period", "same_period_last_month", "none"]).optional(),
      costBasis: z.enum(["actual", "amortized", "net"]).optional(),
      uploadid: UPLOAD_ID_QUERY_SCHEMA,
      uploadId: UPLOAD_ID_QUERY_SCHEMA,
      uploadids: UPLOAD_ID_QUERY_SCHEMA,
      uploadIds: UPLOAD_ID_QUERY_SCHEMA,
    })
    .strict()
);

const ALERTS_INCIDENTS_QUERY_SCHEMA = z.preprocess(
  normalizeRecordInput,
  z
    .object({
      provider: SAFE_STRING.optional(),
      service: SAFE_STRING.optional(),
      region: SAFE_STRING.optional(),
      period: z.enum(["mtd", "qtd", "30d", "90d"]).optional(),
      costBasis: z.enum(["actual", "amortized", "net"]).optional(),
      severity: z.enum(["critical", "high", "medium", "low"]).optional(),
      type: z
        .enum([
          "spend_anomaly",
          "forecast_budget_risk",
          "governance_control",
          "optimization_workflow",
          "commitment_risk",
        ])
        .optional(),
      status: z.enum(["new", "acknowledged", "in_progress", "mitigated", "resolved"]).optional(),
      view: z.enum(["full", "header"]).optional(),
      uploadid: UPLOAD_ID_QUERY_SCHEMA,
      uploadId: UPLOAD_ID_QUERY_SCHEMA,
      uploadids: UPLOAD_ID_QUERY_SCHEMA,
      uploadIds: UPLOAD_ID_QUERY_SCHEMA,
    })
    .strict()
);

const REPORTS_COMMON_QUERY_SCHEMA = z.preprocess(
  normalizeRecordInput,
  z
    .object({
      provider: SAFE_STRING.optional(),
      service: SAFE_STRING.optional(),
      region: SAFE_STRING.optional(),
      period: SAFE_STRING.optional(),
      startDate: DATE_ONLY_SCHEMA.optional(),
      endDate: DATE_ONLY_SCHEMA.optional(),
      limit: z.coerce.number().int().min(1).max(1000).optional(),
      uploadid: UPLOAD_ID_QUERY_SCHEMA,
      uploadId: UPLOAD_ID_QUERY_SCHEMA,
      uploadids: UPLOAD_ID_QUERY_SCHEMA,
      uploadIds: UPLOAD_ID_QUERY_SCHEMA,
    })
    .strict()
);

const REPORTS_DOWNLOAD_BODY_SCHEMA = z.preprocess(
  normalizeBodyInput,
  z.object({}).passthrough()
);

const REQUEST_RULES = [
  {
    method: "POST",
    pattern: /^\/api(?:\/v1)?\/auth\/(login|signin)\/?$/i,
    body: z.object({
      email: EMAIL_SCHEMA,
      password: NON_EMPTY_STRING,
    }).strict(),
  },
  {
    method: "POST",
    pattern: /^\/api(?:\/v1)?\/auth\/signup\/?$/i,
    body: z.object({
      email: EMAIL_SCHEMA,
      password: NON_EMPTY_STRING,
      full_name: NON_EMPTY_STRING,
      role: NON_EMPTY_STRING,
      client_name: SAFE_STRING.optional(),
      client_email: EMAIL_SCHEMA.optional(),
    }).strict(),
  },
  {
    method: "POST",
    pattern: /^\/api(?:\/v1)?\/auth\/(verify|verify-email)\/?$/i,
    body: z.object({
      email: EMAIL_SCHEMA,
      otp: NON_EMPTY_STRING,
    }).strict(),
  },
  {
    method: "POST",
    pattern: /^\/api(?:\/v1)?\/auth\/(reset|forgot-password)\/?$/i,
    body: z.object({
      email: EMAIL_SCHEMA.optional(),
    }).strict(),
  },
  {
    method: "POST",
    pattern:
      /^\/api(?:\/v1)?\/auth\/(reset|reset-password)\/(?<token>[^/]+)\/?$/i,
    params: z.object({
      token: NON_EMPTY_STRING,
    }).strict(),
    body: z.object({
      password: NON_EMPTY_STRING,
      confirmPassword: NON_EMPTY_STRING,
    }).strict(),
  },
  {
    method: "PUT",
    pattern: /^\/api(?:\/v1)?\/auth\/profile\/?$/i,
    body: z.object({
      full_name: NON_EMPTY_STRING,
    }).strict(),
  },
  {
    method: "POST",
    pattern: /^\/api(?:\/v1)?\/inquiry\/submit\/?$/i,
    body: z.object({
      name: NON_EMPTY_STRING,
      email: EMAIL_SCHEMA,
      message: NON_EMPTY_STRING,
      preferred_datetime: NON_EMPTY_STRING,
      timezone: NON_EMPTY_STRING,
    }).strict(),
  },
  {
    method: "GET",
    pattern: /^\/api(?:\/v1)?\/inquiry\/(accept|reject)\/(?<id>[^/]+)\/?$/i,
    params: z.object({
      id: UUID_SCHEMA,
    }).strict(),
    query: z.object({
      token: NON_EMPTY_STRING,
    }).strict(),
  },
  {
    method: "GET",
    pattern: /^\/api(?:\/v1)?\/inquiry\/slots\/by-date\/?$/i,
    query: z.object({
      date: DATE_ONLY_SCHEMA,
      userTimezone: NON_EMPTY_STRING.optional(),
      timezone: NON_EMPTY_STRING.optional(),
      slotMinutes: z.coerce.number().int().min(15).max(1440).optional(),
    }).strict(),
  },
  {
    method: "GET",
    pattern: /^\/api(?:\/v1)?\/dashboard\/overview\/?$/i,
    query: OVERVIEW_COMMON_QUERY_SCHEMA,
  },
  {
    method: "GET",
    pattern: /^\/api(?:\/v1)?\/dashboard\/overview\/anomalies\/?$/i,
    query: OVERVIEW_COMMON_QUERY_SCHEMA,
  },
  {
    method: "GET",
    pattern: /^\/api(?:\/v1)?\/dashboard\/overview\/filters\/?$/i,
    query: OVERVIEW_COMMON_QUERY_SCHEMA,
  },
  {
    method: "GET",
    pattern: /^\/api(?:\/v1)?\/dashboard\/overview\/data-explorer\/?$/i,
    query: OVERVIEW_DATA_EXPLORER_QUERY_SCHEMA,
  },
  {
    method: "GET",
    pattern: /^\/api(?:\/v1)?\/dashboard\/overview\/data-explorer\/export-csv\/?$/i,
    query: OVERVIEW_DATA_EXPLORER_QUERY_SCHEMA,
  },
  {
    method: "GET",
    pattern: /^\/api(?:\/v1)?\/dashboard\/analytics\/cost-analysis\/analysis\/?$/i,
    query: COST_ANALYSIS_COMMON_QUERY_SCHEMA,
  },
  {
    method: "GET",
    pattern: /^\/api(?:\/v1)?\/dashboard\/analytics\/cost-analysis\/kpis\/?$/i,
    query: COST_ANALYSIS_COMMON_QUERY_SCHEMA,
  },
  {
    method: "GET",
    pattern: /^\/api(?:\/v1)?\/dashboard\/analytics\/cost-analysis\/trend\/?$/i,
    query: COST_ANALYSIS_COMMON_QUERY_SCHEMA,
  },
  {
    method: "GET",
    pattern: /^\/api(?:\/v1)?\/dashboard\/analytics\/cost-analysis\/breakdown\/?$/i,
    query: COST_ANALYSIS_COMMON_QUERY_SCHEMA,
  },
  {
    method: "GET",
    pattern: /^\/api(?:\/v1)?\/dashboard\/analytics\/cost-analysis\/concentration\/?$/i,
    query: COST_ANALYSIS_COMMON_QUERY_SCHEMA,
  },
  {
    method: "GET",
    pattern: /^\/api(?:\/v1)?\/dashboard\/analytics\/cost-analysis\/anomaly-impact\/?$/i,
    query: COST_ANALYSIS_COMMON_QUERY_SCHEMA,
  },
  {
    method: "GET",
    pattern: /^\/api(?:\/v1)?\/dashboard\/analytics\/cost-analysis\/filters\/?$/i,
    query: COST_ANALYSIS_FILTERS_QUERY_SCHEMA,
  },
  {
    method: "GET",
    pattern: /^\/api(?:\/v1)?\/dashboard\/analytics\/cost-drivers\/analysis\/?$/i,
    query: COST_DRIVERS_COMMON_QUERY_SCHEMA,
  },
  {
    method: "GET",
    pattern: /^\/api(?:\/v1)?\/dashboard\/analytics\/cost-drivers\/kpis\/?$/i,
    query: COST_DRIVERS_COMMON_QUERY_SCHEMA,
  },
  {
    method: "GET",
    pattern: /^\/api(?:\/v1)?\/dashboard\/analytics\/cost-drivers\/waterfall\/?$/i,
    query: COST_DRIVERS_COMMON_QUERY_SCHEMA,
  },
  {
    method: "GET",
    pattern: /^\/api(?:\/v1)?\/dashboard\/analytics\/cost-drivers\/decomposition\/?$/i,
    query: COST_DRIVERS_COMMON_QUERY_SCHEMA,
  },
  {
    method: "GET",
    pattern: /^\/api(?:\/v1)?\/dashboard\/analytics\/cost-drivers\/rate-vs-usage\/?$/i,
    query: COST_DRIVERS_COMMON_QUERY_SCHEMA,
  },
  {
    method: "GET",
    pattern: /^\/api(?:\/v1)?\/dashboard\/analytics\/cost-drivers\/trust\/?$/i,
    query: COST_DRIVERS_COMMON_QUERY_SCHEMA,
  },
  {
    method: "GET",
    pattern: /^\/api(?:\/v1)?\/dashboard\/analytics\/cost-drivers\/executive-summary\/?$/i,
    query: COST_DRIVERS_COMMON_QUERY_SCHEMA,
  },
  {
    method: "POST",
    pattern: /^\/api(?:\/v1)?\/dashboard\/analytics\/cost-drivers\/details\/?$/i,
    query: COST_DRIVERS_COMMON_QUERY_SCHEMA,
    body: COST_DRIVERS_DETAILS_BODY_SCHEMA,
  },
  {
    method: "GET",
    pattern: /^\/api(?:\/v1)?\/dashboard\/analytics\/data-quality\/analysis\/?$/i,
    query: DATA_QUALITY_COMMON_QUERY_SCHEMA,
  },
  {
    method: "GET",
    pattern: /^\/api(?:\/v1)?\/dashboard\/analytics\/data-quality\/governance-data-health\/banner\/?$/i,
    query: DATA_QUALITY_COMMON_QUERY_SCHEMA,
  },
  {
    method: "GET",
    pattern: /^\/api(?:\/v1)?\/dashboard\/analytics\/data-quality\/governance-data-health\/freshness\/?$/i,
    query: DATA_QUALITY_COMMON_QUERY_SCHEMA,
  },
  {
    method: "GET",
    pattern: /^\/api(?:\/v1)?\/dashboard\/analytics\/data-quality\/governance-data-health\/coverage\/?$/i,
    query: DATA_QUALITY_COMMON_QUERY_SCHEMA,
  },
  {
    method: "GET",
    pattern: /^\/api(?:\/v1)?\/dashboard\/analytics\/data-quality\/governance-data-health\/tag-compliance\/?$/i,
    query: DATA_QUALITY_COMMON_QUERY_SCHEMA,
  },
  {
    method: "GET",
    pattern: /^\/api(?:\/v1)?\/dashboard\/analytics\/data-quality\/governance-data-health\/ownership-completeness\/?$/i,
    query: DATA_QUALITY_COMMON_QUERY_SCHEMA,
  },
  {
    method: "GET",
    pattern: /^\/api(?:\/v1)?\/dashboard\/analytics\/data-quality\/governance-data-health\/currency-basis\/?$/i,
    query: DATA_QUALITY_COMMON_QUERY_SCHEMA,
  },
  {
    method: "GET",
    pattern: /^\/api(?:\/v1)?\/dashboard\/analytics\/data-quality\/governance-data-health\/denominator-quality\/?$/i,
    query: DATA_QUALITY_COMMON_QUERY_SCHEMA,
  },
  {
    method: "GET",
    pattern: /^\/api(?:\/v1)?\/dashboard\/analytics\/data-quality\/governance-data-health\/control-violations\/?$/i,
    query: DATA_QUALITY_COMMON_QUERY_SCHEMA,
  },
  {
    method: "GET",
    pattern: /^\/api(?:\/v1)?\/dashboard\/analytics\/resources\/inventory\/?$/i,
    query: RESOURCES_COMMON_QUERY_SCHEMA,
  },
  {
    method: "GET",
    pattern:
      /^\/api(?:\/v1)?\/dashboard\/optimization\/(?:recommendations|idle-resources|opportunities|commitments|tracker|action-center|right-sizing)\/?$/i,
    query: OPTIMIZATION_COMMON_QUERY_SCHEMA,
  },
  {
    method: "GET",
    pattern: /^\/api(?:\/v1)?\/dashboard\/governance\/summary\/?$/i,
    query: GOVERNANCE_COMMON_QUERY_SCHEMA,
  },
  {
    method: "GET",
    pattern: /^\/api(?:\/v1)?\/dashboard\/governance\/compliance\/?$/i,
    query: GOVERNANCE_COMMON_QUERY_SCHEMA,
  },
  {
    method: "GET",
    pattern: /^\/api(?:\/v1)?\/dashboard\/governance\/accounts\/?$/i,
    query: GOVERNANCE_ACCOUNTS_QUERY_SCHEMA,
  },
  {
    method: "GET",
    pattern:
      /^\/api(?:\/v1)?\/dashboard\/reports\/(?:summary|top-services|top-regions|monthly-spend|tag-compliance|environment-breakdown)\/?$/i,
    query: REPORTS_COMMON_QUERY_SCHEMA,
  },
  {
    method: "POST",
    pattern: /^\/api(?:\/v1)?\/dashboard\/reports\/download\/?$/i,
    body: REPORTS_DOWNLOAD_BODY_SCHEMA,
  },
  {
    method: "GET",
    pattern: /^\/api(?:\/v1)?\/dashboard\/forecasting-budgets\/summary\/?$/i,
    query: FORECASTING_BUDGETS_QUERY_SCHEMA,
  },
  {
    method: "GET",
    pattern: /^\/api(?:\/v1)?\/dashboard\/alerts-incidents\/summary\/?$/i,
    query: ALERTS_INCIDENTS_QUERY_SCHEMA,
  },
  {
    method: "GET",
    pattern: /^\/api(?:\/v1)?\/dashboard\/unit-economics\/summary\/?$/i,
    query: UNIT_ECONOMICS_COMMON_QUERY_SCHEMA,
  },
  {
    method: "GET",
    pattern: /^\/api(?:\/v1)?\/dashboard\/unit-economics\/allocation\/kpis\/?$/i,
    query: UNIT_ECONOMICS_COMMON_QUERY_SCHEMA,
  },
  {
    method: "GET",
    pattern: /^\/api(?:\/v1)?\/dashboard\/unit-economics\/allocation\/showback\/?$/i,
    query: UNIT_ECONOMICS_COMMON_QUERY_SCHEMA,
  },
  {
    method: "GET",
    pattern: /^\/api(?:\/v1)?\/dashboard\/unit-economics\/allocation\/shared-pool\/?$/i,
    query: UNIT_ECONOMICS_COMMON_QUERY_SCHEMA,
  },
  {
    method: "GET",
    pattern: /^\/api(?:\/v1)?\/dashboard\/unit-economics\/allocation\/confidence\/?$/i,
    query: UNIT_ECONOMICS_COMMON_QUERY_SCHEMA,
  },
  {
    method: "GET",
    pattern: /^\/api(?:\/v1)?\/dashboard\/unit-economics\/allocation\/ownership-drift\/?$/i,
    query: UNIT_ECONOMICS_COMMON_QUERY_SCHEMA,
  },
  {
    method: "GET",
    pattern: /^\/api(?:\/v1)?\/dashboard\/unit-economics\/unit-econ\/kpis\/?$/i,
    query: UNIT_ECONOMICS_COMMON_QUERY_SCHEMA,
  },
  {
    method: "GET",
    pattern: /^\/api(?:\/v1)?\/dashboard\/unit-economics\/unit-econ\/trend\/?$/i,
    query: UNIT_ECONOMICS_COMMON_QUERY_SCHEMA,
  },
  {
    method: "GET",
    pattern: /^\/api(?:\/v1)?\/dashboard\/unit-economics\/unit-econ\/decomposition\/?$/i,
    query: UNIT_ECONOMICS_COMMON_QUERY_SCHEMA,
  },
  {
    method: "GET",
    pattern: /^\/api(?:\/v1)?\/dashboard\/unit-economics\/unit-econ\/benchmarks\/?$/i,
    query: UNIT_ECONOMICS_COMMON_QUERY_SCHEMA,
  },
  {
    method: "GET",
    pattern: /^\/api(?:\/v1)?\/dashboard\/unit-economics\/unit-econ\/target-gap\/?$/i,
    query: UNIT_ECONOMICS_COMMON_QUERY_SCHEMA,
  },
  {
    method: "GET",
    pattern: /^\/api(?:\/v1)?\/dashboard\/unit-economics\/unit-econ\/denominator-gate\/?$/i,
    query: UNIT_ECONOMICS_COMMON_QUERY_SCHEMA,
  },
  {
    method: "POST",
    pattern: /^\/api(?:\/v1)?\/chatbot\/message\/?$/i,
    body: z.object({
      sessionId: UUID_SCHEMA,
      message: NON_EMPTY_STRING,
    }).strict(),
  },
  {
    method: "GET",
    pattern: /^\/api(?:\/v1)?\/chatbot\/session\/(?<sessionId>[^/]+)\/?$/i,
    params: z.object({
      sessionId: UUID_SCHEMA,
    }).strict(),
  },
  {
    method: "POST",
    pattern: /^\/api(?:\/v1)?\/cloud\/aws\/verify-connection\/?$/i,
    body: z.object({
      accountId: AWS_ACCOUNT_ID_SCHEMA,
      roleName: NON_EMPTY_STRING,
      bucketPrefix: SAFE_STRING.optional(),
      region: AWS_REGION_SCHEMA,
    }).strict(),
  },
  {
    method: "POST",
    pattern: /^\/api(?:\/v1)?\/cloud\/aws\/connect\/?$/i,
    body: z.object({
      accountId: AWS_ACCOUNT_ID_SCHEMA,
      roleName: NON_EMPTY_STRING,
      bucketPrefix: SAFE_STRING.optional(),
      region: AWS_REGION_SCHEMA,
    }).strict(),
  },
  {
    method: "POST",
    pattern: /^\/api(?:\/v1)?\/cloud\/aws\/files\/?$/i,
    body: z.object({
      accountId: AWS_ACCOUNT_ID_SCHEMA,
      roleName: NON_EMPTY_STRING,
      bucketPrefix: SAFE_STRING.optional(),
      region: AWS_REGION_SCHEMA,
      path: SAFE_STRING.optional(),
    }).strict(),
  },
  {
    method: "POST",
    pattern: /^\/api(?:\/v1)?\/cloud\/aws\/ingest\/?$/i,
    body: z.object({
      accountId: AWS_ACCOUNT_ID_SCHEMA,
      roleName: NON_EMPTY_STRING,
      bucketPrefix: SAFE_STRING.optional(),
      region: AWS_REGION_SCHEMA,
      filePath: NON_EMPTY_STRING,
    }).strict(),
  },
  {
    method: "POST",
    pattern: /^(?:\/internal|\/api(?:\/v1)?\/internal)\/cloud-account-credentials\/?$/i,
    body: z.object({
      clientId: UUID_SCHEMA.optional(),
      accountId: AWS_ACCOUNT_ID_SCHEMA,
      accessKey: NON_EMPTY_STRING,
      secretAccessKey: NON_EMPTY_STRING,
      region: AWS_REGION_SCHEMA,
    }).strict(),
  },
  {
    method: "POST",
    pattern: /^\/api(?:\/v1)?\/etl\/s3-ingest\/?$/i,
    body: S3_INGEST_SCHEMA,
  },
  {
    method: "PUT",
    pattern:
      /^\/api(?:\/v1)?\/(?:dashboard\/)?governance\/accounts\/(?<accountId>[^/]+)\/owner\/?$/i,
    params: z.object({
      accountId: NON_EMPTY_STRING,
    }).strict(),
    body: z.object({
      owner: NON_EMPTY_STRING,
      uploadid: z.union([NON_EMPTY_STRING, z.array(NON_EMPTY_STRING)]).optional(),
      uploadId: z.union([NON_EMPTY_STRING, z.array(NON_EMPTY_STRING)]).optional(),
      uploadIds: z.union([NON_EMPTY_STRING, z.array(NON_EMPTY_STRING)]).optional(),
      uploadids: z.union([NON_EMPTY_STRING, z.array(NON_EMPTY_STRING)]).optional(),
    }).strict(),
  },
];

function resolveSchemas(req) {
  const method = String(req.method || "").toUpperCase();
  const path = String(req.path || "");
  let matchedRule = null;
  let matchedPath = null;

  for (const rule of REQUEST_RULES) {
    if (rule.method !== method) continue;
    const match = path.match(rule.pattern);
    if (match) {
      matchedRule = rule;
      matchedPath = match;
      break;
    }
  }

  return {
    matchedPath,
    params: matchedRule?.params || BASE_PARAMS_SCHEMA,
    query: matchedRule?.query || BASE_QUERY_SCHEMA,
    body: matchedRule?.body || BASE_BODY_SCHEMA,
  };
}

function applyParsedInput(req, key, value) {
  if (key === "query") {
    try {
      Object.defineProperty(req, "query", {
        value,
        configurable: true,
        enumerable: true,
        writable: false,
      });
      return;
    } catch {
      const currentQuery = req.query;
      if (isPlainObject(currentQuery)) {
        for (const existingKey of Object.keys(currentQuery)) {
          delete currentQuery[existingKey];
        }
        Object.assign(currentQuery, value);
      }
      return;
    }
  }

  req[key] = value;
}

export function validateRequest(req, _res, next) {
  if (req.method === "OPTIONS") {
    return next();
  }

  try {
    const schemas = resolveSchemas(req);
    const pathParams = schemas.matchedPath?.groups || req.params || {};

    const parsedParams = schemas.params.parse(pathParams);
    const parsedQuery = schemas.query.parse(req.query);
    const parsedBody = schemas.body.parse(req.body);

    applyParsedInput(req, "params", parsedParams);
    applyParsedInput(req, "query", parsedQuery);
    applyParsedInput(req, "body", parsedBody);

    return next();
  } catch {
    return next(new AppError(400, "VALIDATION_ERROR", "Invalid request"));
  }
}
