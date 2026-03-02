# Executive Cloud Financial Overview – PRD
**Version:** 1.0  
**Owner:** FinOps / Finance  
**Audience:** CFO, CEO  
**Last Updated:** <DD-MM-YYYY>  

---

# 1. Purpose

The Executive Cloud Financial Overview dashboard provides a one-page summary of:

- Financial performance vs budget
- Forecast predictability
- Financial risk exposure
- Optimization effectiveness
- Data trustworthiness

The dashboard must enable CFO/CEO to assess financial control within 60 seconds.

---

# 2. Scope

This overview page includes:

1. Financial Snapshot KPIs
2. Risk & Optimization Summary
3. 6-Month Spend Trend
4. Key Financial Drivers
5. Trust & Data Health Indicators

This page does NOT include operational or engineering-level details.

---

# 3. Dashboard Structure

---

# SECTION 1 – Financial Snapshot (Top Row)

## KPIs

### 1. MTD Spend
**Definition:** Total actual cloud cost from start of current month to today.  
**Formula:** `SUM(Actual_Cost_MTD)`  
**Refresh:** Daily  

---

### 2. EOM Forecast
**Definition:** Predicted total cloud spend for current month.  
**Source:** Forecast model output  
**Refresh:** Daily  

---

### 3. Monthly Budget
**Definition:** Approved cloud budget for current month.  
**Source:** Finance-approved budget file  

---

### 4. Budget Variance
**Definition:** Forecasted over/under performance vs budget.  
**Formula:**  

Forecast - Budget
Variance % = (Forecast - Budget) / Budget


**Color Rules:**
- Green → ≤ 0%
- Amber → 0–5% over
- Red → >5% over

---

### 5. Budget Consumed %
**Formula:**  

(MTD Spend / Budget) × 100


---

# SECTION 2 – Risk & Optimization Summary

---

## A. Risk Exposure

### 1. Total Risk Exposure ($)
**Definition:** Sum of financial impact of all active risks.  
**Formula:** `SUM(Active_Risk_Impact)`  

---

### 2. Top 3 Risk Drivers
Highest financial impact risk categories.

Examples:
- Expiring commitments
- Unallocated spend
- Anomalous spikes
- Idle resources

---

### 3. Risk Trend
Month-over-month comparison of total risk exposure.

---

## B. Optimization Impact

### 1. Realized Savings (YTD)
**Definition:** Confirmed savings captured.  
**Formula:** `SUM(Closed_Savings_Items)`  

---

### 2. Potential Savings
**Definition:** Identified but unrealized savings.  
**Formula:** `SUM(Open_Savings_Opportunities)`  

---

### 3. Savings Realization Rate
**Formula:**

Realized / (Realized + Potential)


---

# SECTION 3 – Spend Trend (6-Month View)

## Requirements

- Display last 6 months
- Include:
  - Actual Spend
  - Budget
  - Current Month Forecast

## Purpose
Provide financial trajectory and trend visibility.

---

# SECTION 4 – Key Financial Drivers

---

## A. Top 5 Movers

**Definition:** Largest cost increases or decreases vs previous month.

**Columns:**
- Entity (BU / Service / Account)
- Cost Change ($)
- Cost Change (%)
- Impact on Forecast

Sorted by absolute dollar impact.

---

## B. Top 5 Risks

Sorted by highest financial impact.

**Columns:**
- Risk Name
- Financial Impact ($)
- Owner
- Age (Days Open)
- Status

---

## C. Top 5 Priority Actions

High-impact, executive-level remediation items.

**Columns:**
- Action
- Financial Impact ($)
- Owner
- Expected Completion Date
- Status

---

# SECTION 5 – Trust & Data Health

---

## 1. Trust Score

Composite metric derived from:
- Cost ingestion completeness
- Allocation coverage
- Tag coverage
- Forecast accuracy
- Anomaly stability

Displayed as 0–100 score.

---

## 2. Cost Coverage %


(Ingested Cost / Provider Total Cost) × 100


---

## 3. Allocation Coverage %


(Allocated Cost / Total Cost) × 100


---

## 4. Tag Coverage %


(Tagged Cost / Total Cost) × 100


---

# 6. Executive Status Indicators (Highly Recommended)

## Financial Health
- Green → Forecast within budget
- Amber → ≤5% over
- Red → >5% over

---

## Risk Level
Based on:

Risk Exposure / Monthly Spend


---

## Forecast Confidence
Derived from:
- Historical forecast accuracy
- Trust score
- Anomaly frequency

---

# 7. Data Sources

- Cloud billing exports (AWS/Azure/GCP)
- Finance-approved budget file
- Forecast model output
- Risk register
- Savings register
- Allocation dataset

---

# 8. Refresh Frequency

| Data Type | Frequency |
|-----------|------------|
| Cost Data | Daily |
| Forecast | Daily |
| Risk Register | Daily |
| Savings Data | Daily |
| Trust Metrics | Daily |

---

# 9. Non-Functional Requirements

- Page load < 5 seconds
- Mobile-compatible (tablet minimum)
- PDF export ready
- Finance-approved definitions only
- Drill-down capability available (separate pages)

---

# 10. Out of Scope

- Instance-level optimization
- Service-level deep dive
- Engineering operational metrics
- Detailed anomaly breakdown

---

# 11. Success Criteria

The dashboard is successful when:

- CFO can answer "Are we on track?" in <60 seconds
- Forecast variance drivers are clearly visible
- Financial risk exposure is transparent
- Data reliability is measurable
- No ambiguity in KPI definitions

---

# End of Document