import React from 'react';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';

const Sparkline = ({ data, color = '#a02ff1' }) => {
  if (!data || data.length < 2)
    return <div className="h-8 w-24 bg-white/5 rounded opacity-20" />;

  const chartData = data.map((val, i) => ({ i, val }));

  return (
    <div className="h-8 w-24">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <Area
            type="monotone"
            dataKey="val"
            stroke={color}
            fill={color}
            fillOpacity={0.2}
            strokeWidth={2}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default Sparkline;
