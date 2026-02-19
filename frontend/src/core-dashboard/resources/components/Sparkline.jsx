import React from 'react';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';

const Sparkline = ({ data, color = '#007758' }) => {
  if (!data || data.length < 2) {
    return <div className="h-8 w-24 rounded bg-[var(--bg-surface)] opacity-70" />;
  }

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
            fillOpacity={0.18}
            strokeWidth={2}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export { Sparkline };
export default Sparkline;
