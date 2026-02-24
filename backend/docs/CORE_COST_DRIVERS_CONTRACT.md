# Core Dashboard: Cost Drivers Contract (v1)

Formula reference:
- `backend/docs/CORE_COST_DRIVERS_FORMULAS.md`

## Version
- `schemaVersion`: `cost_drivers_contract_v1`
- `engineVersion`: `cost_drivers_v2.1` (from `runMeta.engineVersion`)

## API Endpoints
- `GET /analytics/cost-drivers/analysis`
- `POST /analytics/cost-drivers/details`

## Analysis Response Shape
```json
{
  "schemaVersion": "cost_drivers_contract_v1",
  "controls": {
    "timeRange": "30d",
    "compareTo": "previous_period",
    "costBasis": "actual",
    "startDate": "2026-01-01",
    "endDate": "2026-01-30",
    "previousStartDate": "2025-12-02",
    "previousEndDate": "2025-12-31",
    "activeDimension": "service",
    "options": {
      "timeRanges": ["7d","30d","90d","mtd","qtd","custom"],
      "compareTo": ["previous_period","same_period_last_month","custom_previous","none"],
      "costBasis": ["actual","amortized","net"],
      "dimensions": ["service","account","region","team","sku"]
    }
  },
  "periodWindows": {
    "current": { "startDate": "2026-01-01", "endDate": "2026-01-30", "days": 30 },
    "previous": { "startDate": "2025-12-02", "endDate": "2025-12-31", "days": 30 },
    "latestBillingDate": "2026-01-30"
  },
  "varianceSummary": {
    "previousPeriodSpend": 0,
    "currentPeriodSpend": 0,
    "netChange": 0,
    "netChangePercent": 0,
    "explainedPercent": 0,
    "top3ContributorsPercent": 0,
    "explainedValue": 0,
    "unexplainedValue": 0
  },
  "kpiStrip": [
    {
      "id": "net_change",
      "label": "Net Change",
      "value": 0,
      "secondaryValue": 0,
      "valueType": "currency_with_percent",
      "formulaId": "current_minus_previous",
      "tooltip": "...",
      "drilldown": { "type": "waterfall", "target": "net_change" },
      "sourceMetricIds": ["currentPeriodSpend","previousPeriodSpend","netChange","netChangePercent"],
      "insight": {
        "title": "Net Variance Movement",
        "summary": "...",
        "points": ["Current window: ...", "Comparison window: ..."]
      }
    }
  ],
  "waterfall": {
    "startValue": 0,
    "endValue": 0,
    "steps": [
      {
        "id": "usageGrowth",
        "label": "Usage Growth",
        "value": 0,
        "direction": "increase",
        "order": 2,
        "driverType": "usage_growth",
        "contributionPctNet": 0,
        "contributionAbsPct": 0
      }
    ],
    "validation": {
      "computedEnd": 0,
      "expectedEnd": 0,
      "deltaDifference": 0,
      "isBalanced": true
    }
  },
  "trendComparison": {
    "granularity": "daily",
    "series": [
      {
        "index": 1,
        "date": "2026-01-01",
        "currentSpend": 0,
        "previousSpend": 0,
        "deltaValue": 0,
        "explainedValue": 0,
        "residualValue": 0,
        "residualAbsPctOfDelta": 0,
        "driverTags": ["Amazon EC2"]
      }
    ],
    "residualOverlay": {
      "unexplainedValue": 0,
      "unexplainedPercentOfNet": 0,
      "thresholdPercent": 5,
      "alert": false,
      "severity": "low"
    },
    "windows": {
      "current": { "startDate": "2026-01-01", "endDate": "2026-01-30", "days": 30 },
      "previous": { "startDate": "2025-12-02", "endDate": "2025-12-31", "days": 30 }
    }
  },
  "decomposition": {
    "activeTab": "service",
    "tabs": {
      "service": {
        "title": "By Service",
        "rows": [],
        "totalRows": 0,
        "noiseThresholdApplied": 0,
        "omittedByThreshold": 0,
        "omittedByRowLimit": 0
      }
    },
    "materiality": {
      "thresholdValue": 0.01,
      "thresholdRule": "max(userMinChange, 0.5% of |net change|, 0.01)"
    }
  },
  "unexplainedVariance": {
    "value": 0,
    "modelResidualValue": 0,
    "roundingResidualValue": 0,
    "percentOfNetChange": 0,
    "severity": "low",
    "thresholdPercent": 5,
    "governanceWarnings": [],
    "checks": {}
  },
  "attributionConfidence": {
    "score": 0,
    "level": "low",
    "rules": [
      { "id": "currency_consistency", "label": "Currency Consistency", "status": "pass" }
    ],
    "signals": {}
  },
  "runMeta": {
    "runId": "cdr_xxx",
    "generatedAt": "2026-02-24T04:19:00.000Z",
    "engineVersion": "cost_drivers_v2.1",
    "sourceSignature": "sha1...",
    "rowLimitApplied": 100,
    "uploadCount": 1,
    "uploadIds": ["..."],
    "rawRowCount": 993,
    "scopedRowCount": 993,
    "rowsInWindow": 993
  },
  "executiveInsights": {
    "bullets": [
      {
        "id": "top_increase_driver",
        "severity": "medium",
        "title": "...",
        "detail": "...",
        "sourceMetricIds": ["decomposition.service", "netChange"],
        "evidencePayload": { "dimension": "service", "driverKey": "..." }
      }
    ]
  },
  "trust": {
    "checks": {},
    "riskLevel": "low"
  },
  "drilldown": {
    "activeDimension": "service",
    "topRows": [],
    "detailApi": "/analytics/cost-drivers/details"
  }
}
```

## Driver Details Response Shape
```json
{
  "schemaVersion": "cost_drivers_contract_v1",
  "summary": {},
  "trend": [],
  "resourceBreakdown": [],
  "topSkuChanges": [],
  "trendData": [],
  "subDrivers": [],
  "topResources": [],
  "annualizedImpact": 0,
  "insightText": "",
  "links": {
    "billingExplorer": "/dashboard/data-explorer",
    "resourceExplorer": "/dashboard/resources",
    "optimization": "/dashboard/optimization"
  },
  "actionPayload": null,
  "context": {
    "schemaVersion": "cost_drivers_contract_v1",
    "controls": {},
    "unexplainedVariance": {}
  }
}
```

## Frontend Component Contract Mapping
- `CostDrivers.tsx`
  - state control + wiring only
- `CostDriversView.tsx`
  - orchestration only
- `KpiStripSection.tsx`
  - reads `kpiStrip[*].insight`, no formula derivation
- `WaterfallSection.tsx`
  - reads `waterfall.steps[*].driverType`, `contributionPctNet`, `contributionAbsPct`
- `DecompositionSection.tsx`
  - reads table rows as precomputed by backend
- `UnexplainedVarianceSection.tsx`
  - reads `unexplainedVariance`, `attributionConfidence`, `runMeta`
- `DriverDetailModal.tsx`
  - reads detail payload directly, no business transformations

## Ownership Rule
- Financial math and driver attribution stay in backend.
- Frontend only renders and formats values.
