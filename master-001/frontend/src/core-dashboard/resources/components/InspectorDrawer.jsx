import React from 'react';
import { X, Tag, CheckCircle2, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import StatusBadge from '../components/StatusBadge';
import { formatCurrency } from '../utils/format';

const InspectorDrawerView = ({
  selectedResource,
  onClose,
  flaggedResources,
  onToggleFlag,
}) => {
  return (
    <AnimatePresence>
      {selectedResource && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60]"
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25 }}
            className="fixed right-0 top-0 bottom-0 w-[500px] bg-[#1a1b20] border-l border-white/10 shadow-2xl z-[70] flex flex-col"
            style={{ top: '64px' }}
          >
            <div className="p-6 border-b border-white/10 bg-[#25262b] flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <StatusBadge status={selectedResource.status} />
                  <span className="text-xs text-gray-500">{selectedResource.service}</span>
                </div>
                <h2 className="text-lg font-bold text-white break-all">{selectedResource.id}</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                  <p className="text-xs text-gray-500 uppercase font-bold mb-1">Total Cost</p>
                  <p className="text-2xl font-bold text-white">
                    {formatCurrency(selectedResource.totalCost)}
                  </p>
                </div>
                <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                  <p className="text-xs text-gray-500 uppercase font-bold mb-1">Tags Found</p>
                  <p className="text-2xl font-bold text-blue-400">
                    {selectedResource.tags ? Object.keys(selectedResource.tags).length : 0}
                  </p>
                </div>
              </div>

              <div className="bg-black/20 rounded-xl p-4 border border-white/5">
                <h3 className="text-xs font-bold text-white mb-3 flex items-center gap-2">
                  <Tag size={12} /> Applied Tags
                </h3>

                {selectedResource.hasTags && selectedResource.tags ? (
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(selectedResource.tags).map(([k, v]) => (
                      <span
                        key={k}
                        className="px-2 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-300 rounded text-[10px]"
                      >
                        <span className="opacity-50">{k}:</span> {v}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-500 text-xs italic">No tags detected.</div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-white/10">
                <button
                  onClick={() => onToggleFlag(selectedResource.id)}
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg text-xs font-bold transition-colors ${
                    flaggedResources.has(selectedResource.id)
                      ? 'bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-400'
                      : 'bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 text-orange-400'
                  }`}
                >
                  {flaggedResources.has(selectedResource.id) ? (
                    <>
                      <CheckCircle2 size={14} /> Flagged for Review
                    </>
                  ) : (
                    <>
                      <AlertTriangle size={14} /> Flag for Review
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default InspectorDrawerView;
