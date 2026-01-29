import { CheckCircle, ShieldAlert, Tag, FileWarning } from "lucide-react";
import { formatCurrency } from "../utils/format.js";

const getBadge = (issues) => {
  if (!issues || issues.length === 0)
    return (
      <span className="text-green-500 text-xs flex items-center gap-1">
        <CheckCircle size={12} /> Healthy
      </span>
    );

  if (issues.includes("Missing ID") || issues.includes("Missing Service"))
    return (
      <span className="text-red-400 text-xs flex items-center gap-1 font-bold">
        <ShieldAlert size={12} /> Broken
      </span>
    );

  if (issues.includes("Untagged"))
    return (
      <span className="text-yellow-400 text-xs flex items-center gap-1">
        <Tag size={12} /> Untagged
      </span>
    );

  return (
    <span className="text-blue-400 text-xs flex items-center gap-1">
      <FileWarning size={12} /> Info
    </span>
  );
};

const IssuesTable = ({
  rows,
  isLocked,
  onRowClick,
}) => {
  return (
    <div
      className={`relative ${
        isLocked
          ? "h-[420px] overflow-hidden"
          : "max-h-full overflow-auto"
      }`}
    >
      <table className="w-full text-left text-xs">
        <thead className="bg-[#15161a] text-gray-500 font-bold sticky top-0 z-10 shadow-sm">
          <tr>
            <th className="px-6 py-3 w-10">Status</th>
            <th className="px-6 py-3">Service</th>
            <th className="px-6 py-3">Resource Identifier</th>
            <th className="px-6 py-3">Issues Found</th>
            <th className="px-6 py-3 text-right">Cost</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-white/5">
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
                    : "cursor-pointer hover:bg-white/5"
                }`}
              >
                <td className="px-6 py-3">{getBadge(row?._issues)}</td>
                <td className="px-6 py-3 text-white">
                  {row?.ServiceName || "Unknown"}
                </td>
                <td className="px-6 py-3 font-mono text-gray-400 truncate max-w-[200px]">
                  {row?.ResourceId ||
                    row?.ResourceName || (
                      <span className="italic opacity-50">--</span>
                    )}
                </td>
                <td className="px-6 py-3">
                  {row?._issues?.length > 0 ? (
                    <div className="flex gap-1">
                      {row._issues.slice(0, 2).map((iss) => (
                        <span
                          key={iss}
                          className="px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 text-[10px]"
                        >
                          {iss}
                        </span>
                      ))}
                      {row._issues.length > 2 && (
                        <span className="text-gray-500 text-[10px] self-center">
                          +{row._issues.length - 2}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-green-500 text-[10px]">Healthy</span>
                  )}
                </td>
                <td className="px-6 py-3 text-right font-mono text-white">
                  {formatCurrency(row?._parsedCost || 0)}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" className="p-10 text-center text-gray-500">
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
