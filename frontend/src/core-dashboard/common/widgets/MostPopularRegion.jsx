import React, { useMemo } from 'react';
import { Globe } from 'lucide-react';

const MostPopularRegion = ({ data, totalSpend = 0, billingPeriod = null }) => {
  const formatCurrency = (val) => new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: 'USD', 
    minimumFractionDigits: 0, 
    maximumFractionDigits: 0 
  }).format(val);

  // Process all region data (not limited)
  const allRegions = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    return data
      .map(({ name, value }) => ({
        name,
        value,
        percentage: totalSpend > 0 ? (value / totalSpend) * 100 : 0
      }))
      .sort((a, b) => b.value - a.value);
  }, [data, totalSpend]);

  // Calculate font sizes based on percentage (word cloud style)
  const getFontSize = (percentage, maxPercentage) => {
    if (percentage === maxPercentage) {
      return 'clamp(2.5rem, 6vw, 4rem)'; // Largest for top region
    }
    if (percentage > maxPercentage * 0.5) {
      return 'clamp(1.2rem, 3vw, 1.8rem)'; // Large
    }
    if (percentage > maxPercentage * 0.2) {
      return 'clamp(0.9rem, 2vw, 1.2rem)'; // Medium
    }
    if (percentage > maxPercentage * 0.1) {
      return 'clamp(0.75rem, 1.5vw, 1rem)'; // Small
    }
    return 'clamp(0.65rem, 1.2vw, 0.85rem)'; // Very small
  };

  if (allRegions.length === 0) {
    return (
      <div className="bg-[#1a1b20]/60 backdrop-blur-md border border-white/5 rounded-2xl p-6 flex flex-col shadow-xl">
        <div className="mb-4 flex justify-between items-center">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Globe size={16} className="text-[#a02ff1]" />
            Most Popular Region by Effective Cost
          </h3>
          <div className="text-[10px] text-gray-500">
            {billingPeriod && billingPeriod.start && billingPeriod.end 
              ? `${new Date(billingPeriod.start).toLocaleDateString()} - ${new Date(billingPeriod.end).toLocaleDateString()} • ` 
              : 'Previous month • '}Use drill down → Provider
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center text-gray-500 text-sm min-h-[300px]">
          No region data available
        </div>
      </div>
    );
  }

  const maxPercentage = allRegions[0]?.percentage || 0;

  return (
    <div className="bg-[#1a1b20]/60 backdrop-blur-md border border-white/5 rounded-2xl p-6 flex flex-col shadow-xl">
      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Globe size={16} className="text-[#a02ff1]" />
          Most Popular Region by Effective Cost
        </h3>
        <div className="text-[10px] text-gray-500">
          {billingPeriod && billingPeriod.start && billingPeriod.end 
            ? `${new Date(billingPeriod.start).toLocaleDateString()} - ${new Date(billingPeriod.end).toLocaleDateString()} • ` 
            : 'Previous month • '}Use drill down → Provider
        </div>
      </div>

      <div className="flex-1 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 min-h-[300px] content-center p-4">
        {allRegions.map((region, index) => {
          const fontSize = getFontSize(region.percentage, maxPercentage);
          const isTopRegion = index === 0;
          
          return (
            <span
              key={index}
              className={`${isTopRegion ? 'text-white font-bold' : 'text-gray-400'} hover:text-white transition-colors cursor-default inline-block`}
              style={{ 
                fontSize,
                lineHeight: '1.2',
                fontWeight: isTopRegion ? '700' : '400'
              }}
              title={`${region.name}: ${formatCurrency(region.value)} (${region.percentage.toFixed(1)}%)`}
            >
              {region.name}
            </span>
          );
        })}
      </div>
    </div>
  );
};

export default MostPopularRegion;

