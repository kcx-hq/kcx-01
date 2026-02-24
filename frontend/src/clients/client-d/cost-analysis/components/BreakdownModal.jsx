import React from "react";
import { X, AlertCircle } from "lucide-react";
import { formatCurrency } from "../utils/format.js";

const BreakdownModal = ({ isOpen, onClose, data }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#ffffff] border border-slate-200 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-[#f8faf9]/50">
          <h3 className="text-lg font-bold text-slate-800">Spend Breakdown</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-slate-800">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
          <div className="space-y-3">
            {(data || []).map((item, idx) => {
              const isUnallocated = !item.name || item.name === "null" || item.name === "Unallocated Resources";
              return (
                <div
                  key={idx}
                  className="flex justify-between items-center p-3 bg-[#f8faf9] rounded-xl border border-slate-200 hover:border-[#1EA88A]/30 transition-colors"
                >
                  <span
                    className={`text-sm font-medium truncate max-w-[200px] flex items-center gap-2 ${
                      isUnallocated ? "text-gray-500 italic" : "text-gray-300"
                    }`}
                    title={item.name}
                  >
                    {isUnallocated && <AlertCircle size={12} className="text-yellow-500" />}
                    {item.name}
                  </span>
                  <span className="text-sm font-mono font-bold text-[#1EA88A]">{formatCurrency(item.value)}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 bg-[#f8faf9]/50 flex justify-end">
          <button
            onClick={onClose}
            className="bg-[#1EA88A] hover:bg-[#188f76] text-white px-6 py-2 rounded-lg text-sm font-bold shadow-[0_0_15px_rgba(30,168,138,0.3)]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default BreakdownModal;
