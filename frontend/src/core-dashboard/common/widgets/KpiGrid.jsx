// src/components/dashboard/KpiGrid.jsx
import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, X, Crown } from "lucide-react";

const BRAND = "var(--brand-secondary, #007758)";

/**
 * Small, reusable KPI Card (theme updated: light)
 */
export const KpiCard = ({
  title,
  value,
  icon: Icon,
  color = "text-gray-900",
  subValue,
  delay = 0,
  onClick,
  contextLabel,
  showChangeTooltip,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.1 }}
      whileHover={{ y: -3 }}
      onClick={onClick}
      className="bg-[var(--bg-surface,#ffffff)] border border-gray-200 p-3 rounded-xl shadow-sm relative overflow-hidden group min-h-[100px] cursor-pointer transition-all duration-200 hover:border-gray-300"
    >
      {/* subtle ambient blob */}
      <div
        className={`absolute -top-10 -right-10 p-16 ${color} opacity-[0.06] blur-[40px] rounded-full transition-all duration-500`}
      />

      <div className="relative z-10 flex flex-col h-full justify-between">
        {/* Header */}
        <div className="flex justify-between items-start mb-2">
          <div className="p-1.5 rounded-lg bg-gray-50 border border-gray-200">
            <Icon size={16} className={color} />
          </div>

          {subValue && (
            <div className="relative">
              <span
                className="text-[9px] bg-gray-50 px-1.5 py-0.5 rounded text-gray-600 border border-gray-200 font-mono whitespace-nowrap cursor-help"
                onMouseEnter={() => showChangeTooltip && setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
              >
                {subValue}
              </span>

              {showTooltip && showChangeTooltip && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg p-2 shadow-lg z-50">
                  <p className="text-[10px] text-gray-700">
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

          <div
            className="text-xl font-bold text-gray-900 tracking-tight mt-0.5 truncate"
            title={value}
          >
            {value}
          </div>

          {contextLabel && (
            <div className="text-[9px] text-gray-500 mt-1.5">{contextLabel}</div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

/**
 * Reusable KPI Grid
 */
const KpiGrid = ({
  cards = [],
  extraCards = [],
  locked = false,
  lockOverlay = <Crown size={14} className="text-yellow-500" />,
  onCardClick,
  getInsights,
  ctx,
  columns = "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
}) => {
  const [showMoreCards, setShowMoreCards] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState(null);

  const insights = useMemo(() => {
    if (!selectedCardId || typeof getInsights !== "function") return null;
    try {
      const result = getInsights(selectedCardId, ctx);
      if (result && typeof result === "object") {
        return {
          title: result.title || "Details",
          description: result.description || "",
          metrics: Array.isArray(result.metrics) ? result.metrics : [],
          breakdown: Array.isArray(result.breakdown) ? result.breakdown : [],
          recommendation: result.recommendation || "",
        };
      }
      return null;
    } catch (error) {
      console.warn("Error getting insights for card:", selectedCardId, error);
      return {
        title: "Details",
        description: "Unable to load detailed insights at this time.",
        metrics: [],
        breakdown: [],
        recommendation: "",
      };
    }
  }, [selectedCardId, getInsights, ctx]);

  const handleClick = (card) => {
    try {
      onCardClick?.(card.id, card);
      if (typeof getInsights === "function") setSelectedCardId(card.id);
    } catch (error) {
      console.warn("Error handling KPI card click:", error);
    }
  };

  return (
    <>
      <div className="mb-4">
        <div className={`grid ${columns} gap-4 mb-1`}>
          {cards.map((card, index) => (
            <KpiCard
              key={card.id ?? index}
              delay={card.delay ?? index}
              title={card.title}
              value={card.value}
              icon={card.icon}
              color={card.color}
              subValue={card.subValue}
              contextLabel={card.contextLabel}
              showChangeTooltip={card.showChangeTooltip}
              onClick={() => handleClick(card)}
            />
          ))}

          {showMoreCards &&
            extraCards.map((card, index) => (
              <div key={card.id ?? `extra-${index}`} className="relative">
                {locked && (
                  <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-50 pointer-events-auto flex items-center justify-center rounded-xl border border-gray-200">
                    {lockOverlay}
                  </div>
                )}

                <div className={locked ? "opacity-50 pointer-events-none" : ""}>
                  <KpiCard
                    delay={card.delay ?? index}
                    title={card.title}
                    value={card.value}
                    icon={card.icon}
                    color={card.color}
                    subValue={card.subValue}
                    contextLabel={card.contextLabel}
                    showChangeTooltip={card.showChangeTooltip}
                    onClick={() => handleClick(card)}
                  />
                </div>
              </div>
            ))}
        </div>

        {extraCards.length > 0 && (
          <div className="flex items-center justify-center mt-2">
            <button
              onClick={() => setShowMoreCards((s) => !s)}
              className="group flex items-center gap-2 w-full max-w-xs"
            >
              <div className="flex-1 h-px bg-gray-200" />
              <div
                className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-medium text-gray-600 transition-colors"
                style={{ color: showMoreCards ? BRAND : undefined }}
              >
                <span>{showMoreCards ? "Less" : "More"}</span>
                <ChevronDown
                  size={12}
                  className={`transition-transform duration-300 ${
                    showMoreCards ? "rotate-180" : ""
                  }`}
                />
              </div>
              <div className="flex-1 h-px bg-gray-200" />
            </button>
          </div>
        )}
      </div>

      {/* Insights Modal (light) */}
      {insights && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-start justify-center pt-20 p-4"
          onClick={() => setSelectedCardId(null)}
        >
          <div
            className="bg-white border border-gray-200 rounded-xl shadow-2xl w-full max-w-md max-h-[70vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <h3 className="text-sm font-bold text-gray-900 truncate">
                {insights.title}
              </h3>
              <button
                onClick={() => setSelectedCardId(null)}
                className="p-1 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 overflow-y-auto max-h-[calc(70vh-60px)]">
              {insights.description && (
                <p className="text-xs text-gray-600 mb-4">{insights.description}</p>
              )}

              {Array.isArray(insights.metrics) && insights.metrics.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {insights.metrics.map((metric, idx) => (
                    <div
                      key={idx}
                      className="bg-gray-50 border border-gray-200 rounded-lg p-2.5"
                    >
                      <div
                        className="text-[10px] text-gray-500 mb-ube1 truncate"
                        title={metric.label}
                      >
                        {metric.label}
                      </div>
                      <div
                        className="text-xs font-bold text-gray-900 truncate"
                        title={metric.value}
                      >
                        {metric.value}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {Array.isArray(insights.breakdown) && insights.breakdown.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-xs font-semibold text-gray-700 mb-2">
                    Breakdown
                  </h4>
                  <div className="space-y-1.5">
                    {insights.breakdown.map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-gray-50 border border-gray-200 rounded-lg p-2.5 flex items-center justify-between"
                      >
                        <div className="flex-1 min-w-0">
                          <div
                            className="text-xs font-medium text-gray-900 truncate"
                            title={item.label}
                          >
                            {item.label}
                          </div>
                        </div>
                        <div className="text-right ml-2 flex-shrink-0">
                          <div className="text-xs font-bold text-gray-900">
                            {item.value}
                          </div>
                          {item.percentage && (
                            <div className="text-[10px] text-gray-500">
                              {item.percentage}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {insights.recommendation && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <p className="text-[10px] text-gray-700">
                    {insights.recommendation}
                  </p>
                </div>
              )}

              {!insights.description &&
                !insights.metrics?.length &&
                !insights.breakdown?.length &&
                !insights.recommendation && (
                  <div className="text-center py-6">
                    <div className="text-gray-500 text-xs mb-2">
                      No detailed insights available
                    </div>
                    <div className="text-[10px] text-gray-400">
                      Click outside to close
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default KpiGrid;
