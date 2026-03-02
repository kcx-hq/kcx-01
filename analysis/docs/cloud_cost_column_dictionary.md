# Cloud Cost Dataset — Column Dictionary + Validation (FOCUS-aligned, Multi-Cloud)

This dataset represents normalized cloud billing line items (FOCUS-inspired) across providers (AWS, Azure/Microsoft, GCP, Oracle, etc.).

For each column:
- **Plain meaning**
- **Client-facing analogy**
- **Dashboard usage**
- **Database type + indexing**
- **Validation / cleaning rules (multi-cloud)**
- **Assumptions**

> Notes:
> - Store timestamps in **UTC** (TIMESTAMPTZ in Postgres).
> - Preserve monetary precision (DECIMAL(38,12)).
> - Do not round or recompute provider-supplied costs; only derive additional metrics in a modeled layer.
> - Keep both **BilledCost** (invoice truth) and **EffectiveCost** (FinOps truth).

---

## AvailabilityZone
**Plain meaning:** Provider-specific availability domain within a region (may be missing).
**Client analogy:** “Which zone inside the region this ran in.”
**Dashboard:** Filter/drill for zone-aware services.
**DB:** `VARCHAR(64)`; index only if frequently filtered.
**Validation / cleaning:**
- Trim; normalize to lowercase for AWS-like values.
- Allow NULL/empty.
- If present, accept patterns such as:
  - AWS: `^[a-z]{2}-[a-z]+-\d[a-z]$` (e.g., `us-east-1a`)
  - GCP: `^[a-z]+-[a-z0-9]+-\d-[a-z]$` (e.g., `us-central1-a`)
  - Azure: often NULL or not in this form.
**Assumptions:** Provider-dependent.

---

## BilledCost
**Plain meaning:** Amount charged/credited on the invoice in BillingCurrency (invoice truth).
**Client analogy:** “What you actually pay (invoice lines).”
**Dashboard:** KPI total spend; invoice reconciliation; finance reporting.
**DB:** `DECIMAL(38,12)`; no index.
**Validation / cleaning:**
- Must parse numeric (allow scientific notation in raw -> cast).
- Allow negatives (credits/adjustments).
- `ABS(value)` reasonable upper bound check (optional, config-driven).
**Assumptions:** Sum(BilledCost) matches invoice total for that scope.

---

## EffectiveCost
**Plain meaning:** Amortized/allocated cost after discounts/commitments (FinOps truth).
**Client analogy:** “True cost after spreading commitments/discounts.”
**Dashboard:** Primary cost optimization metric; show cost by service/resource/tags.
**DB:** `DECIMAL(38,12)` nullable.
**Validation / cleaning:**
- Numeric; allow NULL.
- Allow negatives (rare but possible with adjustments).
- If NULL for some providers, you may fallback to BilledCost in MVP **but document it**.
**Assumptions:** Full accuracy depends on commitment/discount allocation completeness.

---

## BillingAccountId
**Plain meaning:** Provider billing account identifier.
**Client analogy:** “Master payer / billing entity.”
**Dashboard:** Tenant filter; invoice totals by payer.
**DB:** `VARCHAR(256)`; index (btree).
**Validation / cleaning:**
- Trim; must be non-empty for a valid record.
- Treat as opaque string (no format enforcement across providers).
**Assumptions:** Stable within provider.

---

## BillingAccountName
**Plain meaning:** Display name for billing account.
**Client analogy:** “Friendly payer label.”
**Dashboard:** UI label only.
**DB:** `VARCHAR(256)`; no index.
**Validation / cleaning:**
- Trim; allow NULL.
- Backfill via mapping table if available.
**Assumptions:** Optional/unstable display name.

---

## BillingCurrency
**Plain meaning:** Currency code used for billed charges.
**Client analogy:** “Invoice currency.”
**Dashboard:** Currency formatting; multi-currency grouping/conversion layer.
**DB:** `CHAR(3)`; optional index if filtered.
**Validation / cleaning:**
- Uppercase.
- Must match `^[A-Z]{3}$`.
- Optional: validate against ISO-4217 allowlist.
**Assumptions:** ISO-like currency codes.

---

## BillingPeriodStart / BillingPeriodEnd
**Plain meaning:** Invoice period boundaries (start inclusive, end exclusive).
**Client analogy:** “Invoice month start/end.”
**Dashboard:** Monthly slicer; partitions.
**DB:** `TIMESTAMPTZ`; partition on start (or by month); index start.
**Validation / cleaning:**
- Both parseable timestamps.
- `BillingPeriodStart < BillingPeriodEnd`.
- Optional: enforce month boundaries if your provider guarantees it (config-driven).
**Assumptions:** End is exclusive.

---

## ChargeCategory
**Plain meaning:** High-level classification (Usage, Credit, Tax, Adjustment, Fee, etc.).
**Client analogy:** “Spend vs discount vs tax.”
**Dashboard:** Spend mix; exclude taxes if needed; credit reporting.
**DB:** `VARCHAR(32)` (or enum in model layer); index if frequently filtered.
**Validation / cleaning:**
- Trim; normalize canonical casing.
- Enforce allowed set via configurable mapping:
  - Common: `Usage`, `Credit`, `Tax`, `Adjustment`, `Fee`, `Refund`, `Purchase`
- Unknowns allowed but flagged.
**Assumptions:** Providers vary; use mapping table.

---

## ChargeClass
**Plain meaning:** Provider or exporter-specific sub-class of charge (line item family).
**Client analogy:** “Type of billing line.”
**Dashboard:** Optional drilldown; classification QA.
**DB:** `VARCHAR(64)`; no index by default.
**Validation / cleaning:**
- Trim; allow NULL.
- Keep raw values; optionally map to normalized dimension.
**Assumptions:** Not standardized across providers.

---

## ChargeDescription
**Plain meaning:** Human-readable description of the line item.
**Client analogy:** “What this line item is for.”
**Dashboard:** Tooltips; deep drill; anomaly investigation.
**DB:** `TEXT`; no index (optionally trigram index for search in admin tools).
**Validation / cleaning:**
- Trim; allow NULL.
- Remove control characters.
**Assumptions:** Free text.

---

## ChargeFrequency
**Plain meaning:** One-Time, Recurring, or Usage-Based.
**Client analogy:** “Subscription vs pay-as-you-go.”
**Dashboard:** Fixed vs variable spend.
**DB:** `VARCHAR(16)`; optional index.
**Validation / cleaning:**
- Normalize to canonical values: `One-Time`, `Recurring`, `Usage-Based`.
- Unknowns allowed but flagged.
**Assumptions:** FOCUS-aligned semantics.

---

## ChargePeriodStart / ChargePeriodEnd
**Plain meaning:** Time window for the charge (start inclusive, end exclusive).
**Client analogy:** “Meter started/stopped.”
**Dashboard:** Primary time axis (daily/hourly/monthly).
**DB:** `TIMESTAMPTZ`; index on start; partition by date if large.
**Validation / cleaning:**
- Parseable timestamps.
- `ChargePeriodStart < ChargePeriodEnd`.
- Optional: ensure they fall within BillingPeriodStart/End (config-driven).
**Assumptions:** UTC recommended.

---

## CommitmentDiscountCategory / CommitmentDiscountType / CommitmentDiscountStatus
**Plain meaning:** Discount/commitment classification metadata (reservation/savings plan/enterprise credits).
**Client analogy:** “Which discount program applied.”
**Dashboard:** Commitment coverage & utilization; savings reporting.
**DB:** `VARCHAR(64)`; index if you filter often.
**Validation / cleaning:**
- Trim; allow NULL when not applicable.
- Normalize known vocab (config mapping). Unknowns allowed but flagged.
**Assumptions:** Provider-specific terms.

---

## CommitmentDiscountId / CommitmentDiscountName
**Plain meaning:** Identifier/name of discount/commitment instrument.
**Client analogy:** “Which reservation/savings plan.”
**Dashboard:** Drilldown to commitment object.
**DB:** `VARCHAR(256)`; index on Id if used.
**Validation / cleaning:**
- Trim; allow NULL.
- Treat as opaque.
**Assumptions:** Not stable across exporters.

---

## ConsumedQuantity
**Plain meaning:** Actual usage amount.
**Client analogy:** “Meter reading.”
**Dashboard:** Usage trends; unit economics.
**DB:** `DECIMAL(38,12)`; no index.
**Validation / cleaning:**
- Numeric; allow 0; disallow negative unless provider uses reversals (config).
- If negative appears, require ChargeCategory in (Credit/Adjustment) OR flag.
**Assumptions:** May differ from PricingQuantity.

---

## ConsumedUnit
**Plain meaning:** Unit of consumed usage (GB, hours, requests, etc.).
**Client analogy:** “Unit of the meter.”
**Dashboard:** Usage charts; normalize units if needed.
**DB:** `VARCHAR(64)`; no index.
**Validation / cleaning:**
- Trim; allow NULL.
- Normalize common variants (e.g., `Hrs` -> `Hours`, `GBs` -> `GB`) via mapping table.
**Assumptions:** Provider-defined.

---

## PricingQuantity
**Plain meaning:** Billable quantity after pricing rules.
**Client analogy:** “Quantity provider billed you for.”
**Dashboard:** Cost transparency; show ratio (PricingQuantity/ConsumedQuantity).
**DB:** `DECIMAL(38,12)`.
**Validation / cleaning:**
- Numeric; allow NULL.
- Optional: if both quantities present, enforce `>= 0`.
**Assumptions:** Not necessarily equal to ConsumedQuantity.

---

## PricingUnit
**Plain meaning:** Unit for pricing quantity.
**Client analogy:** “Unit the provider priced.”
**Dashboard:** Explain pricing; unit conversions.
**DB:** `VARCHAR(64)`.
**Validation / cleaning:** Same approach as ConsumedUnit.
**Assumptions:** Provider-defined.

---

## PricingCategory
**Plain meaning:** Pricing model bucket (OnDemand, Reserved, Spot, etc.) or exporter category.
**Client analogy:** “How this was priced.”
**Dashboard:** OnDemand vs Spot vs Reserved spend.
**DB:** `VARCHAR(64)`; index if filtered.
**Validation / cleaning:**
- Trim; allow NULL.
- Normalize via mapping table (multi-cloud).
**Assumptions:** Non-standard across providers.

---

## ListUnitPrice / ListCost
**Plain meaning:** Public “sticker” unit price and cost.
**Client analogy:** “Retail price.”
**Dashboard:** Savings (ListCost − EffectiveCost).
**DB:** `DECIMAL(38,12)` nullable.
**Validation / cleaning:**
- Numeric; allow NULL.
- Allow 0 for free tier.
**Assumptions:** Provider-defined list price.

---

## ContractedUnitPrice / ContractedCost
**Plain meaning:** Negotiated enterprise rate before commitment amortization.
**Client analogy:** “Your negotiated rate.”
**Dashboard:** Enterprise discount analytics.
**DB:** `DECIMAL(38,12)` nullable.
**Validation / cleaning:**
- Numeric; allow NULL.
- If present, should be <= List* values (soft check; exceptions exist).
**Assumptions:** Not present for all providers.

---

## ProviderName
**Plain meaning:** Cloud provider (AWS, Microsoft/Azure, GCP, Oracle, etc.).
**Client analogy:** “Which cloud vendor.”
**Dashboard:** Provider filter; multi-cloud rollups.
**DB:** `VARCHAR(32)`; index.
**Validation / cleaning:**
- Trim; normalize canonical names using mapping (`AWS`, `Azure`, `GCP`, `Oracle`, `Alibaba`, etc.).
- Unknowns allowed but flagged.
**Assumptions:** Multi-cloud dataset expected.

---

## PublisherName
**Plain meaning:** Marketplace publisher / software vendor (if applicable).
**Client analogy:** “Who sold this marketplace product.”
**Dashboard:** Marketplace spend by publisher.
**DB:** `VARCHAR(256)`; optional index.
**Validation / cleaning:** Trim; allow NULL.
**Assumptions:** Mostly present for marketplace items.

---

## InvoiceIssuerName
**Plain meaning:** Entity issuing the invoice (provider/partner/reseller).
**Client analogy:** “Who billed you.”
**Dashboard:** Useful for reseller scenarios.
**DB:** `VARCHAR(256)`; optional index.
**Validation / cleaning:** Trim; allow NULL.
**Assumptions:** Provider/reseller dependent.

---

## RegionId / RegionName
**Plain meaning:** Region code and display name.
**Client analogy:** “Geography driving cost.”
**Dashboard:** Cost by region; latency/compliance views.
**DB:** `VARCHAR(64)`; index RegionId if filtered.
**Validation / cleaning:**
- RegionId: trim; allow NULL; treat as opaque (patterns vary).
- RegionName: allow NULL; backfill via lookup.
**Assumptions:** Provider-specific formats.

---

## ServiceCategory / ServiceName
**Plain meaning:** Higher-level group and specific service name.
**Client analogy:** “Compute vs Storage; EC2 vs S3.”
**Dashboard:** Cost by service/category.
**DB:** `VARCHAR(128/256)`; index ServiceName and/or ServiceCategory for common filters.
**Validation / cleaning:**
- Trim; allow NULL.
- Normalize known aliases via mapping table.
**Assumptions:** Naming varies.

---

## ResourceId / ResourceName / ResourceType
**Plain meaning:** Identifiers and type for the resource being charged.
**Client analogy:** “Exact VM/bucket costing money.”
**Dashboard:** Top resources by cost; drilldown.
**DB:** `ResourceId VARCHAR(512)`, `ResourceName VARCHAR(256)`, `ResourceType VARCHAR(128)`.
Index ResourceId only if you query it often (high cardinality).
**Validation / cleaning:**
- Treat as opaque; allow NULL.
- Trim; remove control characters.
**Assumptions:** High cardinality; may be missing for some services.

---

## SkuId / SkuPriceId
**Plain meaning:** SKU identifiers for product and price plan.
**Client analogy:** “Provider’s catalog item + rate identifier.”
**Dashboard:** Pricing drilldown; anomaly detection.
**DB:** `VARCHAR(256)`; index if used for joins to catalog tables.
**Validation / cleaning:** Trim; allow NULL; treat as opaque.
**Assumptions:** Provider/exporter dependent.

---

## SubAccountId / SubAccountName
**Plain meaning:** Subscription/project identifier and display name (child account).
**Client analogy:** “Project/team cost bucket.”
**Dashboard:** Chargeback/showback; team filters.
**DB:** `VARCHAR(256)`; index SubAccountId.
**Validation / cleaning:**
- Trim; SubAccountId should be non-empty for chargeback-ready records (soft rule).
- Maintain a slowly-changing mapping table for Name if needed.
**Assumptions:** One billing account → many sub-accounts.

---

## Tags
**Plain meaning:** JSON metadata applied to resource/charge.
**Client analogy:** “Cost centre, env, BU labels.”
**Dashboard:** Cost by tag key/value; governance.
**DB:** `JSONB` with `GIN` index if heavily filtered.
**Validation / cleaning:**
- Must be valid JSON object when present.
- Normalize keys (trim, lower or preserve-case consistently).
- Remove empty keys; deduplicate keys if exporter duplicates (last-write-wins).
**Assumptions:** Client-defined and messy.

---

## Id
**Plain meaning:** Export row identifier (not stable business key).
**Client analogy:** “Internal row number.”
**Dashboard:** Not shown; ingestion/debug only.
**DB:** `BIGINT` (or `VARCHAR` if not numeric in some providers); optional unique index.
**Validation / cleaning:**
- Keep as-is; do not use as business key.
- Create your own deterministic `charge_id` for dedupe (e.g., hash of key fields).
**Assumptions:** May change between exports.

---

# Recommended Cross-Field Validation Rules (Multi-Cloud)

1. **Time logic**
   - `BillingPeriodStart < BillingPeriodEnd`
   - `ChargePeriodStart < ChargePeriodEnd`
   - Optional: ChargePeriod within billing period.

2. **Currency**
   - BillingCurrency must be `^[A-Z]{3}$`.

3. **Cost & quantity sanity**
   - Costs numeric; allow negatives.
   - Quantities numeric; prefer non-negative; if negative, require ChargeCategory indicates reversal/credit/adjustment.

4. **Normalization mappings**
   - ProviderName canonical mapping.
   - ChargeCategory canonical mapping.
   - Unit normalization mappings.

5. **JSON tags**
   - Valid JSON object or NULL.
