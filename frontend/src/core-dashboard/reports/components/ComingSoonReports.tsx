import React from "react";
import { TrendingUp, Shield, FileText, Target } from "lucide-react";
import { motion } from "framer-motion";
import { getColorClasses } from "../utils/reportUtils";
import type { ComingSoonReportItem } from "../types";

const ComingSoonReports = () => {
  const items: ComingSoonReportItem[] = [
    {
      title: "Departmental Cost Allocation",
      description: "Breakdown of costs by department, team, or business unit",
      icon: Shield,
      color: "blue",
    },
    {
      title: "Forecast and Budget Variance",
      description: "Projected spend versus budget with variance analysis",
      icon: TrendingUp,
      color: "green",
    },
    {
      title: "Compliance and Audit Report",
      description: "Policy compliance, tagging adherence, and audit trail",
      icon: FileText,
      color: "teal",
    },
    {
      title: "Resource Utilization Report",
      description: "Detailed utilization metrics and efficiency analysis",
      icon: Target,
      color: "amber",
    },
  ];

  return (
    <div className="mt-10 border-t border-[var(--border-muted)] pt-8">
      <div className="mb-6">
        <h2 className="flex items-center gap-2 text-lg font-bold text-[var(--text-primary)] md:text-xl">
          <TrendingUp size={20} className="text-[var(--text-muted)]" />
          Other Reports
          <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
            Coming Soon
          </span>
        </h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Additional report types are in development.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {items.map((r: ComingSoonReportItem, index: number) => {
          const Icon = r.icon;
          return (
            <motion.div
              key={r.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className="rounded-xl border border-[var(--border-light)] bg-white p-5 opacity-80"
            >
              <div className="flex items-start gap-4">
                <div className={`rounded-lg border p-3 ${getColorClasses(r.color)}`}>
                  <Icon size={20} />
                </div>
                <div className="flex-1">
                  <h3 className="mb-1 text-base font-semibold text-[var(--text-primary)]">{r.title}</h3>
                  <p className="text-xs text-[var(--text-secondary)]">{r.description}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default ComingSoonReports;



