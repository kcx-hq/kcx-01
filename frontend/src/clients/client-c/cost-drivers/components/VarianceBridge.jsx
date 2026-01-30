import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../common/widgets';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const VarianceBridge = ({ data }) => {
  if (!data || !data.increases || !data.decreases) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Variance Bridge</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-400">
            No variance bridge data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(value);
  };

  // Prepare data for the chart
  const chartData = [
    ...(data.previousValue ? [{ name: 'Previous', value: data.previousValue, type: 'baseline' }] : []),
    ...data.increases.map(inc => ({
      name: inc.name || inc.serviceName || inc.driverName,
      value: inc.absoluteChange || inc.change || 0,
      type: 'increase'
    })),
    ...(data.currentValue ? [{ name: 'Current', value: data.currentValue, type: 'current' }] : [])
  ];

  // Add decreases if they exist
  const decreaseData = data.decreases.map(dec => ({
    name: dec.name || dec.serviceName || dec.driverName,
    value: -(dec.absoluteChange || dec.change || 0),
    type: 'decrease'
  }));

  const allChartData = [...chartData.slice(0, 1), ...decreaseData, ...chartData.slice(1)];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Variance Bridge</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={allChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis 
                dataKey="name" 
                stroke="#aaa" 
                tick={{ fill: '#aaa', fontSize: 12 }}
              />
              <YAxis 
                stroke="#aaa" 
                tick={{ fill: '#aaa', fontSize: 12 }}
                tickFormatter={(value) => `$${(value / 1e6).toFixed(1)}M`}
              />
              <Tooltip
                contentStyle={{ 
                  backgroundColor: '#1a1b20', 
                  borderColor: '#333', 
                  color: 'white',
                  borderRadius: '8px'
                }}
                formatter={(value) => [formatCurrency(value), 'Amount']}
                labelStyle={{ color: '#fff', fontWeight: 'bold' }}
              />
              <Bar
                dataKey="value"
                fill="#a02ff1"
                radius={[4, 4, 0, 0]}
                name="Variance"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-800 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-400 mb-2">Total Increases</h4>
            <p className="text-xl font-bold text-green-400">
              {formatCurrency(data.increases.reduce((sum, inc) => sum + (inc.absoluteChange || inc.change || 0), 0))}
            </p>
          </div>
          
          <div className="bg-gray-800 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-400 mb-2">Total Decreases</h4>
            <p className="text-xl font-bold text-red-400">
              {formatCurrency(data.decreases.reduce((sum, dec) => sum + (dec.absoluteChange || dec.change || 0), 0))}
            </p>
          </div>
          
          <div className="bg-gray-800 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-400 mb-2">Net Change</h4>
            <p className="text-xl font-bold text-white">
              {formatCurrency(
                data.increases.reduce((sum, inc) => sum + (inc.absoluteChange || inc.change || 0), 0) -
                data.decreases.reduce((sum, dec) => sum + (dec.absoluteChange || dec.change || 0), 0)
              )}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VarianceBridge;