// frontend/clients/client-d/dashboards/overview/data-explorer/components/ColumnsDrawer.jsx
import React from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const ColumnsDrawer = ({ open, onClose, allColumns, hiddenColumns, toggleColumn, searchTerm }) => {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
          />
          <motion.div
            initial={{ x: "110%" }}
            animate={{ x: 0 }}
            exit={{ x: "110%" }}
            transition={{ type: "spring", damping: 26, stiffness: 230 }}
            className="fixed right-0 top-0 bottom-0 w-[420px] max-w-[90vw] bg-[#f3f7f5] border-l border-slate-200 z-[70] shadow-2xl flex flex-col"
          >
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-[#eff6f3]">
              <div>
                <div className="text-slate-800 font-bold text-base">Columns</div>
                <div className="text-[11px] text-gray-500">
                  Toggle visibility (search applies if you typed in “Search columns”)
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-3 border-b border-slate-200">
              <div className="text-[10px] text-gray-500">
                Showing:{" "}
                <span className="text-gray-300 font-semibold">
                  {allColumns.length - hiddenColumns.length}
                </span>{" "}
                / {allColumns.length}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-thin scrollbar-thumb-gray-700">
              {allColumns
                .filter((col) => {
                  if (!searchTerm?.trim()) return true;
                  return col.toLowerCase().includes(searchTerm.trim().toLowerCase());
                })
                .map((col) => {
                  const visible = !hiddenColumns.includes(col);
                  return (
                    <button
                      key={col}
                      onClick={() => toggleColumn(col)}
                      className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg hover:bg-white/5 border border-slate-200 hover:border-slate-200 transition"
                    >
                      <span className="text-xs text-gray-200 truncate">{col}</span>
                      <span
                        className={`text-[10px] px-2 py-1 rounded-md border ${
                          visible
                            ? "text-emerald-300 border-emerald-300/30 bg-emerald-300/10"
                            : "text-gray-400 border-slate-200 bg-white/5"
                        }`}
                      >
                        {visible ? "Visible" : "Hidden"}
                      </span>
                    </button>
                  );
                })}
            </div>

            <div className="p-3 border-t border-slate-200 bg-[#eff6f3]">
              <button
                onClick={() => hiddenColumns.forEach((c) => toggleColumn(c))}
                className="w-full py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-slate-200 text-xs font-semibold text-gray-200"
              >
                Show all columns
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ColumnsDrawer;
