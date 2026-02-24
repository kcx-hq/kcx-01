import React, { useMemo, useState } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from "recharts";
import { DollarSign, Activity, Maximize2, TrendingUp, Calendar, Tag, Filter, ChevronDown, Cloud, Settings, MapPin, Building, Users, Loader2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

import FilterBar from "../common/widgets/FilterBar.jsx";

import { Card, CardContent, CardHeader, CardTitle } from "../common/widgets";



const ClientCCostAnalysisView = ({
  api,
  caps,
  filters,
  filterOptions,
  onFilterChange,
  onGroupByChange,
  onReset,
  loading,
  isFiltering,
  costAnalysisData,
  extractedData,
  filteredBreakdownData,
  chartFilters,
  onTrendLimitChange,
  onBarLimitChange,
  isEmptyState,
}) => {
  const [selectedCard, setSelectedCard] = useState(null);
  
  const {
    kpis,
    chartData,
    activeKeys,
    breakdown,
    riskData,
    anomalies,
    drivers,
    totalSpend,
    avgDaily,
    peakUsage,
    peakDate,
    trend,
    atRiskSpend,
    forecastTotal,
  } = extractedData;

  // Debug logging for data state
  

  // Enhanced empty state handling
  if (isEmptyState || costAnalysisData?.message === "No upload selected. Please select a billing upload to analyze cost.") {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-[#f8faf9] rounded-xl border border-slate-200 p-8 text-center">
        <div className="mb-4">
          {filters.groupBy === 'Department' ? (
            <Users className="mx-auto text-emerald-400" size={48} />
          ) : (
            <Calendar className="mx-auto text-gray-500" size={48} />
          )}
        </div>
        <h3 className="text-lg font-bold text-slate-800 mb-2">
          {filters.groupBy === 'Department' ? 'No Department Data Found' : 'No Cost Analysis Data'}
        </h3>
        <p className="text-gray-400 mb-4 max-w-md">
          {costAnalysisData?.message || 
           (filters.groupBy === 'Department' 
             ? 'No department information found in resource tags. Ensure your resources are properly tagged with department information.'
             : 'No cost data available for the selected filters. Try adjusting your filters or select a different upload.')}
        </p>
        <div className="flex gap-3">
          <button 
            onClick={onReset}
            className="px-4 py-2 bg-[#1EA88A] hover:bg-[#188f76] text-white rounded-lg text-sm font-medium transition-colors"
          >
            Reset Filters
          </button>
          <button 
            onClick={() => onFilterChange({ provider: 'All', service: 'All', region: 'All' })}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-gray-300 rounded-lg text-sm font-medium transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      </div>
    );
  }

  // Handle case where we have data but it's incomplete
  if (costAnalysisData && (!extractedData?.kpis || extractedData?.totalSpend === 0)) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center justify-center h-96 bg-[#f8faf9] rounded-xl border border-slate-200 p-8 text-center">
          <Calendar className="mx-auto text-yellow-500 mb-4" size={48} />
          <h3 className="text-lg font-bold text-slate-800 mb-2">Limited Data Available</h3>
          <p className="text-gray-400 mb-4 max-w-md">
            Some cost analysis data is available, but key metrics are missing or zero. 
            This may indicate filtering issues or data quality problems.
          </p>
          <div className="flex gap-3">
            <button 
              onClick={onReset}
              className="px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded-lg text-sm font-medium transition-colors"
            >
              Reset Filters
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-gray-300 rounded-lg text-sm font-medium transition-colors"
            >
              Reload Data
            </button>
          </div>
        </div>
        
        {/* Show demo/fallback data */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Total Spend</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-800">
                $0
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                No data available
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Avg Daily</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-800">
                $0
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                No data available
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Forecast</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-800">
                $0
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                No data available
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Categories</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-800">
                0
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                No data available
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Initial loading - this shouldn't be reached due to parent component handling
  // But keeping as fallback
  if (loading && !costAnalysisData) {
    return (
      <div className="flex items-center justify-center h-64 bg-[#f8faf9] rounded-xl border border-slate-200">
        <div className="text-center text-gray-500">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#1EA88A] mb-2"></div>
          <p className="text-sm">Loading cost analysis...</p>
        </div>
      </div>
    );
  }

  // Validate we have required data
  if (!extractedData || !extractedData.kpis) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64 bg-[#f8faf9] rounded-xl border border-slate-200">
          <div className="text-center text-red-400">
            <AlertCircle className="mx-auto mb-2" size={32} />
            <p className="text-sm font-medium">Data Processing Error</p>
            <p className="text-xs text-gray-500 mt-1">Unable to process cost analysis data</p>
          </div>
        </div>
        
        {/* Show demo/fallback data */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Total Spend</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-800">
                $0
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Data processing error
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Avg Daily</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-800">
                $0
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Data processing error
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Forecast</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-800">
                $0
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Data processing error
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Categories</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-800">
                0
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Data processing error
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // KPI Cards
  const kpiCards = [
    {
      id: 'total-spend',
      title: "Total Spend",
      value: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(kpis.totalSpend || 0),
      icon: DollarSign,
      color: "text-[#1EA88A]",
      description: "Total cloud spend",
      delay: 0,
      insights: `Your total spend is ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(kpis.totalSpend || 0)}. This represents your complete cloud expenditure for the selected period.`
    },
    {
      id: 'daily-average',
      title: "Daily Average",
      value: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(kpis.avgDaily || 0),
      icon: Activity,
      color: "text-cyan-400",
      description: "Average daily cost",
      delay: 0.1,
      insights: `Your average daily cost is ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(kpis.avgDaily || 0)}, indicating ${kpis.avgDaily > 1000 ? 'high' : kpis.avgDaily > 500 ? 'moderate' : 'low'} daily cloud consumption.`
    },
    {
      id: 'peak-usage',
      title: "Peak Usage",
      value: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(kpis.peakUsage || 0),
      icon: Maximize2,
      color: "text-emerald-400",
      description: "Highest daily spend",
      delay: 0.2,
      insights: `Your peak usage day reached ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(kpis.peakUsage || 0)} on ${kpis.peakDate || 'N/A'}. Consider investigating resource usage on this day for optimization opportunities.`
    },
    {
      id: 'spend-trend',
      title: "Spend Trend",
      value: `${kpis.trend >= 0 ? '+' : ''}${(kpis.trend || 0).toFixed(1)}%`,
      icon: TrendingUp,
      color: kpis.trend >= 0 ? "text-green-400" : "text-red-400",
      description: "Period-to-period change",
      delay: 0.3,
      insights: `Your spend trend is ${kpis.trend >= 0 ? 'increasing' : 'decreasing'} by ${Math.abs(kpis.trend || 0).toFixed(1)}%. ${kpis.trend > 10 ? 'Consider reviewing your resource allocation for potential cost savings.' : kpis.trend < -10 ? 'Great job optimizing your cloud costs!' : 'Your spending is relatively stable.'}`
    },
  ];

  // Chart Colors - Extended palette for department views
  const COLORS = [
    '#1EA88A', '#48bb78', '#f56565', '#ecc94b', 
    '#4fd1c5', '#22c55e', '#ed64a6', '#38b2ac',
    '#f6ad55', '#63b3ed', '#fc8181', '#68d391',
    '#a7f3d0', '#c084fc', '#f472b6', '#7dd3fc'
  ];

  // Enhanced Chart Tooltip with department support
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#ffffff] border border-slate-200 p-3 rounded-lg shadow-lg max-w-xs">
          <p className="text-gray-300 text-sm font-medium mb-2">{label}</p>
          <div className="space-y-1">
            {payload.map((entry, index) => {
              // Handle stacked area chart data
              if (entry.dataKey && entry.dataKey !== 'total' && entry.dataKey !== 'date') {
                return (
                  <div key={`item-${index}`} className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: entry.color }}
                      />
                      <span className="text-xs text-gray-300">{entry.dataKey}:</span>
                    </div>
                    <span className="text-xs font-mono font-bold" style={{ color: entry.color }}>
                      {new Intl.NumberFormat('en-US', { 
                        style: 'currency', 
                        currency: 'USD',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0 
                      }).format(entry.value)}
                    </span>
                  </div>
                );
              }
              return null;
            })}
            {/* Show total if present */}
            {payload.find(p => p.dataKey === 'total') && (
              <div className="border-t border-slate-200 pt-2 mt-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400 font-medium">Total:</span>
                  <span className="text-xs font-mono font-bold text-slate-800">
                    {new Intl.NumberFormat('en-US', { 
                      style: 'currency', 
                      currency: 'USD',
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0 
                    }).format(payload.find(p => p.dataKey === 'total').value)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  // Enhanced Pie Chart Tooltip
  const PieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = totalSpend > 0 ? ((data.value / totalSpend) * 100) : 0;
      
      return (
        <div className="bg-[#ffffff] border border-slate-200 p-3 rounded-lg shadow-lg">
          <p className="text-gray-300 text-sm font-medium flex items-center gap-2 mb-1">
            {filters.groupBy === 'Department' && <Users size={14} className="text-emerald-400" />}
            {data.name}
          </p>
          <p className="text-slate-800 text-sm font-bold">
            {new Intl.NumberFormat('en-US', { 
              style: 'currency', 
              currency: 'USD',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0 
            }).format(data.value)}
          </p>
          <p className="text-gray-400 text-xs mt-1">
            {percentage.toFixed(1)}% of total spend
          </p>
          {percentage > 20 && (
            <div className="mt-2 pt-2 border-t border-slate-200">
              <span className="text-[10px] text-yellow-400 font-medium">⚠️ High spend category</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <>
      <div className="animate-in fade-in zoom-in-95 duration-300 flex flex-col h-full">
        {/* FILTERS */}
        <div className="shrink-0 space-y-4 mb-4">
          <div className="bg-[#ffffff] border border-slate-200 p-4 rounded-xl flex flex-wrap gap-4 items-center shadow-lg relative z-40">
            <div className="flex items-center gap-2 text-sm text-gray-400 font-bold mr-2 uppercase tracking-wider">
              <Filter size={16} className="text-[#1EA88A]" /> 
            </div>
            
            <FilterBar
              filters={filters}
              onChange={onFilterChange}
              onReset={onReset}
              providerOptions={filterOptions.providers}
              serviceOptions={filterOptions.services}
              regionOptions={filterOptions.regions}
            />

            {/* Group By Dropdown */}
            <div className="flex flex-col gap-1.5 relative">
              <div className="flex items-center gap-2">
                <Tag size={14} className="text-emerald-400" />
                <label className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">
                  Group By
                </label>
              </div>
              <div className="relative group">
                <select
                  value={filters.groupBy}
                  onChange={(e) => onGroupByChange(e.target.value)}
                  className="appearance-none bg-[#f8faf9] border border-slate-200 hover:border-[#1EA88A]/50 rounded-lg pl-3 pr-8 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#1EA88A]/50 transition-all min-w-[140px] text-gray-300 z-40 relative cursor-pointer"
                >
                  <option value="ServiceName">Service</option>
                  <option value="RegionName">Region</option>
                  <option value="ProviderName">Provider</option>
                  <option value="Department">Department</option>
                </select>
                
                <ChevronDown 
                  size={14} 
                  className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none z-40 text-gray-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto relative min-h-0">
          {isFiltering && costAnalysisData && (
            <div className="absolute top-4 right-4 z-50 flex items-center gap-2 bg-[#ffffff]/90 backdrop-blur-md border border-[#1EA88A]/30 rounded-lg px-3 py-2 shadow-lg">
              <span className="text-xs text-gray-300 font-medium">Filtering...</span>
            </div>
          )}

          {!costAnalysisData || (!loading && extractedData.chartData.length === 0 && extractedData.kpis.totalSpend === 0) ? (
            <div className="flex items-center justify-center h-64 bg-[#f8faf9] rounded-xl border border-slate-200">
              <div className="text-center text-gray-500">
                <Calendar className="mx-auto mb-2 text-gray-500" size={32} />
                <p className="text-sm">No cost analysis data available</p>
                <p className="text-xs text-gray-500 mt-1">Try adjusting your filters or select a different upload</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* KPI GRID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {kpiCards.map((card, index) => (
                  <motion.div
                    key={card.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: card.delay }}
                    whileHover={{ y: -5 }} 
                    onClick={() => setSelectedCard(card)}
                    className="bg-[#ffffff]/60 backdrop-blur-md border border-slate-200 p-4 rounded-xl shadow-lg relative overflow-hidden group min-h-[100px] hover:border-[#1EA88A]/30 transition-all cursor-pointer"
                  >
                    <div className={`absolute -top-10 -right-10 p-16 ${card.color} bg-opacity-5 blur-[40px] rounded-full`} />
                    
                    <div className="relative z-10 flex flex-col h-full justify-between">
                      <div className="flex justify-between items-start mb-2">
                        <div className={`p-1.5 rounded-lg bg-white/5 ${card.color}`}>
                          <card.icon size={16} className={card.color} />
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-gray-500 text-[9px] font-bold uppercase tracking-widest truncate">
                          {card.title}
                        </div>
                        <div className="text-xl font-bold text-slate-800 mt-0.5 truncate">
                          {card.value}
                        </div>
                        <div className="text-[9px] text-gray-500 mt-1.5">
                          {card.description}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* CHARTS */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Spend Over Time (Area Chart for better visualization) */}
                <div className="bg-[#ffffff]/60 backdrop-blur-md border border-slate-200 rounded-2xl p-5 shadow-xl">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-[#1EA88A]" />
                      <h3 className="text-sm font-bold text-slate-800">
                        {filters.groupBy === 'Department' ? 'Department Spend Over Time' : 'Spend Over Time'}
                      </h3>
                    </div>
                    <div className="flex gap-2">
                      <select
                        value={chartFilters.trendChart.limit}
                        onChange={(e) => onTrendLimitChange(Number(e.target.value))}
                        className="bg-[#f8faf9] border border-slate-200 rounded px-2 py-1 text-xs text-gray-300"
                      >
                        <option value={7}>7 Days</option>
                        <option value={15}>15 Days</option>
                        <option value={30}>30 Days</option>
                        <option value={90}>90 Days</option>
                      </select>
                    </div>
                  </div>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      {filters.groupBy === 'Department' && activeKeys.length > 0 ? (
                        <AreaChart 
                          data={chartData.slice(-chartFilters.trendChart.limit)}
                          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                        >
                          <defs>
                            {activeKeys.map((key, index) => (
                              <linearGradient key={key} id={`color${index}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.8}/>
                                <stop offset="95%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.1}/>
                              </linearGradient>
                            ))}
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                          <XAxis 
                            dataKey="date"
                            tick={{ fontSize: 11, fill: '#9CA3AF' }}
                            axisLine={{ stroke: '#374151' }}
                            tickLine={{ stroke: '#374151' }}
                            tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          />
                          <YAxis 
                            tick={{ fontSize: 11, fill: '#9CA3AF' }}
                            axisLine={{ stroke: '#374151' }}
                            tickLine={{ stroke: '#374151' }}
                            tickFormatter={(value) => `$${value >= 1000 ? (value/1000).toFixed(0) + 'K' : value}`}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend />
                          {activeKeys.map((key, index) => (
                            <Area
                              key={key}
                              type="monotone"
                              dataKey={key}
                              stackId="1"
                              stroke={COLORS[index % COLORS.length]}
                              fill={`url(#color${index})`}
                              strokeWidth={2}
                            />
                          ))}
                        </AreaChart>
                      ) : (
                        <LineChart data={chartData.slice(-chartFilters.trendChart.limit)}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                          <XAxis 
                            dataKey="date"
                            tick={{ fontSize: 12, fill: '#9CA3AF' }}
                            axisLine={{ stroke: '#374151' }}
                            tickLine={{ stroke: '#374151' }}
                            tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          />
                          <YAxis 
                            tick={{ fontSize: 12, fill: '#9CA3AF' }}
                            axisLine={{ stroke: '#374151' }}
                            tickLine={{ stroke: '#374151' }}
                            tickFormatter={(value) => `$${value >= 1000 ? (value/1000).toFixed(0) + 'K' : value}`}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="total" 
                            stroke="#1EA88A" 
                            strokeWidth={3}
                            dot={{ r: 3 }}
                            activeDot={{ r: 6, stroke: '#1EA88A', strokeWidth: 2, fill: '#ffffff' }}
                          />
                        </LineChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Spend Distribution (Enhanced Bar Chart) */}
                <div className="bg-[#ffffff]/60 backdrop-blur-md border border-slate-200 rounded-2xl p-5 shadow-xl">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                      {filters.groupBy === 'Department' ? (
                        <Users size={16} className="text-emerald-400" />
                      ) : filters.groupBy === 'ServiceName' ? (
                        <Settings size={16} className="text-[#1EA88A]" />
                      ) : filters.groupBy === 'RegionName' ? (
                        <MapPin size={16} className="text-green-400" />
                      ) : (
                        <Cloud size={16} className="text-cyan-400" />
                      )}
                      <h3 className="text-sm font-bold text-slate-800">
                        {filters.groupBy === 'Department' ? 'Department Distribution' : 'Spend Distribution'}
                      </h3>
                    </div>
                    <div className="flex gap-2">
                      <select
                        value={chartFilters.barChart.limit}
                        onChange={(e) => onBarLimitChange(Number(e.target.value))}
                        className="bg-[#f8faf9] border border-slate-200 rounded px-2 py-1 text-xs text-gray-300"
                      >
                        <option value={5}>Top 5</option>
                        <option value={10}>Top 10</option>
                        <option value={15}>Top 15</option>
                        <option value={20}>Top 20</option>
                      </select>
                    </div>
                  </div>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={filteredBreakdownData}
                        layout="vertical"
                        margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#444" horizontal={false} />
                        <XAxis 
                          type="number"
                          tick={{ fontSize: 11, fill: '#9CA3AF' }}
                          axisLine={{ stroke: '#374151' }}
                          tickLine={{ stroke: '#374151' }}
                          tickFormatter={(value) => `$${value >= 1000 ? (value/1000).toFixed(0) + 'K' : value}`}
                        />
                        <YAxis 
                          type="category"
                          dataKey="name"
                          tick={{ fontSize: 11, fill: '#9CA3AF' }}
                          axisLine={{ stroke: '#374151' }}
                          tickLine={{ stroke: '#374151' }}
                          width={90}
                          tickFormatter={(value) => value.length > 12 ? `${value.substring(0, 12)}...` : value}
                        />
                        <Tooltip 
                          content={<CustomTooltip />} 
                          formatter={(value) => [
                            new Intl.NumberFormat('en-US', { 
                              style: 'currency', 
                              currency: 'USD',
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0 
                            }).format(value),
                            'Cost'
                          ]}
                        />
                        <Bar 
                          dataKey="value" 
                          radius={[0, 4, 4, 0]}
                          minPointSize={2}
                        >
                          {filteredBreakdownData.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={COLORS[index % COLORS.length]}
                              opacity={entry.value > 0 ? 1 : 0.3}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* BREAKDOWN SECTION - Enhanced with Department support */}
              {breakdown && breakdown.length > 0 && (
                <div className="bg-[#ffffff]/60 backdrop-blur-md border border-slate-200 rounded-2xl p-5 shadow-xl">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                      {filters.groupBy === 'Department' ? (
                        <Users size={16} className="text-emerald-400" />
                      ) : (
                        <Tag size={16} className="text-[#1EA88A]" />
                      )}
                      <h3 className="text-sm font-bold text-slate-800">
                        {filters.groupBy === 'Department' ? 'Department Cost Breakdown' : 'Cost Breakdown'}
                      </h3>
                    </div>
                    <div className="text-xs text-gray-500">
                      {breakdown.length} {breakdown.length === 1 ? 'category' : 'categories'}
                    </div>
                  </div>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={breakdown}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                          nameKey="name"
                          label={({ name, percent }) => {
                            const percentage = (percent * 100);
                            return percentage > 5 ? `${name}: ${percentage.toFixed(0)}%` : '';
                          }}
                          paddingAngle={2}
                        >
                          {breakdown.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={COLORS[index % COLORS.length]}
                              stroke="#ffffff"
                              strokeWidth={1}
                            />
                          ))}
                        </Pie>
                        <Tooltip content={<PieTooltip />} />
                        <Legend 
                          layout="vertical" 
                          verticalAlign="middle" 
                          align="right"
                          content={(props) => {
                            const { payload } = props;
                            if (!payload || payload.length === 0) return null;
                            
                            return (
                              <div className="text-xs text-gray-300 ml-4">
                                {payload.slice(0, 8).map((entry, index) => (
                                  <div key={`legend-${index}`} className="flex items-center gap-2 mb-1">
                                    <div 
                                      className="w-3 h-3 rounded-full" 
                                      style={{ backgroundColor: entry.color }}
                                    />
                                    <span className="truncate max-w-[120px]" title={entry.value.name}>
                                      {entry.value.name}
                                    </span>
                                    <span className="font-mono text-gray-400 ml-auto">
                                      {new Intl.NumberFormat('en-US', { 
                                        style: 'currency', 
                                        currency: 'USD',
                                        minimumFractionDigits: 0,
                                        maximumFractionDigits: 0 
                                      }).format(entry.value.value)}
                                    </span>
                                  </div>
                                ))}
                                {payload.length > 8 && (
                                  <div className="text-gray-500 mt-2 pt-2 border-t border-slate-200">
                                    +{payload.length - 8} more categories
                                  </div>
                                )}
                              </div>
                            );
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* ENHANCED DATA FOOTER WITH GROUPING INFO */}
              <div className="pt-6 border-t border-slate-200">
                <div className="flex flex-wrap justify-between items-center gap-4 text-[10px] text-gray-500">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-[#1EA88A]"></span>
                      Data source: Database
                    </span>
                    <span>•</span>
                    <span>
                      Grouped by: <span className="font-medium text-gray-400 capitalize">{filters.groupBy.replace(/([A-Z])/g, ' $1').trim()}</span>
                    </span>
                    {filters.groupBy === 'Department' && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Users size={10} className="text-emerald-400" />
                          Department data from resource tags
                        </span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <span>
                      Records: <span className="font-medium text-gray-400">{chartData.length || 0} days</span>
                    </span>
                    <span>•</span>
                    <span>
                      Last updated: {" "}
                      {new Date().toLocaleDateString("en-US", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </span>
                  </div>
                </div>
                
                {/* DEPARTMENT LEGEND FOR CLARITY */}
                {filters.groupBy === 'Department' && breakdown.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Users size={14} className="text-emerald-400" />
                      <span className="text-xs font-medium text-gray-400">Department Legend</span>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {breakdown.slice(0, 6).map((dept, index) => (
                        <div key={dept.name} className="flex items-center gap-2 text-[10px]">
                          <div 
                            className="w-2 h-2 rounded-full" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="text-gray-500">{dept.name}</span>
                          <span className="text-gray-400 font-mono">
                            {new Intl.NumberFormat('en-US', { 
                              style: 'currency', 
                              currency: 'USD',
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0 
                            }).format(dept.value)}
                          </span>
                        </div>
                      ))}
                      {breakdown.length > 6 && (
                        <span className="text-[10px] text-gray-500">
                          +{breakdown.length - 6} more departments
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* INSIGHTS MODAL */}
      {selectedCard && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#ffffff] border border-slate-200 rounded-2xl max-w-md w-full max-h-[80vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-white/5 ${selectedCard.color}`}>
                    <selectedCard.icon size={24} className={selectedCard.color} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">{selectedCard.title} Insights</h3>
                </div>
                <button 
                  onClick={() => setSelectedCard(null)}
                  className="text-gray-400 hover:text-slate-800 transition-colors"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="bg-[#f8faf9] border border-slate-200 rounded-xl p-4">
                  <div className="text-sm text-gray-300 mb-2">Current Value:</div>
                  <div className="text-2xl font-bold text-slate-800">{selectedCard.value}</div>
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm font-medium text-slate-800">Insights & Recommendations</div>
                  <div className="text-sm text-gray-300 leading-relaxed">{selectedCard.insights}</div>
                </div>
                
                <div className="pt-2">
                  <div className="text-xs text-gray-500">Click outside to close or press the X button</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ClientCCostAnalysisView;