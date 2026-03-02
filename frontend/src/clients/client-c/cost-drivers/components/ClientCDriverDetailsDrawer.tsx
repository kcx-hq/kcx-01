import React from 'react';
import { X, TrendingUp, TrendingDown, Calendar, DollarSign, Percent } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ClientCDriverDetailsDrawerProps, NumericLike } from '../types';

export function ClientCDriverDetailsDrawer({ 
  driver, 
  period, 
  onBack, 
  isSavingsDriver, 
  loadingDetails, 
  stats 
}: ClientCDriverDetailsDrawerProps) {
  if (!driver) return null;

  const formatCurrency = (value: NumericLike | null | undefined): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2
    }).format(Number(value || 0));
  };

  const formatPercent = (value: NumericLike | null | undefined): string => {
    return `${(Number(value || 0) * 100).toFixed(1)}%`;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onBack}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="bg-[#1a1b20] border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
          onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isSavingsDriver ? (
                <div className="p-2 rounded-lg bg-green-500/10">
                  <TrendingDown className="text-green-400" size={20} />
                </div>
              ) : (
                <div className="p-2 rounded-lg bg-red-500/10">
                  <TrendingUp className="text-red-400" size={20} />
                </div>
              )}
              <div>
                <h2 className="text-xl font-bold text-white">{driver.name}</h2>
                <p className="text-sm text-gray-400">
                  {isSavingsDriver ? 'Cost Savings Driver' : 'Cost Increase Driver'}
                </p>
              </div>
            </div>
            <button
              onClick={onBack}
              className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            {loadingDetails ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#23a282]"></div>
                <span className="ml-3 text-gray-400">Loading details...</span>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-[#0f0f11] p-4 rounded-lg border border-white/5">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign size={16} className="text-[#23a282]" />
                      <span className="text-xs font-bold text-gray-400 uppercase">Absolute Change</span>
                    </div>
                    <div className={`text-xl font-bold ${
                      isSavingsDriver ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {isSavingsDriver ? '-' : '+'}
                      {formatCurrency(Math.abs(driver.diff || 0))}
                    </div>
                  </div>

                  <div className="bg-[#0f0f11] p-4 rounded-lg border border-white/5">
                    <div className="flex items-center gap-2 mb-2">
                      <Percent size={16} className="text-[#23a282]" />
                      <span className="text-xs font-bold text-gray-400 uppercase">Percentage Change</span>
                    </div>
                    <div className={`text-xl font-bold ${
                      isSavingsDriver ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {isSavingsDriver ? '-' : '+'}
                      {formatPercent(Math.abs(driver.pct || 0))}
                    </div>
                  </div>

                  <div className="bg-[#0f0f11] p-4 rounded-lg border border-white/5">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar size={16} className="text-[#23a282]" />
                      <span className="text-xs font-bold text-gray-400 uppercase">Period</span>
                    </div>
                    <div className="text-xl font-bold text-white">
                      {period} Days
                    </div>
                  </div>
                </div>

                {/* Detailed Stats */}
                {stats && (
                  <div className="bg-[#0f0f11] p-4 rounded-lg border border-white/5">
                    <h3 className="text-sm font-bold text-gray-400 uppercase mb-3">Detailed Analysis</h3>
                    <div className="space-y-3">
                      {stats.previousValue !== undefined && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Previous Period Value:</span>
                          <span className="text-white font-medium">
                            {formatCurrency(stats.previousValue)}
                          </span>
                        </div>
                      )}
                      {stats.currentValue !== undefined && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Current Period Value:</span>
                          <span className="text-white font-medium">
                            {formatCurrency(stats.currentValue)}
                          </span>
                        </div>
                      )}
                      {stats.contribution !== undefined && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Contribution to Total Variance:</span>
                          <span className={`font-medium ${
                            stats.contribution >= 0 ? 'text-red-400' : 'text-green-400'
                          }`}>
                            {formatPercent(stats.contribution)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Description */}
                {driver.description && (
                  <div className="bg-[#0f0f11] p-4 rounded-lg border border-white/5">
                    <h3 className="text-sm font-bold text-gray-400 uppercase mb-2">Description</h3>
                    <p className="text-gray-300 text-sm">{driver.description}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
