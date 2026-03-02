# Executive Cloud Financial Overview --- Metrics Dictionary (Schema-Referenced)

**Scope Filter (applies to all metrics):**\
billing_usage_fact.uploadid = `<selected_uploadid>`{=html}

**Primary Cost Column:**\
billing_usage_fact.effectivecost\
(Replace with billing_usage_fact.billedcost if invoice-aligned reporting
is required)

------------------------------------------------------------------------

# 1. Financial Snapshot Metrics

## 1.1 MTD Spend

**Definition:** Total cost from start of current month to today.

**Formula:**\
MTD_Spend = Σ billing_usage_fact.effectivecost

Where: - billing_usage_fact.uploadid = `<selected_uploadid>`{=html} -
billing_usage_fact.chargeperiodstart \>= MONTH_START -
billing_usage_fact.chargeperiodstart \< TODAY

**Schema Columns Used:** - billing_usage_fact.uploadid -
billing_usage_fact.chargeperiodstart - billing_usage_fact.effectivecost

------------------------------------------------------------------------

## 1.2 EOM Forecast (Run-Rate)

**Definition:** Projected total cost for current month.

**Formula:**\
EOM_Forecast = MTD_Spend × (DAYS_IN_MONTH / DAYS_ELAPSED)

**Schema Columns Used:** - billing_usage_fact.chargeperiodstart -
billing_usage_fact.effectivecost

------------------------------------------------------------------------

## 1.3 Budget Variance (\$)

Budget_Variance\_\$ = EOM_Forecast − Budget_Monthly

**Note:** Budget_Monthly must be supplied externally (no budget table in
schema).

------------------------------------------------------------------------

## 1.4 Budget Variance (%)

Budget_Variance\_% = (EOM_Forecast − Budget_Monthly) / Budget_Monthly

------------------------------------------------------------------------

## 1.5 Budget Consumed (%)

Budget_Consumed\_% = (MTD_Spend / Budget_Monthly) × 100

------------------------------------------------------------------------

# 2. Spend Trend Metrics

## 2.1 Daily Spend

Daily_Spend(d) = Σ billing_usage_fact.effectivecost

Where: - DATE(billing_usage_fact.chargeperiodstart) = d -
billing_usage_fact.uploadid = `<selected_uploadid>`{=html}

**Schema Columns Used:** - billing_usage_fact.chargeperiodstart -
billing_usage_fact.effectivecost - billing_usage_fact.uploadid

------------------------------------------------------------------------

## 2.2 Monthly Spend

Monthly_Spend(m) = Σ billing_usage_fact.effectivecost

Where: - billing_usage_fact.chargeperiodstart falls within month m

**Schema Columns Used:** - billing_usage_fact.chargeperiodstart -
billing_usage_fact.effectivecost

------------------------------------------------------------------------

# 3. Movers Metrics

Entity X ∈\
- billing_usage_fact.serviceid\
- billing_usage_fact.cloudaccountid\
- billing_usage_fact.regionid\
- billing_usage_fact.subaccountid\
- billing_usage_fact.resourceid

## 3.1 Current MTD Cost by Entity (X)

Cost_Current_MTD(X) = Σ billing_usage_fact.effectivecost

Where: - billing_usage_fact.chargeperiodstart ∈ \[MONTH_START, TODAY) -
billing_usage_fact.uploadid = `<selected_uploadid>`{=html} - Grouped by
entity X

------------------------------------------------------------------------

## 3.2 Prior MTD Same-Days Cost

Cost_Prior_MTD(X) = Σ billing_usage_fact.effectivecost

Where: - billing_usage_fact.chargeperiodstart ∈ \[PREV_MONTH_START,
PRIOR_WINDOW_END\] - billing_usage_fact.uploadid =
`<selected_uploadid>`{=html} - Grouped by entity X

------------------------------------------------------------------------

## 3.3 Mover Change (\$)

Mover_Change\_\$(X) = Cost_Current_MTD(X) − Cost_Prior_MTD(X)

------------------------------------------------------------------------

## 3.4 Mover Change (%)

Mover_Change\_%(X) = Mover_Change\_\$(X) / Cost_Prior_MTD(X)

------------------------------------------------------------------------

# 4. Risk Exposure (Derived from Schema)

## 4.1 Untagged Spend (MTD)

Untagged_Spend_MTD = Σ billing_usage_fact.effectivecost

Where: - billing_usage_fact.chargeperiodstart ∈ \[MONTH_START, TODAY) -
Required keys missing in billing_usage_fact.tags

**Schema Columns Used:** - billing_usage_fact.effectivecost -
billing_usage_fact.chargeperiodstart - billing_usage_fact.tags

------------------------------------------------------------------------

## 4.2 Non-Commitment Spend (MTD)

NonCommitment_Spend_MTD = Σ billing_usage_fact.effectivecost

Where: - billing_usage_fact.commitmentdiscountid IS NULL

**Schema Columns Used:** - billing_usage_fact.effectivecost -
billing_usage_fact.commitmentdiscountid -
billing_usage_fact.chargeperiodstart

------------------------------------------------------------------------

## 4.3 Anomaly Risk Exposure

Daily_Spend(d, X) = Σ billing_usage_fact.effectivecost\
Where DATE(billing_usage_fact.chargeperiodstart) = d\
Grouped by entity X

Spike_Impact(X) = MAX(0, Daily_Spend(TODAY, X) − Baseline_28D_Median(X))

Total_Anomaly_Risk = Σ Spike_Impact(X)

------------------------------------------------------------------------

## 4.4 Total Risk Exposure (Proxy)

Total_Risk_Exposure =\
Anomaly_Risk + Untagged_Spend_MTD + NonCommitment_Spend_MTD

------------------------------------------------------------------------

# 5. Optimization Metrics

## 5.1 Realized Savings

Not computable from current schema.\
Requires savings table with amount_realized and status.

------------------------------------------------------------------------

## 5.2 Potential Savings

Not computable from current schema.\
Requires opportunity table with amount_potential and status.

------------------------------------------------------------------------

## 5.3 Savings Realization Rate

Savings_Realization_Rate =\
Realized_Savings / (Realized_Savings + Potential_Savings)

(Not computable without savings tables)

------------------------------------------------------------------------

# 6. Trust & Data Health Metrics

## 6.1 Total Cost (MTD)

Total_Cost_MTD = Σ billing_usage_fact.effectivecost

Where: - billing_usage_fact.chargeperiodstart ∈ \[MONTH_START, TODAY)

------------------------------------------------------------------------

## 6.2 Tag Coverage (%)

Tagged_Cost_MTD = Σ billing_usage_fact.effectivecost

Where required tag keys exist in billing_usage_fact.tags

Tag_Coverage\_% = Tagged_Cost_MTD / Total_Cost_MTD

------------------------------------------------------------------------

## 6.3 Allocation Coverage (% -- Proxy via tag)

Allocated_Cost_MTD = Σ billing_usage_fact.effectivecost

Where allocation tag key exists in billing_usage_fact.tags

Allocation_Coverage\_% = Allocated_Cost_MTD / Total_Cost_MTD

------------------------------------------------------------------------

## 6.4 Freshness (Days)

Latest_Data_Timestamp = MAX(billing_usage_fact.chargeperiodstart)

Freshness_Days = TODAY − Latest_Data_Timestamp

------------------------------------------------------------------------

## 6.5 Trust Score (0--100)

Trust_Score =\
0.40 × (100 × Tag_Coverage\_%) +\
0.40 × (100 × Allocation_Coverage\_%) +\
0.20 × Freshness_Score

------------------------------------------------------------------------

# 7. Executive Indicators

## 7.1 Risk Level

Risk_Level_Ratio = Total_Risk_Exposure / MTD_Spend

------------------------------------------------------------------------

## 7.2 Financial Health

Based on Budget_Variance\_% thresholds.\
(Budget not present in schema)

------------------------------------------------------------------------

## 7.3 Forecast Confidence (Proxy)

Forecast_Confidence = Function(Tag_Coverage\_%, Freshness_Days,
Anomaly_Frequency)

------------------------------------------------------------------------

# Schema Coverage Summary

## Fully Supported by Current Schema

-   Spend metrics
-   Forecast (run-rate)
-   Movers
-   Trends
-   Tag coverage
-   Allocation proxy
-   Freshness
-   Commitment-based spend
-   Derived risk exposure

## Not Supported Without Additional Tables

-   Budget
-   Realized savings
-   Potential savings
-   Workflow actions
-   Risk register with owner/status
-   Alert lifecycle
-   True provider cost reconciliation

------------------------------------------------------------------------


