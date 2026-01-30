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
    },
  },

  /**
   * CLIENT-D
   * Uses: /api/client-d/dashboard/<path>
   */
  "81458172-081f-4e87-8f5c-9b15995d8871": {
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
  "a90902a9-40e2-41aa-bbde-a82f2917125a": {
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
};
