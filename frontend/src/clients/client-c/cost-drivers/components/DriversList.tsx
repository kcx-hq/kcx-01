import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../common/widgets';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const DriversList = ({ drivers, onDriverSelect, selectedDriver }) => {
  if (!drivers || drivers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cost Drivers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-400">
            No cost drivers data available
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

  const formatPercent = (value) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cost Drivers</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {drivers.map((driver, index) => {
            const isSelected = selectedDriver?.name === driver.name;
            const changeValue = driver.absoluteChange || (driver.currentValue - driver.previousValue) || 0;
            
            return (
              <div
                key={index}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  isSelected 
                    ? 'border-[#a02ff1] bg-[#a02ff1]/10' 
                    : 'border-gray-700 hover:border-gray-600 bg-gray-800/50'
                }`}
                onClick={() => onDriverSelect(driver)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-white truncate">{driver.name}</h3>
                    <p className="text-sm text-gray-400 mt-1">
                      {driver.description || 'Cost driver impact analysis'}
                    </p>
                  </div>
                  
                  <div className="text-right ml-4 flex-shrink-0">
                    <div className={`flex items-center justify-end ${
                      changeValue > 0 ? 'text-red-400' : changeValue < 0 ? 'text-green-400' : 'text-gray-400'
                    }`}>
                      {changeValue > 0 ? (
                        <TrendingUp className="w-4 h-4 mr-1" />
                      ) : changeValue < 0 ? (
                        <TrendingDown className="w-4 h-4 mr-1" />
                      ) : (
                        <Minus className="w-4 h-4 mr-1" />
                      )}
                      <span className="font-medium">
                        {formatCurrency(Math.abs(changeValue))}
                      </span>
                    </div>
                    <div className="text-sm text-gray-400 mt-1">
                      {driver.percentChange !== undefined ? formatPercent(Math.abs(driver.percentChange)) : '0%'}
                    </div>
                  </div>
                </div>
                
                {/* Progress bar showing impact percentage */}
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Impact</span>
                    <span>{driver.impactPercentage ? formatPercent(driver.impactPercentage) : '0%'}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(driver.impactPercentage ? Math.abs(driver.impactPercentage) * 100 : 0, 100)}%`
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default DriversList;