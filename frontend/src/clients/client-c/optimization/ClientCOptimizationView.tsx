import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Sparkles,
  Target,
  Zap,
  TrendingDown,
  AlertCircle,
  Loader2,
  AlertTriangle,
  Lightbulb,
  Filter,
  RefreshCw,
  ChevronDown,
  Cloud,
  Settings,
  MapPin,
  Calendar
} from "lucide-react";

import FilterBar from "../common/widgets/FilterBar";

// Import components for different tabs
const OpportunitiesTab = ({ opportunities, onSelectInsight, title = "Opportunities" }) => {
  if (!opportunities || opportunities.length === 0) {
    return (
      <div className="bg-[#1a1b20]/60 backdrop-blur-md border border-white/5 rounded-2xl p-6">
        <p className="text-gray-500 text-center py-8">No {title.toLowerCase()} found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {opportunities.slice(0, 10).map((opportunity, index) => (
        <div 
          key={index} 
          className="bg-[#1a1b20]/60 backdrop-blur-md border border-white/5 rounded-xl p-4 hover:border-[#a02ff1]/50 transition-colors"
        >
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-medium text-white">{opportunity.title || opportunity.name || opportunity.description}</h4>
              <p className="text-sm text-gray-400 mt-1">{opportunity.description || opportunity.summary || 'No description available'}</p>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-green-400">
                {opportunity.savings ? `$${opportunity.savings.toLocaleString()}/mo` : 'N/A'}
              </div>
              <div className="text-xs text-gray-500">{opportunity.category || opportunity.type || 'General'}</div>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <span className={`px-2 py-1 rounded text-xs ${
              opportunity.priority === 'high' ? 'bg-red-500/20 text-red-400' :
              opportunity.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-green-500/20 text-green-400'
            }`}>
              {opportunity.priority || 'medium'}
            </span>
            <span className="px-2 py-1 rounded text-xs bg-blue-500/20 text-blue-400">
              {opportunity.type || 'recommendation'}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};



// Tabs component
const Tabs = ({ activeTab, onChange, tabs }) => {
  return (
    <div className="flex flex-wrap gap-2 bg-[#1a1b20]/40 rounded-xl p-1 mb-6">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-[#a02ff1] text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <Icon size={16} />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};

const ClientCOptimizationView = ({
  api,
  caps,
  filters,
  filterOptions,
  onFilterChange,
  onReset,
  loading,
  isFiltering,
  optimizationData,
  extractedData,
  isEmptyState,

  // Tab state
  activeTab,
  setActiveTab,
  
  // Interaction state
  selectedInsight,
  setSelectedInsight
}) => {
  const tabs = [
    { id: "opportunities", label: "Top Opportunities", icon: Target },
    { id: "recommendations", label: "Recommendations", icon: Lightbulb },
  ];

  // Calculate total potential savings
  const totalPotentialSavings = extractedData?.totalPotentialSavings || 0;

  return (
    <div className="animate-in fade-in zoom-in-95 duration-300 flex flex-col h-full">

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto relative min-h-0">
        {isFiltering && optimizationData && (
          <div className="absolute top-4 right-4 z-50 flex items-center gap-2 bg-[#1a1b20]/90 backdrop-blur-md border border-[#a02ff1]/30 rounded-lg px-3 py-2 shadow-lg">
            <span className="text-xs text-gray-300 font-medium">Filtering...</span>
          </div>
        )}

        {!optimizationData || isEmptyState ? (
          <div className="flex items-center justify-center h-64 bg-[#0f0f11] rounded-xl border border-white/5">
            <div className="text-center text-gray-500">
              <Calendar className="mx-auto mb-2 text-gray-500" size={32} />
              <p className="text-sm">No optimization data available</p>
              <p className="text-xs text-gray-500 mt-1">Try adjusting your filters or select a different upload</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Sparkles size={24} className="text-[#a02ff1]" />
                  Optimization Insights
                </h1>
                <p className="text-sm text-gray-400 mt-1 italic">
                  Decision-support intelligence. No actions are executed from this platform.
                </p>
                <div className="mt-2">
                  <p className="text-sm text-gray-400">
                    Total Potential Savings:{" "}
                    <span className="text-green-400 font-bold">
                      ${totalPotentialSavings?.toLocaleString()}/month
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <Tabs activeTab={activeTab} onChange={setActiveTab} tabs={tabs} />

            <AnimatePresence mode="wait">
              {activeTab === "opportunities" && (
                <motion.div
                  key="opportunities"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <OpportunitiesTab
                    opportunities={extractedData.opportunities}
                    onSelectInsight={setSelectedInsight}
                  />
                </motion.div>
              )}
            
              {activeTab === "recommendations" && (
                <motion.div
                  key="recommendations"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <OpportunitiesTab
                    opportunities={extractedData.recommendations}
                    onSelectInsight={setSelectedInsight}
                    title="Recommendations"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientCOptimizationView;