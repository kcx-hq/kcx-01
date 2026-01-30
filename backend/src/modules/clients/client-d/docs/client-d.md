# Client-D Dashboard – Feature Variance & Module Comparison

## Purpose

Client-D is a **testing-phase client dashboard** designed to validate different ways
core-dashboard modules can be reused, extended, reduced, or replaced.

This document defines **how Client-D differs from Core Dashboard at the module
and feature level**, without introducing API or routing details.

---

## Design Goals

Client-D intentionally includes:
- Modules that are **identical** to core
- Modules that are **extended beyond core**
- Modules that are **reduced compared to core**
- A small number of **new modules** derived from billing data

This allows testing of:
- Feature flags
- Partial overrides
- Capability-based configuration
- Safe client-specific customization

---

## Module Classification

| Type | Meaning |
|----|----|
| Same | Uses core-dashboard module without change |
| Extended | Core module + additional features |
| Reduced | Core module with some features disabled |
| Modified | Combination of extended and reduced |
| New | Module does not exist in core-dashboard |

---

## 1. Overview Module

**Base:** Core Overview  
**Client-D Type:** Reduced

### Feature Comparison

| Feature | Core | Client-D |
|------|------|------|
| Total Spend KPI | ✔ | ✔ |
| Average Daily Spend | ✔ | ✔ |
| Peak Usage | ✔ | ✖ |
| Trend Percentage | ✔ | ✔ |
| Service Breakdown | ✔ | ✔ |
| Region Breakdown | ✔ | ✖ |

**Notes**
- Client-D simplifies the overview for high-level visibility
- Focuses only on service-level insights

---

## 2. Cost Analysis Module

**Base:** Core Cost Analysis  
**Client-D Type:** Reduced

### Feature Comparison

| Feature | Core | Client-D |
|------|------|------|
| Daily Trends | ✔ | ✔ |
| Monthly Trends | ✔ | ✔ |
| Predictability Score | ✔ | ✖ |
| Risk / Volatility Analysis | ✔ | ✖ |
| Group By Service / Region | ✔ | ✔ |

**Notes**
- Advanced statistical insights are intentionally disabled
- Core trend analysis logic is reused

---

## 3. Cost Drivers Module

**Base:** Core Cost Drivers  
**Client-D Type:** Extended

### Feature Comparison

| Feature | Core | Client-D |
|------|------|------|
| Cost Increase / Decrease | ✔ | ✔ |
| Period Comparison | ✔ | ✔ |
| Driver Drilldown | ✔ | ✔ |
| SKU-level Drivers | ✖ | ✔ |
| Commitment-based Attribution | ✖ | ✔ |

**Notes**
- Client-D adds pricing and SKU awareness on top of core logic

---

## 4. Data Explorer Module

**Base:** Core Data Explorer  
**Client-D Type:** Extended

### Feature Comparison

| Feature | Core | Client-D |
|------|------|------|
| Pagination & Search | ✔ | ✔ |
| Column Filters | ✔ | ✔ |
| Grouped View | ✔ | ✖ |
| CSV Export | ✔ | ✔ |
| Pricing Columns | ✖ | ✔ |
| Quantity & Unit Columns | ✖ | ✔ |
| Commitment Metadata | ✖ | ✔ |

**Notes**
- Client-D focuses on detailed financial exploration
- Grouped views are disabled for simplicity

---

## 5. Resources Module

**Base:** Core Resources  
**Client-D Type:** Modified

### Feature Comparison

| Feature | Core | Client-D |
|------|------|------|
| Resource Inventory | ✔ | ✔ |
| Zombie Resource Detection | ✔ | ✖ |
| Spiking Detection | ✔ | ✖ |
| Untagged Resources | ✔ | ✔ |
| Availability Zone Visibility | ✖ | ✔ |

**Notes**
- Operational alerts are reduced
- Infrastructure topology visibility is enhanced

---

## 6. Data Quality Module

**Base:** Core Data Quality  
**Client-D Type:** Modified

### Feature Comparison

| Feature | Core | Client-D |
|------|------|------|
| Missing Field Detection | ✔ | ✔ |
| Invalid Value Detection | ✔ | ✖ |
| Duplicate Detection | ✔ | ✖ |
| Tag Completeness (Per Key) | ✔ (generic) | ✔ (per tag dimension) |

**Notes**
- Client-D emphasizes tag quality over record-level anomalies

---

## 7. Governance Module

**Base:** Core Governance  
**Client-D Type:** Reduced

### Feature Comparison

| Feature | Core | Client-D |
|------|------|------|
| Tag Compliance Percentage | ✔ | ✔ |
| Untagged Cost | ✔ | ✔ |
| Ownership Assignment | ✔ | ✖ |
| Policy Violation Tracking | ✔ | ✖ |

**Notes**
- Client-D limits governance scope to tagging compliance only

---

## 8. Optimization Module

**Base:** Core Optimization  
**Client-D Type:** Modified

### Feature Comparison

| Feature | Core | Client-D |
|------|------|------|
| Idle Resource Detection | ✔ | Limited |
| Right-Sizing Recommendations | ✔ | Limited |
| Commitment Optimization | ✔ | ✔ (pricing-aware) |
| Savings Summary | ✔ | ✔ |

**Notes**
- Client-D focuses on financial optimization over operational tuning

---

## 9. Reports Module

**Base:** Core Reports  
**Client-D Type:** Reduced

### Feature Comparison

| Feature | Core | Client-D |
|------|------|------|
| Summary Report | ✔ | ✔ |
| Top Services / Regions | ✔ | ✔ |
| Long-term Trends | ✔ | ✖ |
| PDF Export | ✔ | ✖ |

**Notes**
- Client-D reports are optimized for quick review
- Long-range and export-heavy features are excluded

---

## New Client-D Modules (Not in Core)

---

## 10. Rate & Discount Analytics

**Type:** New Module

### Capabilities
- Effective discount percentage
- List vs effective cost comparison
- Committed vs on-demand spend analysis
- Savings attribution by commitment

**Data Driven By**
- List cost and effective cost fields
- Contracted pricing metadata
- Commitment and pricing category attributes

---

## 11. Unit Economics

**Type:** New Module

### Capabilities
- Cost per unit metrics
- Unit price trends
- Unit price drift detection
- SKU-level cost efficiency analysis

**Data Driven By**
- Consumption quantity and units
- Unit pricing fields
- SKU identifiers

---

## Final Summary Matrix

| Module | Client-D Classification |
|----|----|
| Overview | Reduced |
| Cost Analysis | Reduced |
| Cost Drivers | Extended |
| Data Explorer | Extended |
| Resources | Modified |
| Data Quality | Modified |
| Governance | Reduced |
| Optimization | Modified |
| Reports | Reduced |
| Rate & Discount Analytics | New |
| Unit Economics | New |

---

## Key Takeaway

Client-D demonstrates a **controlled, intentional deviation** from core-dashboard:
- Core logic is reused wherever possible
- Feature variance is configuration-driven
- New capabilities are isolated into standalone modules

This makes Client-D an ideal testbed for future enterprise customization.
