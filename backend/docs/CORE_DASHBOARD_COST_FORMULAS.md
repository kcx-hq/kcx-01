# Core Dashboard Cost Formula Reference

This document lists the formulas centralized in:

- `backend/src/common/utils/cost.calculations.js`

and currently used by core dashboard services:

- `backend/src/modules/core-dashboard/overviews/overview.service.js`
- `backend/src/modules/core-dashboard/analytics/cost-analysis/cost-analysis.service.js`
- `backend/src/modules/core-dashboard/reports/reports.service.js`
- `backend/src/modules/core-dashboard/reports/reports.aggregations.js`
- `backend/src/modules/core-dashboard/governance/governance.policies.js`
- `backend/src/modules/core-dashboard/unit-economics/unit-economics.service.js`
- `backend/src/modules/core-dashboard/analytics/cost-drivers/cost-drivers.service.js`
- `backend/src/modules/core-dashboard/optimization/optimization.rules.js`
- `backend/src/modules/core-dashboard/optimization/optimization.service.js`
- `backend/src/modules/core-dashboard/analytics/data-quality/data-quality.service.js`
- `backend/src/modules/core-dashboard/analytics/resources/resources.service.js`

## Base Spend Formulas

1. `Total_Spend = SUM(BilledCost)`
2. `Daily_Spend(date) = SUM(BilledCost) GROUP BY DATE(ChargePeriodStart)`
3. `Daily_Average_Spend = Total_Spend / Days_Elapsed`

## Share and Concentration Formulas

1. `Cost_Share_Percentage = (Entity_Cost / Total_Spend) * 100`
2. `Top_Service_Percent = (Top_Service_Spend / Total_Spend) * 100`
3. `Top_Region_Percent = (Top_Region_Spend / Total_Spend) * 100`
4. `Tagged_Percent = (Tagged_Cost / Total_Cost) * 100`
5. `Untagged_Percent = (Untagged_Cost / Total_Cost) * 100`
6. `Ownership_Percent = (Owned_Resource_Count / Total_Resource_Count) * 100`
7. `Spend_Unattributed_Percent = (Spend_Without_Owner / Total_Spend) * 100`
8. `Governance_Overall_Score = (Tag_Compliance_Percent + Ownership_Percent) / 2`

## Period Change Formulas

1. `Month_Over_Month_Change = Current_Month_Spend - Previous_Month_Spend`
2. `Month_Over_Month_Percentage = ((Current_Month_Spend - Previous_Month_Spend) / Previous_Month_Spend) * 100`
3. `Period_Over_Period_Percentage = ((Current_Period_Spend - Previous_Period_Spend) / Previous_Period_Spend) * 100`

## Daily Trend Formula

1. Split daily totals into two halves:
   - `Previous_Half = SUM(first_half_daily_totals)`
   - `Current_Half = SUM(second_half_daily_totals)`
2. `Split_Period_Trend_Percentage = ((Current_Half - Previous_Half) / Previous_Half) * 100`

## Cost Driver Formulas

1. `Driver_Diff = Current_Period_Cost - Previous_Period_Cost`
2. `Driver_Pct_Change = ((Current_Period_Cost - Previous_Period_Cost) / Previous_Period_Cost) * 100`
3. `Overall_Pct_Change = ((Total_Current - Total_Previous) / Total_Previous) * 100`
4. `Annualized_Impact = Driver_Diff * (365 / Period_Days)`

## Unit Economics Formulas

1. `Unit_Price = Cost / Quantity`
2. `Avg_Unit_Price = Total_Cost / Total_Quantity`
3. `Unit_Price_Change_Pct = ((Current_Unit_Price - Baseline_Unit_Price) / Baseline_Unit_Price) * 100`

## Optimization Formulas

1. `Service_Spend_Percent = (Resource_Cost / Service_Spend) * 100`
2. `Region_Spend_Percent = (Resource_Cost / Region_Spend) * 100`
3. `Cost_Ratio = (Service_Cost / Avg_Service_Cost) * 100`
4. `Coefficient_Of_Variation = (Std_Dev / Mean_Cost) * 100`
5. `On_Demand_Percentage = (On_Demand_Compute_Spend / Total_Compute_Spend) * 100`
6. `Idle_Resource_Savings = Resource_Cost * 0.90`
7. `Commitment_Gap_Potential_Savings = On_Demand_Compute_Spend * 0.25`

## Data Quality Formulas

1. `Untagged_Spend_Percent = (Untagged_Spend / Total_Spend) * 100`
2. `Tag_Key_Compliance_Pct = (Rows_With_Tag_Key / Total_Rows) * 100`
3. `Daily_Bad_Percent = (Bad_Rows_For_Day / Total_Rows_For_Day) * 100`
4. `Daily_Quality_Score = 100 - Daily_Bad_Percent`
5. `Cost_At_Risk = Untagged_Spend`

## Anomaly Formula

1. `Anomaly_Threshold = Mean + (Sigma * StdDev)` where default `Sigma = 2`
2. `Anomaly_Row = row_billedcost > Anomaly_Threshold`

## Period-Aware Daily Average Formula

1. `Inclusive_Day_Count = (End_Date - Start_Date) + 1`
2. `Average_Daily_From_Period = Total_Spend / Inclusive_Day_Count`
3. If period dates are unavailable, fallback:
   - `Average_Daily_From_Period = Total_Spend / fallbackDays`

## Data Quality Formulas in Overview

1. `Untagged_Cost = SUM(BilledCost) WHERE Tags IS NULL OR Tags = {}`
2. `Missing_Metadata_Cost = SUM(BilledCost) WHERE ResourceId IS NULL OR ResourceId = ''`

## Executive Overview Formulas (CFO 30-60s View)

1. `MTD_Spend = Current_Month_Spend`
2. `EOM_Forecast = (MTD_Spend / Days_Elapsed_In_Month) * Total_Days_In_Month`
3. `Budget_Variance_Value = EOM_Forecast - Budget`
4. `Budget_Variance_Percent = (Budget_Variance_Value / Budget) * 100`
5. `Realized_Savings_MTD = SUM(MAX(ListCost - EffectiveCost, 0))`
6. `Pipeline_Savings = SUM(Idle_Savings + RightSizing_Savings + Underutilized_Service_Potential_Savings)`
7. `Unallocated_Spend_Percent = (Unowned_Spend / Total_Tracked_Spend) * 100`
8. `Budget_Consumed_Percent = (MTD_Spend / Budget) * 100`
9. `Month_Elapsed_Percent = (Days_Elapsed_In_Month / Total_Days_In_Month) * 100`
10. `Burn_Variance_To_Pace = Budget_Consumed_Percent - Month_Elapsed_Percent`
11. `Anomaly_Impact_Value = SUM(MAX(Anomaly_Cost - Anomaly_Threshold, 0))`
12. `Owner_Coverage_Percent = (Owned_Spend / Total_Tracked_Spend) * 100`

## Standard Rounding Rule

1. Financial values are normalized with `roundTo(value, 2)` unless a metric requires a different precision.
2. Unit price and similar precision-sensitive values use `roundTo(value, 6)` where needed.
