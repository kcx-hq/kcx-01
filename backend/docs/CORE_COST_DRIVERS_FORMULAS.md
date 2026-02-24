# Core Dashboard: Cost Drivers Formula Guide

This document explains how the **Cost Drivers** section calculates values, what each metric means, and small examples for business understanding.

Source implementation:
- `backend/src/modules/core-dashboard/analytics/cost-drivers/cost-drivers.service.js`

---

## 1) Period Scope and Cost Basis

### 1.1 Available billing days
- Build billing day keys from scoped rows.
- Exclude future dates (`day > today`).

### 1.2 Current window selection
- `Nd` (for example `30d`): take latest `N` available billing days.
- `mtd`: all days in month of latest billing day.
- `qtd`: all days from quarter start to latest billing day.
- `custom`: between selected `startDate` and `endDate` (inclusive).

### 1.3 Previous window selection
- `previous_period`: equal-length window immediately before current window.
- `same_period_last_month`: shifted 1 month back when available.
- `custom_previous`: explicit previous range.
- `none`: empty previous window.

### 1.4 Cost basis
- `actual`: `BilledCost`
- `amortized`: `EffectiveCost` (fallback to billed if missing)
- `net`: `ContractedCost` (fallback to effective if missing)

Example:
- If basis is `actual`, row cost used in all sums is `BilledCost`.

---

## 2) Variance Summary KPIs

### 2.1 Previous Period Spend
- Formula: `Previous = SUM(cost in previous window)`

### 2.2 Current Period Spend
- Formula: `Current = SUM(cost in current window)`

### 2.3 Net Change
- Formula: `NetChange = Current - Previous`
- Percent: `NetChange% = ((Current - Previous) / Previous) * 100` (with safe zero handling)

### 2.4 Explained Value
- Formula: `ExplainedValue = SUM(all classified driver buckets)`

### 2.5 Unexplained Value
- Formula: `UnexplainedValue = NetChange - ExplainedValue`

### 2.6 Explained Percent
- Formula: `Explained% = 100 - (|UnexplainedValue| / |NetChange| * 100)`
- If net change is zero, special handling keeps output stable.

### 2.7 Top 3 Contributors Percent
- Service-level concentration:
- `Top3% = SUM(|Top3 Service Delta|) / SUM(|All Service Deltas|) * 100`

Small example:
- Previous = `$100.00`, Current = `$130.00` -> Net = `+$30.00`
- Classified drivers sum to `+$27.50`
- Unexplained = `$2.50`
- Explained% = `100 - (2.5/30*100) = 91.67%`

---

## 3) Driver Classification Logic (Waterfall Core)

Classification is first done at line granularity (`service+account+region+team+sku+resource`) for **non-credit** rows.

Driver categories:
- `newServicesResources`
- `usageGrowth`
- `ratePriceChange`
- `mixShift`
- `creditsDiscountChange`
- `savingsRemovals`

### 3.1 New services/resources
- Condition: `previousSpend = 0` and `currentSpend > 0`
- Contribution: `delta`

### 3.2 Savings/removals
- Condition: `currentSpend = 0` and `previousSpend > 0`
- Contribution: `delta` (typically negative)

### 3.3 Usage / rate / mix split
For lines with both periods present:
- `prevRate = prevSpend / prevQty`
- `currRate = currSpend / currQty`
- `usageGrowth = (currQty - prevQty) * prevRate`
- `ratePriceChange = (currRate - prevRate) * currQty`
- `mixShift = delta - usageGrowth - ratePriceChange`

If quantities are not usable (`prevQty <= 0` or `currQty <= 0`):
- Entire delta goes to `mixShift`.

### 3.4 Credits/discount change
- Rows detected as credit/discount-like are assigned to:
- `creditsDiscountChange = currentCreditSpend - previousCreditSpend`

Small example:
- Previous spend `50`, qty `10` -> prevRate `5`
- Current spend `68`, qty `12` -> currRate `5.67`
- Delta = `+18`
- Usage growth = `(12-10)*5 = +10`
- Rate change = `(5.67-5)*12 = +8.04`
- Mix shift = `18 - 10 - 8.04 = -0.04`

---

## 4) Waterfall and Reconciliation

### 4.1 Waterfall start/end
- Start: `PreviousPeriodSpend`
- End: `CurrentPeriodSpend`

### 4.2 Rounded components
- Core driver steps are rounded to 2 decimals.
- `ModelResidualRounded = round(UnexplainedValue, 2)`

### 4.3 Rounding residual
- `RoundingResidual = RoundedNetChange - (RoundedCoreDriverSum + ModelResidualRounded)`

### 4.4 Validation
- `ComputedEnd = Previous + SUM(all waterfall steps)`
- `DeltaDifference = ExpectedEnd - ComputedEnd`
- Balanced when `|DeltaDifference| <= 0.01`

Small example:
- Rounded net change = `28.00`
- Rounded core sum = `27.99`
- Model residual rounded = `0.00`
- Rounding residual = `0.01`

---

## 5) Decomposition Table (Row Columns)

For selected dimension (`service/account/region/team/sku`):

### 5.1 Previous / Current
- `previousSpend` and `currentSpend` are grouped sums in each window.

### 5.2 Delta
- `deltaValue = currentSpend - previousSpend`

### 5.3 Delta %
- Uses period growth formula with safe zero handling.
- Display rules:
- `NEW` when previous is 0 and current > 0
- `REMOVED` when current is 0 and previous > 0

### 5.4 Driver Type
- Dominant driver bucket by absolute contribution
- (or forced to New/Savings by zero-baseline rules).

### 5.5 Contribution
- `contributionPercent = deltaValue / |NetChange| * 100` (signed)
- `contributionScore = |contributionPercent|`

### 5.6 Risk
- Compute unexplained row share:
- `rowUnexplained% = |unexplainedContribution| / |NetChange| * 100`
- `HIGH`: `contributionScore >= 25` or `rowUnexplained% >= 10`
- `MEDIUM`: `contributionScore >= 10` or `rowUnexplained% >= 5`
- Else `LOW`

Small example:
- Net change = `+40`
- Service A delta = `+12`
- Contribution score = `|12/40*100| = 30%` -> high materiality.

---

## 6) Materiality and Omission

### 6.1 Threshold rule
- `NoiseThreshold = max(userMinChange, 0.5% of |NetChange|, 0.01)`

### 6.2 Omitted by threshold
- Count rows where `|deltaValue| < NoiseThreshold`.

### 6.3 Omitted by row limit
- After threshold filter, rows above `rowLimit` are omitted from UI list.

Small example:
- `|NetChange| = 20` -> `0.5% = 0.10`
- `userMinChange = 0`
- Threshold = `max(0,0.10,0.01)=0.10`
- Any row with `|delta| < 0.10` is removed as noise.

---

## 7) Trend Comparison and Residual Overlay

For each aligned day index:
- `dailyDelta = currentSpend(day) - previousSpend(day)`
- `dailyResidual = (dailyDelta * totalUnexplained) / roundedNetChange`
- `dailyExplained = dailyDelta - dailyResidual`
- `residualAbsPctOfDelta = |dailyResidual| / |dailyDelta| * 100`

Purpose:
- Shows how unexplained variance is distributed across time points.

---

## 8) Unexplained Panel Metrics

### 8.1 Unexplained value
- `roundedUnexplained = modelResidualRounded + roundingResidual`

### 8.2 Unexplained percent of net
- `Unexplained% = |roundedUnexplained| / |RoundedNetChange| * 100`

### 8.3 Severity
- `HIGH` if `Unexplained% >= 5`
- `MEDIUM` if `>= 2 and < 5`
- `LOW` if `< 2`

---

## 9) Attribution Confidence (Score out of 100)

Start from `100`, apply penalties:
- Currency inconsistency: `-25`
- Model residual percent: `>5 => -20`, `>2 => -10`
- Usage/rate coverage: `<40 => -20`, `<70 => -10`
- Missing ownership mapping: `>20 => -15`, `>10 => -8`
- SKU mapping coverage `<85`: `-10`
- Period completeness `<90`: `-10`
- Multi-provider with low concentration (`topProviderShare < 70`): `-5`

Final:
- Clamp to `0..100`
- `High >= 80`, `Medium >= 60`, `Low < 60`

Rule statuses shown in UI:
- Currency Consistency: pass/fail
- Model Residual: pass/warn/fail
- Usage/Rate Coverage: pass/warn/fail
- Ownership Mapping: pass/warn/fail

Small example:
- Start 100
- Model residual 4% (`-10`)
- Usage/rate coverage 55% (`-10`)
- Missing ownership 12% (`-8`)
- Final = `72` -> `Medium`

---

## 10) Governance/Trust Checks Used

- `periodDataCompleteness% = observedCurrentDays / expectedCurrentDays * 100`
- `missingTagSpend% = unmappedTeamCurrentSpend / totalCurrentSpend * 100`
- `skuMappingCoverage% = (totalCurrentSpend - missingSkuCurrentSpend) / totalCurrentSpend * 100`
- `currencyConsistency`: single vs multiple currency set
- `quantityCoverage% = quantityEligibleAbsDelta / nonCreditAbsDelta * 100`

These checks generate warnings and affect confidence.

---

## 11) Why This Matters for Client

- Finance/CFO: gets mathematically reconcilable variance explanation.
- Engineering leaders: sees if movement is usage, rate, new workload, or credit shift.
- FinOps: can separate model gaps vs data-quality gaps (`model residual` vs `rounding residual`).
- Governance: gets explicit trust score and blockers before reporting sign-off.

