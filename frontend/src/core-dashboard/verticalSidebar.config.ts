// src/components/sidebar/sidebarConfig.js
import {
  BarChart3,
  Calculator,
  TrendingUp,
  LineChart,
  Gauge,
  Sparkles,
  ShieldAlert,
  Bell,
  Table,
  FileBarChart,
} from "lucide-react";

const VerticalSidebarConfig: CoreDashboardValue = {
  brand: {
    logoSrc: "/KCX.logo.svg",
    name: "KCX",
    subtitle: "FinOps Platform",
  },

  features: {
    tooltip: true,
    footerUpload: true,
    maxUploads: 5,
    uploadCountStorageKey: "csvUploadCount",
  },

  groups: [
    {
      title: "CORE",
      items: [
        {
          to: "/dashboard",
          label: "Overview",
          icon: BarChart3,
          end: true,
          description:
            "Complete dashboard overview with KPIs, cost trends, and key metrics",
        },
        {
          to: "/dashboard/data-explorer",
          label: "Data Explorer",
          icon: Table,
          description: "Explore and analyze your cost data in tabular format",
        },
      ],
    },
    {
      title: "ANALYTICS",
      items: [
        {
          to: "/dashboard/cost-analysis",
          label: "Cost Analysis",
          icon: TrendingUp,
          description: "Deep dive into cost patterns and spending analysis",
        },
        {
          to: "/dashboard/cost-drivers",
          label: "Cost Drivers",
          icon: Gauge,
          description: "Identify factors driving your cloud costs",
        },
        {
          to: "/dashboard/data-quality",
          label: "Governance & Data Quality",
          icon: ShieldAlert,
          description: "Monitor governance controls, data quality, and trust health",
        },
      ],
    },
    {
      title: "FINANCE",
      items: [
        {
          to: "/dashboard/allocation-unit-economics",
          label: "Allocation & Unit Economics",
          icon: Calculator,
          description: "Showback, chargeback, allocation coverage, and unit cost trends",
          isPremium: true,
        },
        {
          to: "/dashboard/forecasting-budgets",
          label: "Forecasting & Budgets",
          icon: LineChart,
          description: "Planning controls, confidence-gated forecasts, and budget accountability",
          isPremium: true,
        },
        {
          to: "/dashboard/optimization",
          label: "Optimization & Commitments",
          icon: Sparkles,
          description: "Execution backlog and commitment rate safety",
          isPremium: true,
        },
      ],
    },
    {
      title: "REPORTING",
      items: [
        {
          to: "/dashboard/reports",
          label: "Reports",
          icon: FileBarChart,
          description: "Generate and export cost reports",
        },
      ],
    },
  ],

  footer: {
    uploadRoute: "/upload",
    uploadLabel: "Upload More",
    lockedLabel: "Upload More (Pro)",
  },
};

export default VerticalSidebarConfig;



