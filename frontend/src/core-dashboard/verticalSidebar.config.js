// src/components/sidebar/sidebarConfig.js
import {
  BarChart3,
  TrendingUp,
  Gauge,
  Users,
  Boxes,
  Sparkles,
  ShieldAlert,
  Table,
  FileBarChart,
} from "lucide-react";

const VerticalSidebarConfig = {
  brand: {
    name: "KCX."
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
          to: "/dashboard/resources",
          label: "Resources",
          icon: Boxes,
          description: "View individual cloud resources and utilization",
        },
        {
          to: "/dashboard/data-quality",
          label: "Data Quality",
          icon: ShieldAlert,
          description: "Monitor data completeness and tagging health",
        },
      ],
    },
    {
      title: "FINANCE",
      items: [
        {
          to: "/dashboard/accounts",
          label: "Accounts and Ownership",
          icon: Users,
          description: "Manage account ownership and allocation",
          isPremium: true,
        },
        {
          to: "/dashboard/optimization",
          label: "Optimization",
          icon: Sparkles,
          description: "Cost optimization recommendations",
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
