export const CAPABILITIES_MAP = {
  /**
   * CORE (default / base platform)
   * Uses: /api/dashboard/<module>/...
   */
  core: {
    clientId: "core",
    apiBase: "/api/dashboard",
    dashboard : "/dashboard",
    modules: {
      overview: {
        enabled: true,
        endpoints: {
          overview: { method: "GET", path: "/overview" },
          anomalies: { method: "GET", path: "/overview/anomalies" },
          filters: { method: "GET", path: "/overview/filters" },
          dataExplorer: { method: "GET", path: "/overview/data-explorer" },
          exportCsv: {
            method: "GET",
            path: "/overview/data-explorer/export-csv",
          },
        },
      },

      reports: {
        enabled: true,
        endpoints: {
          summary: { method: "GET", path: "/reports/summary" },
          topServices: { method: "GET", path: "/reports/top-services" },
          topRegions: { method: "GET", path: "/reports/top-regions" },
          monthlySpend: { method: "GET", path: "/reports/monthly-spend" },
          tagCompliance: { method: "GET", path: "/reports/tag-compliance" },
          environmentBreakdown: {
            method: "GET",
            path: "/reports/environment-breakdown",
          },
          downloadPdf: {
            method: "POST",
            path: "/reports/download",
            responseType: "blob",
          },
        },
      },

      optimization: {
        enabled: true,
        endpoints: {
          recommendations: {
            method: "GET",
            path: "/optimization/recommendations",
          },
          idleResources: {
            method: "GET",
            path: "/optimization/idle-resources",
          },
          opportunities: {
            method: "GET",
            path: "/optimization/opportunities",
          },
          commitments: {
            method: "GET",
            path: "/optimization/commitments",
          },
          tracker: {
            method: "GET",
            path: "/optimization/tracker",
          },
          actionCenter: {
            method: "GET",
            path: "/optimization/action-center",
          },
          rightSizing: {
            method: "GET",
            path: "/optimization/right-sizing",
          },
        },
      },

      governance: {
        enabled: true,
        endpoints: {
          summary: { method: "GET", path: "/governance/summary" },
          compliance: { method: "GET", path: "/governance/compliance" },
          accounts: { method: "GET", path: "/governance/accounts" },
          updateOwner: {
            method: "PUT",
            path: "/governance/accounts/:accountId/owner",
          },
        },
      },

      costAnalysis: {
        enabled: true,
        endpoints: {
          costAnalysis: {
            method: "GET",
            path: "/analytics/cost-analysis/analysis",
          },
          costAnalysisKpis: {
            method: "GET",
            path: "/analytics/cost-analysis/kpis",
          },
          costAnalysisTrend: {
            method: "GET",
            path: "/analytics/cost-analysis/trend",
          },
          costAnalysisBreakdown: {
            method: "GET",
            path: "/analytics/cost-analysis/breakdown",
          },
          costAnalysisConcentration: {
            method: "GET",
            path: "/analytics/cost-analysis/concentration",
          },
          costAnalysisAnomalyImpact: {
            method: "GET",
            path: "/analytics/cost-analysis/anomaly-impact",
          },
          costFilters: {
            method: "GET",
            path: "/analytics/cost-analysis/filters",
          },
        },
      },

      costDrivers: {
        enabled: true,
        endpoints: {
          costDrivers: {
            method: "GET",
            path: "/analytics/cost-drivers/analysis",
          },
          driverDetails: {
            method: "POST",
            path: "/analytics/cost-drivers/details",
          },
        },
      },

      dataQuality: {
        enabled: true,
        endpoints: {
          analysis: {
            method: "GET",
            path: "/analytics/data-quality/analysis",
          },
          banner: {
            method: "GET",
            path: "/analytics/data-quality/governance-data-health/banner",
          },
          freshness: {
            method: "GET",
            path: "/analytics/data-quality/governance-data-health/freshness",
          },
          coverage: {
            method: "GET",
            path: "/analytics/data-quality/governance-data-health/coverage",
          },
          tagCompliance: {
            method: "GET",
            path: "/analytics/data-quality/governance-data-health/tag-compliance",
          },
          ownershipCompleteness: {
            method: "GET",
            path: "/analytics/data-quality/governance-data-health/ownership-completeness",
          },
          currencyBasis: {
            method: "GET",
            path: "/analytics/data-quality/governance-data-health/currency-basis",
          },
          denominatorQuality: {
            method: "GET",
            path: "/analytics/data-quality/governance-data-health/denominator-quality",
          },
          controlViolations: {
            method: "GET",
            path: "/analytics/data-quality/governance-data-health/control-violations",
          },
        },
      },

      resources: {
        enabled: true,
        endpoints: {
          inventory: {
            method: "GET",
            path: "/analytics/resources/inventory",
          },
        },
      },

      unitEconomics: {
        enabled: true,
        endpoints: {
          summary: {
            method: "GET",
            path: "/unit-economics/summary",
          },
        },
      },

      forecastingBudgets: {
        enabled: true,
        endpoints: {
          summary: {
            method: "GET",
            path: "/forecasting-budgets/summary",
          },
        },
      },

      alertsIncidents: {
        enabled: true,
        endpoints: {
          summary: {
            method: "GET",
            path: "/alerts-incidents/summary",
          },
        },
      },
    },
  },

  /**
   * CLIENT-D
   * Uses: /api/client-d/dashboard/<path>
   */
  "980e9cf4-64f2-419b-ab01-e184e470aa4b": {
    clientId: "client-d",
    dashboard : "/client-d/dashboard",
    apiBase: "/api/client-d/dashboard",
    modules: {
      health: {
        enabled: true,
        endpoints: {
          ping: { method: "GET", path: "/" },
        },
      },

      overview: {
        enabled: true,
        endpoints: {
          overview: { method: "GET", path: "/overview" },
          filters: { method: "GET", path: "/overview/filters" },
          dataExplorer: { method: "GET", path: "/overview/data-explorer" },
          exportCsv: {
            method: "GET",
            path: "/overview/data-explorer/export-csv",
          },
        },
      },

      optimization: {
        enabled: true,
        endpoints: {
          idleResources: {
            method: "GET",
            path: "/optimization/idle-resources",
          },
          commitments: {
            method: "GET",
            path: "/optimization/commitments",
          },
          tracker: {
            method: "GET",
            path: "/optimization/tracker",
          },
          rightSizing: {
            method: "GET",
            path: "/optimization/right-sizing",
          },
        },
      },

      governance: {
        enabled: true,
        endpoints: {
          compliance: {
            method: "GET",
            path: "/governance/compliance",
          },
        },
      },

      costAnalytics: {
        enabled: true,
        endpoints: {
          costAnalysis: {
            method: "GET",
            path: "/analytics/cost-analysis/analysis",
          },
          costAnalysisKpis: {
            method: "GET",
            path: "/analytics/cost-analysis/kpis",
          },
          costAnalysisTrend: {
            method: "GET",
            path: "/analytics/cost-analysis/trend",
          },
          costAnalysisBreakdown: {
            method: "GET",
            path: "/analytics/cost-analysis/breakdown",
          },
          costAnalysisConcentration: {
            method: "GET",
            path: "/analytics/cost-analysis/concentration",
          },
          costAnalysisAnomalyImpact: {
            method: "GET",
            path: "/analytics/cost-analysis/anomaly-impact",
          },
          costFilters: {
            method: "GET",
            path: "/analytics/cost-analysis/filters",
          },
        },
      },

      costDrivers: {
        enabled: true,
        endpoints: {
          costDrivers: {
            method: "GET",
            path: "/analytics/cost-drivers/analysis",
          },
          driverDetails: {
            method: "POST",
            path: "/analytics/cost-drivers/details",
          },
        },
      },

      resources: {
        enabled: true,
        endpoints: {
          inventory: {
            method: "GET",
            path: "/analytics/resources/inventory",
          },
        },
      },

      dataQuality: {
        enabled: true,
        endpoints: {
          analysis: {
            method: "GET",
            path: "/analytics/data-quality/analysis",
          },
        },
      },

      reports: {
        enabled: true,
        endpoints: {
          summary: { method: "GET", path: "/reports/summary" },
          topServices: {
            method: "GET",
            path: "/reports/top-services",
          },
          topRegions: {
            method: "GET",
            path: "/reports/top-regions",
          },
        },
      },

      unitEconomics: {
        enabled: true,
        endpoints: {
          summary: {
            method: "GET",
            path: "/unit-economics/summary",
          },
        },
      },
    },
  },

  /**
   * CLIENT-C
   * Uses: /api/client-c/<module>/...
   */
  "275070c2-fd16-42fc-b79d-5aaf2d2b83fc": {
    clientId: "client-c",
    dashboard : "/client-c/dashboard",
    apiBase: "/api/client-c",
    modules: {
      health: {
        enabled: true,
        endpoints: {
          ping: { method: "GET", path: "/" },
        },
      },

      overview: {
        enabled: true,
        endpoints: {
          overview: { method: "GET", path: "/overview" },
          anomalies: { method: "GET", path: "/overview/anomalies" },
          filters: { method: "GET", path: "/overview/filters" },
        },
      },

      reports: {
        enabled: true,
        endpoints: {
          summary: { method: "GET", path: "/reports/summary" },
          topServices: { method: "GET", path: "/reports/top-services" },
          monthlySpend: { method: "GET", path: "/reports/monthly-spend" },
        },
      },

      governance: {
        enabled: true,
        endpoints: {
          summary: { method: "GET", path: "/governance/summary" },
          compliance: { method: "GET", path: "/governance/compliance" },
          accounts: { method: "GET", path: "/governance/accounts" },
          updateOwner: {
            method: "PUT",
            path: "/governance/accounts/:accountId/owner",
          },
        },
      },

      optimization: {
        enabled: true,
        endpoints: {
          recommendations: {
            method: "GET",
            path: "/optimization/recommendations",
          },
          opportunities: {
            method: "GET",
            path: "/optimization/opportunities",
          },
        },
      },

      costAnalysis: {
        enabled: true,
        endpoints: {
          getCostAnalysis: {
            method: "GET",
            path: "/cost-analysis",
          },
          postCostAnalysis: {
            method: "POST",
            path: "/cost-analysis",
          },
          costFilters: {
            method: "GET",
            path: "/cost-analysis/filters",
          },
        },
      },

      costDrivers: {
        enabled: true,
        endpoints: {
          costDrivers: {
            method: "GET",
            path: "/cost-drivers",
          },
          driverDetails: {
            method: "POST",
            path: "/cost-drivers/department",
          },
        },
      },

      resources: {
        enabled: true,
        endpoints: {
          inventory: {
            method: "GET",
            path: "/resources/inventory",
          },
        },
      },

      dataQuality: {
        enabled: true,
        endpoints: {
          analysis: {
            method: "GET",
            path: "/data-quality/analyze",
          },
        },
      },

      dataExplorer: {
        enabled: true,
        endpoints: {
          dataExplorer: { method: "GET", path: "/data-explorer" },
          exportCsv: {
            method: "GET",
            path: "/data-explorer/export-csv",
          },
        },
      },

      departmentCost: {
        enabled: true,
        endpoints: {
          overview: { method: "GET", path: "/department-cost/overview" },
          trend: { method: "GET", path: "/department-cost/trend" },
          drilldown: { method: "GET", path: "/department-cost/drilldown" },
        },
      },

      costAlerts: {
        enabled: true,
        endpoints: {
          alerts: { method: "GET", path: "/cost-alerts/alerts" },
          budgetStatus: { method: "GET", path: "/cost-alerts/budget-status" },
          createRule: { method: "POST", path: "/cost-alerts/rules" },
        },
      },

      projectTracking: {
        enabled: true,
        endpoints: {
          overview: { method: "GET", path: "/project-tracking/overview" },
          burnRate: { method: "GET", path: "/project-tracking/burn-rate" },
          budgetComparison: { method: "GET", path: "/project-tracking/budget-comparison" },
        },
      },
    },
  },

  /**
   * CLIENT-J
   * Uses: /api/client-j/dashboard/<module>
   * Note: key can be client UUID when available; "client-j" works as a fallback mapper key.
   */
  "client-j": {
    clientId: "client-j",
    dashboard: "/client-j/dashboard",
    apiBase: "/api/client-j/dashboard",
    modules: {
      health: {
        enabled: true,
        endpoints: {
          ping: { method: "GET", path: "/" },
        },
      },
      filters: {
        enabled: true,
        endpoints: {
          filters: { method: "GET", path: "/filters" },
        },
      },
      executiveOverview: {
        enabled: true,
        endpoints: {
          summary: { method: "GET", path: "/executive-overview" },
        },
      },
      dataExplorer: {
        enabled: true,
        endpoints: {
          explorer: { method: "GET", path: "/data-explorer" },
          exportCsv: { method: "GET", path: "/data-explorer/export-csv" },
        },
      },
      spendIntelligence: {
        enabled: true,
        endpoints: {
          analysis: { method: "GET", path: "/spend-intelligence" },
        },
      },
      allocationChargeback: {
        enabled: true,
        endpoints: {
          summary: { method: "GET", path: "/allocation-chargeback" },
        },
      },
      optimizationResources: {
        enabled: true,
        endpoints: {
          recommendations: { method: "GET", path: "/optimization-resources" },
        },
      },
      commitmentsRates: {
        enabled: true,
        endpoints: {
          commitments: { method: "GET", path: "/commitments-rates" },
        },
      },
      forecastingBudgets: {
        enabled: true,
        endpoints: {
          forecasting: { method: "GET", path: "/forecasting-budgets" },
        },
      },
      unitEconomics: {
        enabled: true,
        endpoints: {
          summary: { method: "GET", path: "/unit-economics" },
        },
      },
      governanceDataHealth: {
        enabled: true,
        endpoints: {
          governance: { method: "GET", path: "/governance-data-health" },
        },
      },
      reports: {
        enabled: true,
        endpoints: {
          reports: { method: "GET", path: "/reports" },
        },
      },
    },
  },
};
