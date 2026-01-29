import React from "react";
import { TrendingUp, Shield, FileText, Target } from "lucide-react";
import { motion } from "framer-motion";
import { getColorClasses } from "../utils/reportUtils";

const ComingSoonReports = () => {
  const items = [
    {
      title: "Departmental Cost Allocation",
      description: "Breakdown of costs by department, team, or business unit",
      icon: Shield,
      color: "purple",
    },
    {
      title: "Forecast & Budget Variance",
      description: "Projected spend vs budget with variance analysis",
      icon: TrendingUp,
      color: "blue",
    },
    {
      title: "Compliance & Audit Report",
      description: "Policy compliance, tagging adherence, and audit trail",
      icon: FileText,
      color: "green",
    },
    {
      title: "Resource Utilization Report",
      description: "Detailed utilization metrics and efficiency analysis",
      icon: Target,
      color: "yellow",
    },
  ];

  return (
    <div className="mt-12 pt-8 border-t border-white/10">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <TrendingUp size={20} className="text-gray-400" />
          Other Reports
          <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-full text-xs font-bold">
            Coming Soon
          </span>
        </h2>
        <p className="text-sm text-gray-400 mt-1">Additional report types are in development</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((r, index) => {
          const Icon = r.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-[#1a1b20]/30 backdrop-blur-md border border-white/5 rounded-xl p-5 opacity-60"
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${getColorClasses(r.color)} opacity-50`}>
                  <Icon size={20} />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-gray-400 mb-1">{r.title}</h3>
                  <p className="text-xs text-gray-500">{r.description}</p>
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
