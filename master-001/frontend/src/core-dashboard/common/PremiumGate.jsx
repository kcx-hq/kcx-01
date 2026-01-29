// frontend/core/dashboards/overview/data-explorer/components/PremiumGate.jsx
import React from "react";
import { Crown, Lock } from "lucide-react";

/**
 * PremiumGate
 *
 * Variants:
 * - variant="wrap" (default): wraps children, dims them, and shows a centered overlay card
 * - variant="full": covers the full container (use for full pages like pivot)
 * - variant="inlineBadge": shows a small "Premium" badge overlay (no CTA)
 * - variant="card": small crown+label overlay (compact)
 *
 * Notes:
 * - Parent must be `relative` for overlays to position correctly.
 * - In `full`, you can pass `minHeight` if you need extra scroll coverage.
 */
const PremiumGate = ({
  children,
  variant = "wrap", // wrap | full | inlineBadge | card
  minHeight, // optional (e.g. "10000px") for full overlay
  onUpgradeClick, // optional click handler
  ctaText = "Upgrade to Access",
  title = "Premium Feature",
  description = "This feature is available in our paid version",
}) => {
  const CTA = (
    <button
      type="button"
      onClick={onUpgradeClick}
      className="px-6 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30 text-yellow-400 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 mx-auto"
    >
      <Lock size={16} />
      {ctaText}
    </button>
  );

  const FullContent = (
    <div className="text-center p-6">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-500/20 border-2 border-yellow-500/30 mb-4">
        <Crown size={32} className="text-yellow-400" />
      </div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-400 mb-4 max-w-xs">{description}</p>
      {CTA}
    </div>
  );

  // Small badge overlay
  if (variant === "inlineBadge") {
    return (
      <div className="relative">
        <div className="absolute inset-0 bg-[#0f0f11]/80 backdrop-blur-sm z-50 flex items-center justify-center rounded-xl">
          <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-yellow-500/20 border-2 border-yellow-500/30 rounded-lg">
            <Crown size={12} className="text-yellow-400" />
            <span className="text-yellow-400 font-bold text-[10px]">Premium</span>
          </div>
        </div>
        <div className="opacity-50 pointer-events-none">{children}</div>
      </div>
    );
  }

  // Compact card overlay (crown + label only)
  if (variant === "card") {
    return (
      <div className="relative">
        <div className="absolute inset-0 bg-[#0f0f11]/80 backdrop-blur-sm z-50 pointer-events-auto flex items-center justify-center rounded-2xl">
          <div className="text-center p-2">
            <Crown size={16} className="text-yellow-400 mx-auto mb-1" />
            <span className="text-yellow-400 font-bold text-[10px]">Premium</span>
          </div>
        </div>
        <div className="opacity-50 pointer-events-none">{children}</div>
      </div>
    );
  }

  // Full page/container overlay
  if (variant === "full") {
    return (
      <div className="relative">
        <div
          className="absolute inset-0 bg-[#0f0f11]/80 backdrop-blur-sm z-50 pointer-events-auto"
          style={minHeight ? { minHeight } : undefined}
        >
          <div className="sticky top-1/2 -translate-y-1/2 flex items-center justify-center">
            {FullContent}
          </div>
          {/* keep children mounted if needed */}
          {children}
        </div>
      </div>
    );
  }

  // Default: wrap (dims children + full CTA overlay card)
  return (
    <div className="relative">
      <div className="absolute inset-0 bg-[#0f0f11]/80 backdrop-blur-sm z-50 pointer-events-auto flex items-center justify-center rounded-2xl">
        {FullContent}
      </div>
      <div className="opacity-50 pointer-events-none">{children}</div>
    </div>
  );
};

export default PremiumGate;
