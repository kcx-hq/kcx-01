import React from "react";
import { Calendar, Download, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { getColorClasses } from "../utils/reportUtils";
import PremiumGate from "../../common/PremiumGate";
import type { ReportCardProps } from "../types";

const ReportCard = ({ report, index, onDownload, downloading, canDownload }: ReportCardProps) => {
  const Icon = report.icon;

  const content = (
    <motion.div
      key={report.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="relative rounded-xl border border-[var(--border-light)] bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-sm md:p-6"
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex flex-1 items-start gap-4">
          <div className={`rounded-lg border p-3 ${getColorClasses(report.color)}`}>
            <Icon size={22} />
          </div>

          <div className="flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <h3 className="text-base font-bold text-[var(--text-primary)] md:text-lg">{report.title}</h3>
              <span className="rounded border border-[var(--border-light)] bg-[var(--bg-surface)] px-2 py-1 text-xs text-[var(--text-muted)]">
                {report.frequency}
              </span>
            </div>

            <p className="mb-3 text-sm text-[var(--text-secondary)]">{report.description}</p>

            <div className="mb-4 flex items-center gap-2 text-xs text-[var(--text-muted)]">
              <Calendar size={14} />
              <span>Period: {report.period}</span>
            </div>

            <div className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-surface)] p-4">
              <div className="mb-2 text-xs font-bold uppercase text-[var(--text-muted)]">Includes</div>
              <ul className="space-y-1.5">
                {report.includes.map((item: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                    <span className="mt-1 text-[var(--brand-primary)]">-</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end border-t border-[var(--border-muted)] pt-4">
        <button
          onClick={() => onDownload(report.id)}
          disabled={downloading || !canDownload}
          className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-[var(--brand-primary)] transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
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

  if (report.isLocked) {
    return <PremiumGate variant="wrap">{content}</PremiumGate>;
  }

  return content;
};

export default ReportCard;



