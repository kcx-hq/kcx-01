// src/components/sidebar/sidebarConfig.clientD.js
import {
  BarChart3,
  Table,
  Sparkles,
  ShieldAlert,
  TrendingUp,
  Gauge,
  Boxes,
  FileBarChart,
  Crown,
} from "lucide-react";

const ClientDSidebarConfig = {
  brand: {
    logoSrc: "/k&cologo.svg", // change per client if needed
    name: "Client D",
    subtitle: "Dashboard",
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
          to: "/client-d/dashboard/overview",
          label: "Overview",
          icon: BarChart3,
          end: true,
          description: "Dashboard overview (KPIs, trends, metrics)",
        },
        {
          to: "/client-d/dashboard/data-explorer",
          label: "Data Explorer",
          icon: Table,
          description: "Explore cost data in tabular form",
        },
      ],
    },

    {
      title: "ANALYTICS",
      items: [
        {
          to: "/client-d/dashboard/cost-analysis",
          label: "Cost Analysis",
          icon: TrendingUp,
          description: "Cost patterns and spend analysis",
        },
        {
          to: "/client-d/dashboard/cost-drivers",
          label: "Cost Drivers",
          icon: Gauge,
          description: "Drivers behind cost changes",
        },
        {
          to: "/client-d/dashboard/resources",
          label: "Resources",
          icon: Boxes,
          description: "Resource inventory and utilization",
        },
        {
          to: "/client-d/dashboard/data-quality",
          label: "Data Quality",
          icon: ShieldAlert,
          description: "Tagging and completeness checks",
        },
      ],
    },

    {
      title: "OPTIMIZATION",
      items: [
        {
          to: "/client-d/dashboard/optimization",
          label: "Optimization",
          icon: Sparkles,
          description: "Idle resources, commitments, right-sizing, tracker",
        },
      ],
    },

    {
      title: "Accounts & Ownership",
      items: [
        {
          to: "/client-d/dashboard/accountOwnership",
          label: "Compliance",
          icon: ShieldAlert,
          description: "Compliance status and checks",
        },
      ],
    },

    {
      title: "REPORTING",
      items: [
        {
          to: "/client-d/dashboard/reports",
          label: "Reports",
          icon: FileBarChart,
          description: "Summary, top services, top regions",
        },
      ],
    },

    {
      title: "FINANCE",
      items: [
        {
          to: "/client-d/dashboard/unit-economics",
          label: "Unit Economics",
          icon: Crown,
          description: "Unit economics summary",
          // set true if you want to gate it
          // isPremium: true,
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

export default ClientDSidebarConfig;
