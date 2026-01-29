import { Tag } from "lucide-react";

const ComplianceMatrix = ({ stats }) => {
  const compliance = Array.isArray(stats?.compliance) ? stats.compliance : [];

  return (
    <div className="flex-[2] bg-[#1a1b20] border border-white/10 rounded-2xl p-5">
      <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
        <Tag size={14} className="text-[#a02ff1]" /> Tag Compliance Breakdown
      </h3>

      <div className="space-y-3">
        {compliance.length > 0 ? (
          compliance.map((item) => (
            <div key={item.key} className="flex items-center gap-3 text-xs">
              <span className="w-24 text-gray-400 truncate text-right font-mono">
                {item.key}
              </span>
              <div className="flex-1 h-2 bg-black/40 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    item.pct > 80 ? "bg-green-500" : item.pct > 50 ? "bg-yellow-500" : "bg-red-500"
                  }`}
                  style={{ width: `${item.pct}%` }}
                />
              </div>
              <span className="w-10 text-right text-white font-bold">
                {Number(item.pct).toFixed(0)}%
              </span>
            </div>
          ))
        ) : (
          <div className="text-gray-500 text-center py-4 italic">
            No tags found in dataset.
          </div>
        )}
      </div>
    </div>
  );
};

export default ComplianceMatrix;
