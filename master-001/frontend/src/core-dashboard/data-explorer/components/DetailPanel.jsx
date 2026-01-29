import React from "react";
import { X, Copy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const DetailPanel = ({ selectedRow, setSelectedRow, allColumns }) => {
  return (
    <AnimatePresence>
      {selectedRow && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedRow(null)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute right-0 top-0 bottom-0 w-[450px] bg-[#1a1b20] border-l border-white/10 shadow-2xl z-50 flex flex-col"
          >
            <div className="p-5 border-b border-white/10 flex justify-between items-center bg-[#25262b]">
              <div>
                <h3 className="text-white font-bold text-lg">Row Details</h3>
                <p className="text-gray-400 text-xs font-mono mt-1">
                  Full Record Inspection
                </p>
              </div>
              <button
                onClick={() => setSelectedRow(null)}
                className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin scrollbar-thumb-gray-700">
              {allColumns.map((col) => (
                <div key={col} className="group">
                  <div className="flex justify-between items-baseline mb-1">
                    <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">
                      {col}
                    </label>
                    <button
                      onClick={() => navigator.clipboard.writeText(selectedRow?.[col])}
                      className="opacity-0 group-hover:opacity-100 text-[#a02ff1] text-[10px] flex items-center gap-1 hover:underline"
                    >
                      <Copy size={10} /> Copy
                    </button>
                  </div>
                  <div className="text-sm text-gray-200 bg-black/20 p-2 rounded border border-white/5 font-mono break-all">
                    {selectedRow?.[col] !== null && selectedRow?.[col] !== undefined ? (
                      String(selectedRow[col])
                    ) : (
                      <span className="text-gray-600 italic">null</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default DetailPanel;
