import React from 'react';
import { Crown, Lock } from 'lucide-react';

const PremiumOverlay = ({ variant = 'card' }) => {
  if (variant === 'inlineBadge') {
    return (
      <div className="absolute inset-0 z-50 flex items-center justify-center rounded-xl bg-white/75 backdrop-blur-sm">
        <div className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-100 px-2 py-1">
          <Crown size={12} className="text-amber-600" />
          <span className="text-[10px] font-bold text-amber-700">Premium</span>
        </div>
      </div>
    );
  }

  if (variant === 'full') {
    return (
      <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/75 backdrop-blur-sm">
        <div className="p-6 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full border-2 border-amber-300 bg-amber-100">
            <Crown size={32} className="text-amber-600" />
          </div>
          <h3 className="mb-2 text-lg font-bold text-[var(--text-primary)]">Premium Feature</h3>
          <p className="mb-4 max-w-xs text-sm text-[var(--text-muted)]">
            This feature is available in our paid version
          </p>
          <button className="mx-auto flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-100 px-6 py-2 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-200">
            <Lock size={16} />
            Upgrade to Access
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-50 flex pointer-events-auto items-center justify-center rounded-2xl bg-white/75 backdrop-blur-sm">
      <div className="p-2 text-center">
        <Crown size={16} className="mx-auto mb-1 text-amber-600" />
        <span className="text-[10px] font-bold text-amber-700">Premium</span>
      </div>
    </div>
  );
};

export default PremiumOverlay;
