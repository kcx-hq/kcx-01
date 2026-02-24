import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp, Settings2 } from 'lucide-react';

const CostTrendChart = ({ data, limit = 30, onLimitChange, billingPeriod = null, avgDailySpend = 0 }) => {
  const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  // Calculate billing period duration in days if available
  const getBillingPeriodDays = () => {
    if (!billingPeriod || !billingPeriod.start || !billingPeriod.end) return null;
    const start = new Date(billingPeriod.start);
    const end = new Date(billingPeriod.end);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const billingPeriodDays = getBillingPeriodDays();
  const allDataLength = data?.length || 0;
  
  // Ensure limit doesn't exceed available data
  const effectiveLimit = Math.min(limit, allDataLength);
  const displayData = data?.slice(-effectiveLimit) || [];

  return (
    <div className="bg-[#ffffff]/60 backdrop-blur-md border border-slate-200 rounded-2xl p-5 flex flex-col shadow-xl min-h-[300px]">
      <div className="mb-4 flex justify-between items-center h-8">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <TrendingUp size={16} className="text-[#1EA88A]" /> Daily Cost Trend
        </h3>
        {onLimitChange && (
          <div className="flex items-center gap-2">
            <Settings2 size={12} className="text-gray-500" />
            <select
              value={effectiveLimit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="text-[10px] bg-[#f8faf9] border border-slate-200 hover:border-[#1EA88A]/50 rounded px-2 py-1 text-gray-300 focus:outline-none focus:border-[#1EA88A] focus:ring-2 focus:ring-[#1EA88A]/50 focus:shadow-[0_0_15px_rgba(30,168,138,0.4)] transition-all cursor-pointer"
              style={{
                colorScheme: 'dark'
              }}
            >
              {/* Always show standard options */}
              {allDataLength >= 7 && (
                <option value={7} style={{ backgroundColor: '#f8faf9', color: '#d1d5db' }}>Last 7 days</option>
              )}
              {allDataLength >= 15 && (
                <option value={15} style={{ backgroundColor: '#f8faf9', color: '#d1d5db' }}>Last 15 days</option>
              )}
              {allDataLength >= 30 && (
                <option value={30} style={{ backgroundColor: '#f8faf9', color: '#d1d5db' }}>Last 30 days</option>
              )}
              {/* Show billing period option if we have billing period data and it's different from standard options */}
              {billingPeriodDays && allDataLength >= billingPeriodDays && billingPeriodDays !== 7 && billingPeriodDays !== 15 && billingPeriodDays !== 30 && (
                <option value={billingPeriodDays} style={{ backgroundColor: '#f8faf9', color: '#d1d5db' }}>
                  Full Billing Period ({billingPeriodDays} days)
                </option>
              )}
              {/* Fallback: Show all available data if we have more than 30 days and billing period is not available */}
              {!billingPeriodDays && allDataLength > 30 && (
                <option value={allDataLength} style={{ backgroundColor: '#f8faf9', color: '#d1d5db' }}>
                  All Data ({allDataLength} days)
                </option>
              )}
              {/* Show all data option if billing period matches one of the standard options */}
              {billingPeriodDays && (billingPeriodDays === 7 || billingPeriodDays === 15 || billingPeriodDays === 30) && allDataLength > billingPeriodDays && (
                <option value={allDataLength} style={{ backgroundColor: '#f8faf9', color: '#d1d5db' }}>
                  All Data ({allDataLength} days)
                </option>
              )}
            </select>
          </div>
        )}
      </div>

      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={displayData}>
            <defs>
              <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1EA88A" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#1EA88A" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="date" stroke="#6b7280" fontSize={10} tickFormatter={(str) => str.slice(5)} tickMargin={10} axisLine={false} tickLine={false} />
            <YAxis stroke="#6b7280" fontSize={10} tickFormatter={(val) => `$${val}`} axisLine={false} tickLine={false} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#ffffff', borderColor: 'rgba(255,255,255,0.2)', borderRadius: '8px', fontSize: '12px', color: '#fff', padding: '8px 12px' }} 
              itemStyle={{ color: '#fff' }} 
              formatter={(value) => [formatCurrency(value), 'Cost']}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <ReferenceLine 
              y={avgDailySpend} 
              stroke="#6b7280" 
              strokeDasharray="3 3" 
              strokeWidth={1}
              label={{ value: `Avg daily spend: ${formatCurrency(avgDailySpend)}`, position: 'right', fill: '#9ca3af', fontSize: 9 }}
            />
            <Area type="monotone" dataKey="cost" stroke="#1EA88A" strokeWidth={2} fillOpacity={1} fill="url(#colorCost)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CostTrendChart;