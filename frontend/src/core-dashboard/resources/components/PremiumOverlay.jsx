import React from 'react';
import { Crown, Lock } from 'lucide-react';

const PremiumOverlay = ({ variant = 'card' }) => {
  if (variant === 'inlineBadge') {
    return (
      <div className="absolute inset-0 bg-[#0f0f11]/80 backdrop-blur-sm z-50 flex items-center justify-center rounded-xl">
        <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-yellow-500/20 border-2 border-yellow-500/30 rounded-lg">
          <Crown size={12} className="text-yellow-400" />
          <span className="text-yellow-400 font-bold text-[10px]">Premium</span>
        </div>
      </div>
    );
  }

  if (variant === 'full') {
    return (
      <div className="absolute inset-0 bg-[#0f0f11]/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="text-center p-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-500/20 border-2 border-yellow-500/30 mb-4">
            <Crown size={32} className="text-yellow-400" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Premium Feature</h3>
          <p className="text-sm text-gray-400 mb-4 max-w-xs">
            This feature is available in our paid version
          </p>
          <button className="px-6 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30 text-yellow-400 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 mx-auto">
            <Lock size={16} />
            Upgrade to Access
          </button>
        </div>
      </div>
    );
  }

  // card default
  return (
    <div className="absolute inset-0 bg-[#0f0f11]/80 backdrop-blur-sm z-50 pointer-events-auto flex items-center justify-center rounded-2xl">
      <div className="text-center p-2">
        <Crown size={16} className="text-yellow-400 mx-auto mb-1" />
        <span className="text-yellow-400 font-bold text-[10px]">Premium</span>
      </div>
    </div>
  );
};

export default PremiumOverlay;
