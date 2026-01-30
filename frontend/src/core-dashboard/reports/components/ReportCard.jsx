import React from "react";
import { Calendar, Download, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { getColorClasses } from "../utils/reportUtils";
import PremiumGate from "../../common/PremiumGate";

const ReportCard = ({
  report,
  index,
  onDownload,
  downloading,
  canDownload,
}) => {
  const Icon = report.icon;
  console.log(report)

  const content = (
    <motion.div
      key={report.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="relative bg-[#1a1b20]/60 backdrop-blur-md border border-white/5 rounded-xl p-6 transition-all hover:border-[#a02ff1]/30"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-4 flex-1">
          <div className={`p-3 rounded-lg ${getColorClasses(report.color)}`}>
            <Icon size={24} />
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-bold text-white">{report.title}</h3>
              <span className="px-2 py-1 bg-white/5 rounded text-xs text-gray-400">
                {report.frequency}
              </span>
            </div>

            <p className="text-sm text-gray-400 mb-4">{report.description}</p>

            <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
              <Calendar size={14} />
              <span>Period: {report.period}</span>
            </div>

            <div className="bg-[#0f0f11] rounded-lg p-4 border border-white/5">
              <div className="text-xs text-gray-500 mb-2 font-bold uppercase">
                Includes
              </div>
              <ul className="space-y-1.5">
                {report.includes.map((item, idx) => (
                  <li
                    key={idx}
                    className="text-sm text-gray-300 flex items-start gap-2"
                  >
                    <span className="text-[#a02ff1] mt-1">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end pt-4 border-t border-white/5">
        <button
          onClick={() => onDownload(report.id)}
          disabled={downloading || !canDownload}
          className="px-6 py-2 bg-[#a02ff1] hover:bg-[#8e25d9] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          {downloading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Download size={16} />
              Download PDF
            </>
          )}
        </button>
      </div>
    </motion.div>
  );

  return report.isLocked ? <div className="relative bg-[#1a1b20]/60 backdrop-blur-md border border-white/5 rounded-xl p-6 transition-all hover:border-[#a02ff1]/30"><PremiumGate>{content}</PremiumGate></div> : content;
};

export default ReportCard;
