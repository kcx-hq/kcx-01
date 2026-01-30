import { X, AlertTriangle, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatCurrency } from "../utils/format.js";

const explainIssue = (issue) => {
  if (issue === "Untagged") return " Missing allocation tags. Cost cannot be assigned.";
  if (issue === "Missing ID") return " Resource ID is null. Cannot track lifecycle.";
  if (issue === "Missing Service") return " Service Name is null.";
  return " Value is suspiciously low or negative.";
};

const IssueInspector = ({ selectedIssue, setSelectedIssue }) => {
  return (
    <AnimatePresence>
      {selectedIssue && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedIssue(null)}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
          />

          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25 }}
            className="fixed right-0 top-0 bottom-0 w-[500px] bg-[#1a1b20] border-l border-white/10 shadow-2xl z-50 flex flex-col"
          >
            <div className="p-6 border-b border-white/10 bg-[#25262b] flex justify-between items-start">
              <div>
                <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">
                  Issue Inspector
                </span>
                <h2 className="text-xl font-bold text-white mt-1 break-all">
                  {selectedIssue?.ResourceId || "Unknown Resource"}
                </h2>
              </div>
              <button
                onClick={() => setSelectedIssue(null)}
                className="p-2 hover:bg-white/10 rounded-full"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {selectedIssue?._issues?.length > 0 ? (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                  <h3 className="text-sm font-bold text-red-400 mb-2 flex items-center gap-2">
                    <AlertTriangle size={14} /> Diagnosis
                  </h3>
                  <ul className="list-disc list-inside text-xs text-gray-300 space-y-2">
                    {selectedIssue._issues.map((issue) => (
                      <li key={issue}>
                        <strong className="text-white">{issue}:</strong>
                        {explainIssue(issue)}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-center gap-2 text-green-400 text-sm font-bold">
                  <CheckCircle size={16} /> No Quality Issues Detected.
                </div>
              )}

              <div>
                <h3 className="text-sm font-bold text-white mb-2">Record Details</h3>
                <div className="bg-black/20 rounded-lg border border-white/5 divide-y divide-white/5">
                  {["ServiceName", "RegionName", "UsageType", "Operation"].map((k) => (
                    <div key={k} className="flex justify-between p-3 text-xs">
                      <span className="text-gray-500">{k}</span>
                      <span className="text-gray-200 font-mono text-right">
                        {selectedIssue?.[k] || "--"}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between p-3 text-xs bg-white/5">
                    <span className="text-gray-500 font-bold">Billed Cost</span>
                    <span className="text-white font-mono font-bold">
                      {formatCurrency(selectedIssue?._parsedCost || 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default IssueInspector;
