import React from "react";
import { X } from "lucide-react";

const InfoModal = ({ isOpen, onClose, title, message, date, highlight }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-[#1a1b20] border border-white/10 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all scale-100 ring-1 ring-white/10">
        <div className="p-4 border-b border-white/5 flex justify-between items-center bg-[#0f0f11]/50">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={16} />
          </button>
        </div>

        <div className="p-6 text-center space-y-3">
          <p className="text-gray-400 text-xs leading-relaxed">{message}</p>
          {highlight && <p className="text-2xl font-black text-white">{highlight}</p>}
          {date && <p className="text-[#a02ff1] font-mono text-xs font-bold uppercase tracking-widest">{date}</p>}
        </div>

        <div className="p-3 border-t border-white/5 bg-[#0f0f11]/50 flex justify-center">
          <button onClick={onClose} className="text-xs font-bold text-gray-500 hover:text-white transition-colors">
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};

export default InfoModal;
