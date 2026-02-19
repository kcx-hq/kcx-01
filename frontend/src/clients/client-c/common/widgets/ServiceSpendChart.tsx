import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Server, Settings2 } from 'lucide-react';

const ServiceSpendChart = ({ data, title = "Spend by Service", limit = 8, onLimitChange, totalSpend = 0 }) => {
  const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  
  // Ensure limit doesn't exceed available data
  const effectiveLimit = Math.min(limit, data?.length || 0);
  const displayData = data?.slice(0, effectiveLimit) || [];
  
  // Colors for the bars
  const COLORS = ['#a02ff1', '#48bb78', '#f56565', '#ecc94b', '#4fd1c5', '#805ad5', '#ed8936', '#63b3ed'];
  
  return (
    <div className="bg-[#1a1b20]/60 backdrop-blur-md border border-white/5 rounded-2xl p-5 flex flex-col shadow-xl min-h-[300px]">
      <div className="mb-4 flex justify-between items-center h-8">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Server size={16} className="text-[#a02ff1]" /> {title}
        </h3>
        {onLimitChange && (
          <div className="flex items-center gap-2">
            <Settings2 size={12} className="text-gray-500" />
            <select
              value={effectiveLimit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="text-[10px] bg-[#0f0f11] border border-white/10 hover:border-[#a02ff1]/50 rounded px-2 py-1 text-gray-300 focus:outline-none focus:border-[#a02ff1] focus:ring-2 focus:ring-[#a02ff1]/50 focus:shadow-[0_0_15px_rgba(160,47,241,0.4)] transition-all cursor-pointer"
              style={{
                colorScheme: 'dark'
              }}
            >
              {[5, 8, 10, 15, 20].map(num => (
                <option key={num} value={num} style={{ backgroundColor: '#0f0f11', color: '#d1d5db' }}>
                  Top {num}
                </option>
              ))}
              <option value={data?.length || 0} style={{ backgroundColor: '#0f0f11', color: '#d1d5db' }}>
                All ({data?.length || 0})
              </option>
            </select>
          </div>
        )}
      </div>

      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={displayData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
            <XAxis 
              type="number" 
              stroke="#6b7280" 
              fontSize={10} 
              tickFormatter={(val) => `$${val}`}
              axisLine={false} 
              tickLine={false} 
            />
            <YAxis 
              dataKey="name" 
              type="category" 
              stroke="#6b7280" 
              fontSize={10} 
              width={80}
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#d1d5db' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1a1b20', 
                borderColor: 'rgba(255,255,255,0.2)', 
                borderRadius: '8px', 
                fontSize: '12px', 
                color: '#fff', 
                padding: '8px 12px' 
              }} 
              itemStyle={{ color: '#fff' }} 
              formatter={(value) => [formatCurrency(value), 'Cost']}
              labelFormatter={(label) => `Service: ${label}`}
            />
            <Bar dataKey="value" name="Cost">
              {displayData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {totalSpend > 0 && (
        <div className="mt-4 pt-3 border-t border-white/5">
          <div className="text-center">
            <p className="text-[10px] text-gray-500">Total Spend</p>
            <p className="text-lg font-bold text-white">{formatCurrency(totalSpend)}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceSpendChart;