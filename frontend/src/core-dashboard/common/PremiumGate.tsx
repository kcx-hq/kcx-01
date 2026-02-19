// frontend/core/dashboards/overview/data-explorer/components/PremiumGate.jsx
import React from "react";
import { Crown, Lock } from "lucide-react";

const PremiumGate = ({
  children,
  variant = "wrap", // wrap | full | inlineBadge | card
  minHeight,
  onUpgradeClick,
  ctaText = "Upgrade to Access",
  title = "Premium Feature",
  description = "This feature is available in our paid version",
}) => {
  const CTA = (
    <button
      type="button"
      onClick={onUpgradeClick}
      className="px-6 py-2 bg-yellow-100 hover:bg-yellow-200 border border-yellow-300 text-yellow-700 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 mx-auto"
    >
      <Lock size={16} />
      {ctaText}
    </button>
  );

  const FullContent = (
    <div className="text-center p-6 bg-white rounded-2xl border border-gray-200 shadow-lg">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100 border border-yellow-300 mb-4">
        <Crown size={32} className="text-yellow-600" />
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600 mb-4 max-w-xs mx-auto">
        {description}
      </p>
      {CTA}
    </div>
  );

  /* ───────── Inline Badge ───────── */
  if (variant === "inlineBadge") {
    return (
      <div className="relative">
        <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-50 flex items-center justify-center rounded-xl">
          <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-yellow-100 border border-yellow-300 rounded-lg">
            <Crown size={12} className="text-yellow-600" />
            <span className="text-yellow-700 font-bold text-[10px]">
              Premium
            </span>
          </div>
        </div>
        <div className="opacity-50 pointer-events-none">{children}</div>
      </div>
    );
  }

  /* ───────── Compact Card ───────── */
  if (variant === "card") {
    return (
      <div className="relative">
        <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-50 flex items-center justify-center rounded-2xl">
          <div className="text-center p-2">
            <Crown size={16} className="text-yellow-600 mx-auto mb-1" />
            <span className="text-yellow-700 font-bold text-[10px]">
              Premium
            </span>
          </div>
        </div>
        <div className="opacity-50 pointer-events-none">{children}</div>
      </div>
    );
  }

  /* ───────── Full Page Overlay ───────── */
  if (variant === "full") {
    return (
      <div className="relative">
        <div
          className="absolute inset-0 bg-white/75 backdrop-blur-sm z-50 pointer-events-auto"
          style={minHeight ? { minHeight } : undefined}
        >
          <div className="sticky top-1/2 -translate-y-1/2 flex items-center justify-center">
            {FullContent}
          </div>
          {children}
        </div>
      </div>
    );
  }

  /* ───────── Default Wrap ───────── */
  return (
    <div className="relative">
      <div className="absolute inset-0 bg-white/75 backdrop-blur-sm z-50 flex items-center justify-center rounded-2xl">
        {FullContent}
      </div>
      <div className="opacity-50 pointer-events-none">{children}</div>
    </div>
  );
};

export default PremiumGate;
