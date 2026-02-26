import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Lock, Activity } from "lucide-react";
import KpiInsightModal from "../components/KpiInsightModal";

// KCX Primary Theme Color
const BRAND_PRIMARY = "#007758";
const BRAND_SOFT = "rgba(0, 119, 88, 0.1)";

/**
 * Small, reusable KPI Card (Emerald Redesign)
 */
export const KpiCard = ({
  title,
  value,
  icon: Icon,
  style = "text-[#007758] bg-[#007758]/5 border-[#007758]/10",
  subValue,
  delay = 0,
  onClick,
  contextLabel,
  showChangeTooltip,
  trendType = "neutral",
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.05, duration: 0.4 }}
      whileHover={{ y: -4, shadow: "0 12px 30px -10px rgba(0,119,88,0.12)" }}
      onClick={onClick}
      className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm relative overflow-hidden group cursor-pointer transition-all duration-300 hover:border-[#007758]/40"
    >
      {/* Branded Ambient Decor */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#007758]/5 to-transparent rounded-bl-full -z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative z-10 flex flex-col h-full space-y-3">
        {/* Header Row */}
        <div className="flex justify-between items-start">
          {/* Icon Container with Emerald Shadow logic */}
          <div className={`p-2 rounded-lg border transition-all duration-300 group-hover:shadow-[0_0_15px_rgba(0,119,88,0.15)] ${style}`}>
            <Icon size={18} />
          </div>

          {subValue && (
            <div className="relative">
              <span
                className={`text-[10px] font-black px-2 py-1 rounded-lg border transition-all duration-300 flex items-center gap-1 ${
                  trendType === 'up' ? 'bg-red-50 border-red-100 text-red-600' : 
                  trendType === 'down' ? 'bg-emerald-50 border-emerald-100 text-[#007758]' : 
                  'bg-slate-50 border-slate-200 text-slate-500'
                }`}
                onMouseEnter={() => showChangeTooltip && setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
              >
                {trendType !== 'neutral' && <Activity size={10} />}
                {subValue}
              </span>

              <AnimatePresence>
                {showTooltip && showChangeTooltip && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute right-0 top-full mt-2 w-40 bg-[#192630] text-white rounded-xl p-2.5 shadow-xl z-50 text-[10px] leading-relaxed border border-white/10"
                  >
                    Variance vs. baseline period
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Value Area */}
        <div>
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.12em] mb-1">
            {title}
          </h4>
          <div className="text-[1.6rem] font-black text-slate-900 tracking-tight truncate leading-tight">
            {value}
          </div>
          {contextLabel && (
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-2 font-medium bg-slate-50/80 w-fit px-2 py-0.5 rounded-md border border-slate-100">
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              {contextLabel}
            </div>
          )}
          <p className="mt-1 text-[10px] font-semibold text-slate-500">Click for insight</p>
        </div>
      </div>
    </motion.div>
  );
};

const KpiGrid = ({
  cards = [],
  extraCards = [],
  locked = false,
  onCardClick,
  getInsights,
  ctx,
  columns = "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
}) => {
  const [showMoreCards, setShowMoreCards] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState(null);

  const insights = useMemo(() => {
    if (!selectedCardId || typeof getInsights !== "function") return null;
    return getInsights(selectedCardId, ctx);
  }, [selectedCardId, getInsights, ctx]);
  const selectedCard = useMemo(() => {
    if (!selectedCardId) return null;
    return [...cards, ...extraCards].find((card) => card.id === selectedCardId) || null;
  }, [cards, extraCards, selectedCardId]);
  const insightPoints = useMemo(() => {
    if (!insights) return [];
    const metrics = Array.isArray(insights.metrics)
      ? insights.metrics.map((metric) => `${metric.label}: ${metric.value}`)
      : [];
    const breakdown = Array.isArray(insights.breakdown)
      ? insights.breakdown.map((metric) => `${metric.label}: ${metric.value}`)
      : [];
    const recommendation = insights.recommendation ? [insights.recommendation] : [];
    return [...metrics, ...breakdown, ...recommendation];
  }, [insights]);
  const contextFromInsight = useMemo(() => {
    if (!insights?.metrics?.length) return null;
    const periodMetric = insights.metrics.find((metric) =>
      String(metric.label || "").toLowerCase().includes("period"),
    );
    return periodMetric ? String(periodMetric.value || "") : null;
  }, [insights]);

  const handleClick = (card) => {
    onCardClick?.(card.id, card);
    if (typeof getInsights === "function") setSelectedCardId(card.id);
  };

  return (
    <>
      <div className="mb-5">
        <div className={`grid ${columns} gap-4 mb-4`}>
          {cards.map((card, index) => (
            <KpiCard
              key={card.id ?? index}
              delay={card.delay ?? index}
              title={card.title}
              value={card.value}
              icon={card.icon}
              style={card.style}
              subValue={card.subValue}
              contextLabel={card.contextLabel}
              trendType={card.trendType}
              showChangeTooltip={card.showChangeTooltip}
              onClick={() => handleClick(card)}
            />
          ))}

          <AnimatePresence>
            {showMoreCards &&
              extraCards.map((card, index) => (
                <motion.div 
                  key={card.id ?? `extra-${index}`} 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="relative group"
                >
                  {locked && (
                    <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] z-50 flex items-center justify-center rounded-2xl border border-white/50 cursor-not-allowed">
                      <div className="bg-white p-2 rounded-full shadow-lg border border-slate-100 text-amber-500">
                        <Lock size={16} />
                      </div>
                    </div>
                  )}

                  <div className={locked ? "opacity-40 grayscale" : ""}>
                    <KpiCard
                      delay={index}
                      title={card.title}
                      value={card.value}
                      icon={card.icon}
                      style={card.style}
                      subValue={card.subValue}
                      contextLabel={card.contextLabel}
                      showChangeTooltip={card.showChangeTooltip}
                      onClick={() => handleClick(card)}
                    />
                  </div>
                </motion.div>
              ))}
          </AnimatePresence>
        </div>

        {extraCards.length > 0 && (
          <div className="flex items-center justify-center pt-2">
            <button
              onClick={() => setShowMoreCards((s) => !s)}
              className="flex items-center gap-3 px-6 py-2 bg-white border border-slate-200 rounded-full text-[11px] font-bold text-slate-600 hover:text-[#007758] hover:border-[#007758]/30 shadow-sm transition-all active:scale-95 group"
            >
              <span>{showMoreCards ? "Collapse Metrics" : "Explore Extended Insights"}</span>
              <ChevronDown
                size={14}
                className={`transition-transform duration-500 ${showMoreCards ? "rotate-180" : ""}`}
              />
            </button>
          </div>
        )}
      </div>

      <KpiInsightModal
        open={Boolean(insights)}
        title={insights?.title || "KPI Insight"}
        value={selectedCard?.value || null}
        summary={insights?.description || null}
        points={insightPoints}
        contextLabel={selectedCard?.contextLabel || contextFromInsight || null}
        onClose={() => setSelectedCardId(null)}
        maxWidthClass="max-w-lg"
      />
    </>
  );
};

export default KpiGrid;
