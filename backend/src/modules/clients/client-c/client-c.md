# Client-C Dashboard – Feature Variance & Module Comparison

## Purpose

Client-C represents an **operational and governance-focused customer**.
It is designed to test how the Core Dashboard can be adapted for:

Department-level cost ownership
Strong governance and compliance
Alerting and accountability
Minimal financial engineering (pricing/unit economics)

Client-C intentionally differs from Client-D and Core to validate
**alternative customization paths**.

---

## Design Intent of Client-C

Client-C emphasizes:
**Cost accountability** (departments, projects, owners)
**Governance and alerts**
**Operational efficiency**

Client-C deliberately de-emphasizes:
Advanced pricing analytics
Unit economics
Commitment-heavy financial optimization

---

## Module Classification Legend

| Symbol | Meaning |
|------|--------|
| ✅ | Fully same as Core Dashboard |
| ➕ | Core + additional features |
| ➖ | Reduced / limited vs Core |
| ➕➖ | Modified (extended + reduced) |
| 🆕 | New module (not in Core) |

---

## 1️⃣ Overview Module

**Base:** Core Overview  
**Client-C Type:** ➕ Extended

### Feature Comparison

| Feature | Core | Client-C |
|------|------|------|
| Total Spend KPI | ✅ | ✅ |
| Avg / Peak Spend | ✅ | ✅ |
| Trend Percentage | ✅ | ➕ (department comparison) |
| Forecast KPIs | ❌ | ❌ |
| Service Breakdown | ✅ | ✅ |
| Region Breakdown | ✅ | ✅ |
| Department Breakdown | ❌ | ➕ |

**Notes**
Client-C introduces department visibility at the top level
Forecasting remains out of scope

---

## 2️⃣ Cost Analysis Module

**Base:** Core Cost Analysis  
**Client-C Type:** ➕➖ Modified

### Feature Comparison

| Feature | Core | Client-C |
|------|------|------|
| Daily / Monthly Trends | ✅ | ✅ |
| Group by Service / Region | ✅ | ✅ |
| Group by Department | ❌ | ➕ |
| Predictability Score | ✅ | ✅ |
| Risk / Volatility | ✅ | ➖ |

**Notes**
Keeps analytical depth but removes advanced volatility models

---

## 3️⃣ Cost Drivers Module

**Base:** Core Cost Drivers  
**Client-C Type:** ➕➖ Modified

### Feature Comparison

| Feature | Core | Client-C |
|------|------|------|
| Increase / Decrease Drivers | ✅ | ✅ |
| Period Comparison | ✅ | ✅ |
| Driver Drilldown | ✅ | ➕ (department level) |
| New / Expansion / Deletion | ✅ | ➖ |

**Notes**
Client-C focuses on **who owns the cost**, not lifecycle classification

---

## 4️⃣ Data Explorer Module

**Base:** Core Data Explorer  
**Client-C Type:** ➕ Extended

### Feature Comparison

| Feature | Core | Client-C |
|------|------|------|
| Pagination / Search | ✅ | ✅ |
| Column Filters | ✅ | ✅ |
| Grouped View | ✅ | ✅ |
| CSV Export | ✅ | ➕ (department scoped) |
| Pricing & Unit Columns | ❌ | ❌ |

**Notes**
Data Explorer is used mainly for operational investigation
Pricing internals are intentionally hidden

---

## 5️⃣ Resources Module

**Base:** Core Resources  
**Client-C Type:** ➕ Extended

### Feature Comparison

| Feature | Core | Client-C |
|------|------|------|
| Resource Inventory | ✅ | ✅ |
| Zombie Detection | ✅ | ➕ (department owner aware) |
| Spiking Detection | ✅ | ➕ (alert-driven) |
| Untagged Resources | ✅ | ➕ (mandatory by department) |
| Availability Zone View | ❌ | ❌ |

**Notes**
Client-C strengthens operational accountability
Infrastructure topology views are not required

---

## 6️⃣ Data Quality Module

**Base:** Core Data Quality  
**Client-C Type:** ➕➖ Modified

### Feature Comparison

| Feature | Core | Client-C |
|------|------|------|
| Missing Fields | ✅ | ✅ |
| Invalid Values | ✅ | ✅ |
| Duplicate Detection | ✅ | ➖ |
| Tag Completeness | ✅ | ➕ (required per department) |

**Notes**
Focus on tag correctness over raw data anomalies

---

## 7️⃣ Governance Module

**Base:** Core Governance  
**Client-C Type:** ➕ Extended

### Feature Comparison

| Feature | Core | Client-C |
|------|------|------|
| Tag Compliance % | ✅ | ➕ (per department) |
| Untagged Cost | ✅ | ➕ (department attribution) |
| Ownership Tracking | ✅ | ➕ (mandatory) |
| Policy Violations | ✅ | ➕ (budget & tagging rules) |

**Notes**
Governance is a **primary module** for Client-C

---

## 8️⃣ Optimization Module

**Base:** Core Optimization  
**Client-C Type:** ➕➖ Modified

### Feature Comparison

| Feature | Core | Client-C |
|------|------|------|
| Idle Resources | ✅ | ➕ (department scoped) |
| Right-Sizing | ✅ | ➕ (owner-actionable) |
| Commitment Recommendations | ✅ | ➖ |
| Savings Aggregation | ✅ | ✅ |

**Notes**
Focus on operational savings, not long-term commitments

---

## 9️⃣ Reports Module

**Base:** Core Reports  
**Client-C Type:** ➕ Extended

### Feature Comparison

| Feature | Core | Client-C |
|------|------|------|
| Dashboard Summary | ✅ | ✅ |
| Top Services / Regions | ✅ | ➕ (department split) |
| Monthly Spend Trend | ✅ | ✅ |
| PDF Export | ✅ | ➕ (department-filtered) |

**Notes**
Reports are used for internal accountability and reviews

---

# 🆕 New Client-C Modules (Not in Core)

Client-C introduces **operational and governance-driven modules**.

---

## 10️⃣ Department Cost View 🆕

### Capabilities
Cost by department
Department trend comparison
Department drilldown across services and resources
Department-level accountability

---

## 11️⃣ Cost Alerts Panel 🆕

### Capabilities
Budget threshold alerts
Daily cost spike alerts
Department-based notifications
Tag-driven alert rules

---

## 12️⃣ Project Spend Tracking 🆕

### Capabilities
Project-level cost tracking
Burn rate monitoring
Project vs budget comparison
Tag-based project mapping

---

## Final Summary Matrix

| Module | Client-C Classification |
|------|--------------------------|
| Overview | ➕ Extended |
| Cost Analysis | ➕➖ Modified |
| Cost Drivers | ➕➖ Modified |
| Data Explorer | ➕ Extended |
| Resources | ➕ Extended |
| Data Quality | ➕➖ Modified |
| Governance | ➕ Extended |
| Optimization | ➕➖ Modified |
| Reports | ➕ Extended |
| Department Cost View | 🆕 New |
| Cost Alerts Panel | 🆕 New |
| Project Spend Tracking | 🆕 New |

---

## Key Takeaway

Client-C validates a **governance-heavy, operations-first customization**
strategy for the Core Dashboard:

Strong reuse of core logic
Heavy emphasis on ownership and accountability
Controlled reduction of financial complexity
Clean isolation of new operational modules