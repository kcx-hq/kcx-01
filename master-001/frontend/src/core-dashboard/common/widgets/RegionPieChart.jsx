import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { MapPin, Settings2 } from 'lucide-react';

const COLORS = ['#a02ff1', '#60a5fa', '#34d399', '#f87171', '#fbbf24', '#a78bfa', '#fb7185', '#38bdf8'];

const RegionPieChart = ({ data, limit = 8, onLimitChange, totalSpend = 0 }) => {
  const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  
  // Process data to add "Others" bucket for regions < 2%
  const processedData = React.useMemo(() => {
    if (!data || data.length === 0) return [];
    
    const threshold = totalSpend * 0.02; // 2% threshold
    const mainRegions = [];
    let othersTotal = 0;
    
    data.forEach(item => {
      if (item.value >= threshold) {
        mainRegions.push(item);
      } else {
        othersTotal += item.value;
      }
    });
    
    // Sort by value descending
    mainRegions.sort((a, b) => b.value - a.value);
    
    // Add "Others" if there are any small regions
    if (othersTotal > 0) {
      mainRegions.push({
        name: 'Others',
        value: othersTotal
      });
    }
    
    return mainRegions;
  }, [data, totalSpend]);

  return (
    <div className="bg-[#1a1b20]/60 backdrop-blur-md border border-white/5 rounded-2xl p-5 flex flex-col shadow-xl min-h-[300px]">
      <div className="mb-4 flex justify-between items-center h-8">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <MapPin size={16} className="text-blue-400" /> Regional Distribution
        </h3>
        {onLimitChange && (
          <div className="flex items-center gap-2">
            <Settings2 size={12} className="text-gray-500" />
            <select
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="text-[10px] bg-[#0f0f11] border border-white/10 hover:border-[#a02ff1]/50 rounded px-2 py-1 text-gray-300 focus:outline-none focus:border-[#a02ff1] focus:ring-2 focus:ring-[#a02ff1]/50 focus:shadow-[0_0_15px_rgba(160,47,241,0.4)] transition-all cursor-pointer"
              style={{
                colorScheme: 'dark'
              }}
            >
              <option value={5} style={{ backgroundColor: '#0f0f11', color: '#d1d5db' }}>Top 5</option>
              <option value={8} style={{ backgroundColor: '#0f0f11', color: '#d1d5db' }}>Top 8</option>
              <option value={10} style={{ backgroundColor: '#0f0f11', color: '#d1d5db' }}>Top 10</option>
              <option value={12} style={{ backgroundColor: '#0f0f11', color: '#d1d5db' }}>Top 12</option>
            </select>
          </div>
        )}
      </div>

      <div className="flex-1 w-full min-h-0 flex flex-col gap-4">
        {/* Pie Chart */}
        <div className="flex-1 w-full flex items-center justify-center" style={{ minHeight: '320px', height: '320px', padding: '20px', overflow: 'visible' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 50, right: 50, bottom: 50, left: 50 }}>
              <Pie
                data={processedData}
                cx="50%"
                cy="50%"
                labelLine={{ stroke: '#9ca3af', strokeWidth: 1 }}
                label={({ percent, cx, cy, midAngle, innerRadius, outerRadius }) => {
                  const RADIAN = Math.PI / 180;
                  const radius = outerRadius + 25; // Position labels outside the pie
                  const x = cx + radius * Math.cos(-midAngle * RADIAN);
                  const y = cy + radius * Math.sin(-midAngle * RADIAN);
                  
                  return (
                    <text
                      x={x}
                      y={y}
                      fill="white"
                      textAnchor={x > cx ? 'start' : 'end'}
                      dominantBaseline="central"
                      fontSize="11"
                      fontWeight="600"
                      style={{
                        textShadow: '0 0 8px rgba(255,255,255,0.8), 0 0 12px rgba(160,47,241,0.6), 0 0 16px rgba(160,47,241,0.4)',
                        textRendering: 'geometricPrecision',
                        WebkitFontSmoothing: 'antialiased',
                        MozOsxFontSmoothing: 'grayscale'
                      }}
                    >
                      {`${(percent * 100).toFixed(0)}%`}
                    </text>
                  );
                }}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {processedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#1a1b20', borderColor: 'rgba(255,255,255,0.2)', borderRadius: '8px', fontSize: '12px', color: '#fff', padding: '8px 12px' }} 
                itemStyle={{ color: '#fff' }}
                formatter={(value, name) => [formatCurrency(value), name]} 
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        {/* Legend at Bottom - Horizontal Grid, Sorted by Spend Descending */}
        <div className="w-full pt-2 border-t border-white/5">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {processedData.map((entry, index) => (
              <div key={`legend-${index}`} className="flex items-center gap-2 text-[10px]">
                <div 
                  className="w-3 h-3 rounded-sm flex-shrink-0" 
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-gray-300 truncate" title={entry.name}>
                  {entry.name}
                </span>
                <span className="text-gray-500 flex-shrink-0 ml-auto">
                  {formatCurrency(entry.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegionPieChart;