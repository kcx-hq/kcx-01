import { CheckCircle, ShieldAlert, Tag, FileWarning } from "lucide-react";
import { formatCurrency } from "../utils/format.js";

const getBadge = (issues) => {
  if (!issues || issues.length === 0)
    return (
      <span className="flex items-center gap-1 text-xs text-emerald-700">
        <CheckCircle size={12} /> Healthy
      </span>
    );

  if (issues.includes("Missing ID") || issues.includes("Missing Service"))
    return (
      <span className="flex items-center gap-1 text-xs font-bold text-rose-700">
        <ShieldAlert size={12} /> Broken
      </span>
    );

  if (issues.includes("Untagged"))
    return (
      <span className="flex items-center gap-1 text-xs text-amber-700">
        <Tag size={12} /> Untagged
      </span>
    );

  return (
    <span className="flex items-center gap-1 text-xs text-sky-700">
      <FileWarning size={12} /> Info
    </span>
  );
};

const IssuesTable = ({ rows, isLocked, onRowClick }) => {
  return (
    <div className={`dq-scrollbar relative overflow-x-auto ${isLocked ? "h-[420px] overflow-hidden" : "max-h-full overflow-auto"}`}>
      <table className="min-w-[920px] w-full text-left text-xs">
        <thead className="sticky top-0 z-10 bg-[var(--bg-surface)] font-bold text-[var(--text-muted)] shadow-sm">
          <tr>
            <th className="w-10 px-4 py-3 md:px-6">Status</th>
            <th className="px-4 py-3 md:px-6">Service</th>
            <th className="px-4 py-3 md:px-6">Resource Identifier</th>
            <th className="px-4 py-3 md:px-6">Issues Found</th>
            <th className="px-4 py-3 text-right md:px-6">Cost</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-[var(--border-muted)]">
          {rows.length > 0 ? (
            rows.map((row, i) => (
              <tr
                key={i}
                onClick={() => {
                  if (!isLocked) onRowClick(row);
                }}
                className={`transition-colors ${
                  isLocked
                    ? "cursor-not-allowed"
                    : "cursor-pointer hover:bg-[var(--bg-surface)]"
                }`}
              >
                <td className="px-4 py-3 md:px-6">{getBadge(row?._issues)}</td>
                <td className="px-4 py-3 text-[var(--text-primary)] md:px-6">
                  {row?.ServiceName || "Unknown"}
                </td>
                <td className="max-w-[220px] truncate px-4 py-3 font-mono text-[var(--text-secondary)] md:px-6">
                  {row?.ResourceId || row?.ResourceName || <span className="italic opacity-60">--</span>}
                </td>
                <td className="px-4 py-3 md:px-6">
                  {row?._issues?.length > 0 ? (
                    <div className="flex gap-1">
                      {row._issues.slice(0, 2).map((iss) => (
                        <span
                          key={iss}
                          className="rounded border border-rose-200 bg-rose-50 px-1.5 py-0.5 text-[10px] text-rose-700"
                        >
                          {iss}
                        </span>
                      ))}
                      {row._issues.length > 2 && (
                        <span className="self-center text-[10px] text-[var(--text-muted)]">
                          +{row._issues.length - 2}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-[10px] text-emerald-700">Healthy</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right font-mono text-[var(--text-primary)] md:px-6">
                  {formatCurrency(row?._parsedCost || 0)}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" className="p-10 text-center text-[var(--text-muted)]">
                No records found for this category.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default IssuesTable;

