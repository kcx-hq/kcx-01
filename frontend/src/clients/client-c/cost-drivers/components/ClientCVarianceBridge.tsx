import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { ClientCVarianceBridgeProps, NumericLike } from '../types';

export function ClientCVarianceBridge({ overallStats }: ClientCVarianceBridgeProps) {
  if (!overallStats) {
    return (
      <div className="h-32 flex items-center justify-center text-gray-500">
        <p>No variance data available</p>
      </div>
    );
  }

  const formatCurrency = (value: NumericLike | null | undefined): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(Number(value || 0));
  };

  // Prepare data for the chart
  const chartData = [
    {
      name: 'Previous',
      value: overallStats.previousValue || 0,
      type: 'baseline'
    },
    {
      name: 'Changes',
      value: overallStats.diff || 0,
      type: 'change'
    },
    {
      name: 'Current',
      value: overallStats.currentValue || 0,
      type: 'current'
    }
  ];

  const getBarColor = (type: string, value: number): string => {
    if (type === 'change') {
      return value >= 0 ? '#ef4444' : '#10b981';
    }
    return '#3b82f6';
  };

  return (
    <div className="h-32">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
          <XAxis 
            type="number" 
            stroke="#9ca3af" 
            tick={{ fill: '#9ca3af', fontSize: 10 }}
            tickFormatter={(value: number) => `$${(value / 1000).toFixed(0)}k`}
          />
          <YAxis 
            dataKey="name" 
            type="category" 
            stroke="#9ca3af" 
            tick={{ fill: '#9ca3af', fontSize: 10 }}
            width={60}
          />
          <Tooltip
            contentStyle={{ 
              backgroundColor: '#1f2937', 
              borderColor: '#374151', 
              color: 'white',
              borderRadius: '6px',
              fontSize: '12px'
            }}
            formatter={(value: number | string) => [formatCurrency(value), 'Amount']}
            labelStyle={{ color: '#f9fafb', fontWeight: 'bold' }}
          />
          <Bar
            dataKey="value"
            fill={(entry: { type?: string; value?: number }) => getBarColor(entry.type || "", entry.value || 0)}
            radius={[0, 4, 4, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
