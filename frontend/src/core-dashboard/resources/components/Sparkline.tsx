import React from 'react';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';
import type { SparklineProps } from "../types";

const Sparkline = ({ data, color = '#23a282' }: SparklineProps) => {
  if (!data || data.length < 2) {
    return <div className="h-8 w-24 rounded bg-[var(--bg-surface)] opacity-70" />;
  }

  const chartData = data.map((val: number, i: number) => ({ i, val }));

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



