import React, { useState } from 'react';
import {
  DollarSign,
  MapPin,
  Server,
  TrendingUp,
  Cloud,
  Tag,
  FileX,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react';
import { motion } from 'framer-motion';

/* ================= KPI CARD ================= */

const KpiCard = ({
  title,
  value,
  icon: Icon,
  color,
  subValue,
  delay,
  onClick,
  contextLabel,
  showChangeTooltip
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.1 }}
      whileHover={{ y: -5 }}
      onClick={onClick}
      className="bg-[#ffffff]/60 backdrop-blur-md border border-slate-200 p-3 rounded-xl shadow-lg relative overflow-hidden group min-h-[100px] cursor-pointer hover:border-[#1EA88A]/30 transition-all"
    >
      <div className={`absolute -top-10 -right-10 p-16 ${color} bg-opacity-5 blur-[40px] rounded-full`} />

      <div className="relative z-10 flex flex-col h-full justify-between">
        {/* Header */}
        <div className="flex justify-between items-start mb-2">
          <div className={`p-1.5 rounded-lg bg-white/5 ${color}`}>
            <Icon size={16} className={color} />
          </div>

          {subValue && (
            <div className="relative">
              <span
                className="text-[9px] bg-white/5 px-1.5 py-0.5 rounded text-gray-400 border border-slate-200 font-mono cursor-help"
                onMouseEnter={() => showChangeTooltip && setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
              >
                {subValue}
              </span>

              {showTooltip && showChangeTooltip && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-[#ffffff] border border-slate-200 rounded-lg p-2 shadow-xl z-50">
                  <p className="text-[10px] text-gray-300">
                    Compared to previous billing period
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div>
          <div className="text-gray-500 text-[9px] font-bold uppercase tracking-widest truncate">
            {title}
          </div>
          <div className="text-xl font-bold text-slate-800 mt-0.5 truncate">
            {value}
          </div>

          {contextLabel && (
            <div className="text-[9px] text-gray-500 mt-1.5">
              {contextLabel}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

/* ================= KPI GRID ================= */

const KpiGrid = ({
  spend,
  topRegion,
  topService,
  spendChangePercent = 0,
  topProvider = { name: 'N/A', value: 0 },
  untaggedCost = 0,
  missingMetadataCost = 0,
  billingPeriod = null,
  topRegionPercent = 0,
  topServicePercent = 0
}) => {
  const [showMoreCards, setShowMoreCards] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);

  const formatCurrency = (val) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(val);

  const formatPercent = (val) => {
    const sign = val >= 0 ? '+' : '';
    return `${sign}${val.toFixed(1)}%`;
  };

  /* ================= INSIGHTS ================= */

  const getInsights = (id) => {
    switch (id) {
      case 'total-billed-cost':
        return {
          title: 'Total Billed Cost',
          description: 'Your total cloud spend across all services and regions.',
          isCompact: true,
          metrics: [
            { label: 'Total Spend', value: formatCurrency(spend) },
            { label: 'Period Change', value: formatPercent(spendChangePercent) },
            {
              label: 'Billing Period',
              value: billingPeriod && billingPeriod.start && billingPeriod.end
                ? `${new Date(billingPeriod.start).toLocaleDateString()} → ${new Date(billingPeriod.end).toLocaleDateString()}`
                : 'N/A'
            }
          ]
        };

      case 'top-cost-region':
        return {
          title: 'Top Cost Region',
          description: 'Region contributing highest cloud spend.',
          metrics: [
            { label: 'Region', value: topRegion?.name || 'N/A' },
            { label: 'Spend', value: formatCurrency(topRegion?.value || 0) },
            { label: '% of Total', value: `${topRegionPercent}%` }
          ]
        };

      case 'top-cost-service':
        return {
          title: 'Top Cost Service',
          description: 'Service contributing highest cloud spend.',
          metrics: [
            { label: 'Service', value: topService?.name || 'N/A' },
            { label: 'Spend', value: formatCurrency(topService?.value || 0) },
            { label: '% of Total', value: `${topServicePercent}%` }
          ]
        };

      case 'spend-change':
        return {
          title: 'Spend Change',
          description: 'Comparison with previous billing period.',
          metrics: [
            { label: 'Change', value: formatPercent(spendChangePercent) },
            {
              label: 'Trend',
              value: spendChangePercent >= 0 ? 'Increasing' : 'Decreasing'
            }
          ]
        };

      case 'top-provider':
        return {
          title: 'Top Provider',
          description: 'Primary cloud provider by spend.',
          metrics: [
            { label: 'Provider', value: topProvider.name },
            { label: 'Spend', value: formatCurrency(topProvider.value) }
          ]
        };

      case 'untagged-cost':
        return {
          title: 'Untagged Cost',
          description: 'Costs without tags.',
          metrics: [
            { label: 'Amount', value: formatCurrency(untaggedCost) }
          ]
        };

      case 'missing-metadata':
        return {
          title: 'Missing Metadata',
          description: 'Costs missing required metadata.',
          metrics: [
            { label: 'Amount', value: formatCurrency(missingMetadataCost) }
          ]
        };

      default:
        return null;
    }
  };

  /* ================= CARDS ================= */

  const baseCards = [
    {
      id: 'total-billed-cost',
      title: 'Total Billed Cost',
      value: formatCurrency(spend),
      icon: DollarSign,
      color: 'text-[#1EA88A]',
      subValue:
        spendChangePercent !== 0 ? formatPercent(spendChangePercent) : null,
      showChangeTooltip: true,
      delay: 0
    },
    {
      id: 'top-cost-region',
      title: 'Top Cost Region',
      value: topRegion?.name || 'N/A',
      icon: MapPin,
      color: 'text-green-400',
      delay: 0.1
    },
    {
      id: 'top-cost-service',
      title: 'Top Cost Service',
      value: topService?.name || 'N/A',
      icon: Server,
      color: 'text-[#1EA88A]',
      delay: 0.2
    },
    {
      id: 'spend-change',
      title: 'Spend Change (%)',
      value: formatPercent(spendChangePercent),
      icon: TrendingUp,
      color: spendChangePercent >= 0 ? 'text-green-400' : 'text-red-400',
      delay: 0.3
    }
  ];

  const extraCards = [
    {
      id: 'top-provider',
      title: 'Top Provider',
      value: topProvider.name,
      icon: Cloud,
      color: 'text-cyan-400'
    },
    {
      id: 'untagged-cost',
      title: 'Untagged Cost',
      value: formatCurrency(untaggedCost),
      icon: Tag,
      color: 'text-yellow-400'
    },
    {
      id: 'missing-metadata',
      title: 'Missing Metadata',
      value: formatCurrency(missingMetadataCost),
      icon: FileX,
      color: 'text-red-400'
    }
  ];

  const allCards = showMoreCards
    ? [...baseCards, ...extraCards]
    : baseCards;

  /* ================= RENDER ================= */

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {allCards.map((card) => (
          <KpiCard
            key={card.id}
            {...card}
            onClick={() => setSelectedCard(getInsights(card.id))}
          />
        ))}
      </div>

      {/* SHOW MORE */}
      <div className="flex justify-center">
        <button
          onClick={() => setShowMoreCards(!showMoreCards)}
          className="flex items-center gap-2 px-4 py-2 bg-[#ffffff]/60 border border-slate-200 rounded-lg text-gray-400 hover:text-slate-800"
        >
          {showMoreCards ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          {showMoreCards ? 'Show Less' : 'Show More Insights'}
        </button>
      </div>

      {/* MODAL */}
      {selectedCard && (
        <div className="fixed inset-0 bg-white backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            className={`bg-[#ffffff] border border-slate-200 rounded-2xl shadow-2xl w-full
              ${selectedCard.isCompact ? 'max-w-md' : 'max-w-2xl'}
            `}
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-slate-800">
                  {selectedCard.title}
                </h3>
                <button
                  onClick={() => setSelectedCard(null)}
                  className="p-1 hover:bg-white/10 rounded-lg"
                >
                  <X size={18} className="text-gray-400" />
                </button>
              </div>

              <p className="text-gray-400 mb-6">
                {selectedCard.description}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedCard.metrics.map((m, i) => (
                  <div key={i} className="bg-white/5 p-4 rounded-lg">
                    <div className="text-gray-500 text-sm">{m.label}</div>
                    <div className="text-slate-800 font-semibold mt-1">
                      {m.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KpiGrid;
