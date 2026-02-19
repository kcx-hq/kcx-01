import React, { useState } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, AreaChart, Area, RadarChart, Radar
} from 'recharts';
import { 
  Bell, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Filter, 
  RefreshCw, 
  ChevronDown, 
  Cloud, 
  Settings, 
  MapPin,
  DollarSign,
  TrendingUp,
  AlertCircle
} from "lucide-react";

import FilterBar from "../common/widgets/FilterBar";

const ClientCCostAlertsView = ({
  api,
  caps,
  filters,
  filterOptions,
  onFilterChange,
  onReset,
  loading,
  isFiltering,
  alertsData,
  extractedData,
  isEmptyState
}) => {
  const [activeTab, setActiveTab] = useState('alerts');
  const COLORS = ['#a02ff1', '#f56565', '#48bb78', '#ecc94b', '#4fd1c5', '#805ad5'];

  // Error state handling
  const hasErrors = !extractedData || extractedData.metadata.isEmptyState;

  // Tabs for different sections
  const tabs = [
    { id: 'alerts', label: 'Alerts', icon: Bell, count: extractedData?.alerts?.length || 0 },
    { id: 'budget', label: 'Budget Status', icon: DollarSign, count: extractedData?.budgetStatus?.length || 0 },
    { id: 'overview', label: 'Overview', icon: TrendingUp, count: 0 }
  ];

  // Severity color mapping
  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'bg-red-500/20 text-red-400 border border-red-500/30';
      case 'high': return 'bg-orange-500/20 text-orange-400 border border-orange-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
      case 'low': return 'bg-green-500/20 text-green-400 border border-green-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
    }
  };

  // Status color mapping
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-red-500/20 text-red-400 border border-red-500/30';
      case 'resolved': return 'bg-green-500/20 text-green-400 border border-green-500/30';
      case 'suppressed': return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
    }
  };

  return (
    <div className="animate-in fade-in zoom-in-95 duration-300 flex flex-col h-full">
      {/* FILTERS */}
      <div className="shrink-0 space-y-4 mb-4">
        <div className="bg-[#1a1b20] border border-white/5 p-4 rounded-xl flex flex-wrap gap-4 items-center shadow-lg relative z-40">
          <div className="flex items-center gap-2 text-sm text-gray-400 font-bold mr-2 uppercase tracking-wider">
            <Filter size={16} className="text-[#a02ff1]" /> Filters
          </div>
          
          <FilterBar
            filters={filters}
            onChange={onFilterChange}
            onReset={onReset}
            providerOptions={filterOptions?.providers || []}
            serviceOptions={filterOptions?.services || []}
            regionOptions={filterOptions?.regions || []}
            statusOptions={filterOptions?.status || ['All', 'Active', 'Resolved', 'Suppressed']}
            severityOptions={filterOptions?.severity || ['All', 'Critical', 'High', 'Medium', 'Low']}
          />
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-1 mb-6 bg-[#1a1b20]/60 backdrop-blur-md border border-white/5 rounded-xl p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-[#a02ff1] text-white shadow-lg'
                  : 'text-gray-400 hover:text-gray-300 hover:bg-white/5'
              }`}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  activeTab === tab.id ? 'bg-white/20' : 'bg-gray-500/20'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto relative min-h-0">
        {isFiltering && alertsData && (
          <div className="absolute top-4 right-4 z-50 flex items-center gap-2 bg-[#1a1b20]/90 backdrop-blur-md border border-[#a02ff1]/30 rounded-lg px-3 py-2 shadow-lg">
            <span className="text-xs text-gray-300 font-medium">Filtering...</span>
          </div>
        )}

        {!alertsData || hasErrors ? (
          <div className="flex items-center justify-center h-64 bg-[#0f0f11] rounded-xl border border-white/5">
            <div className="text-center text-gray-500">
              <AlertCircle className="mx-auto mb-2 text-gray-500" size={32} />
              <p className="text-sm">No cost alerts data available</p>
              <p className="text-xs text-gray-500 mt-1">Try adjusting your filters or select a different upload</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* ALERTS TAB */}
            {activeTab === 'alerts' && (
              <div className="space-y-6">
                {/* ALERTS SUMMARY CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-[#1a1b20]/60 backdrop-blur-md border border-white/5 p-5 rounded-2xl shadow-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Total Alerts</p>
                        <p className="text-2xl font-bold text-white mt-1">
                          {extractedData.alerts?.length || 0}
                        </p>
                      </div>
                      <div className="p-3 bg-[#a02ff1]/20 rounded-lg">
                        <Bell className="text-[#a02ff1]" size={24} />
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-[#1a1b20]/60 backdrop-blur-md border border-white/5 p-5 rounded-2xl shadow-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Critical</p>
                        <p className="text-2xl font-bold text-red-400 mt-1">
                          {extractedData.alerts?.filter(a => a.severity === 'Critical').length || 0}
                        </p>
                      </div>
                      <div className="p-3 bg-red-500/20 rounded-lg">
                        <AlertTriangle className="text-red-400" size={24} />
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-[#1a1b20]/60 backdrop-blur-md border border-white/5 p-5 rounded-2xl shadow-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">High Severity</p>
                        <p className="text-2xl font-bold text-orange-400 mt-1">
                          {extractedData.alerts?.filter(a => a.severity === 'High').length || 0}
                        </p>
                      </div>
                      <div className="p-3 bg-orange-500/20 rounded-lg">
                        <AlertTriangle className="text-orange-400" size={24} />
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-[#1a1b20]/60 backdrop-blur-md border border-white/5 p-5 rounded-2xl shadow-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Active</p>
                        <p className="text-2xl font-bold text-yellow-400 mt-1">
                          {extractedData.alerts?.filter(a => a.status === 'Active').length || 0}
                        </p>
                      </div>
                      <div className="p-3 bg-yellow-500/20 rounded-lg">
                        <Bell className="text-yellow-400" size={24} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* SEVERITY DISTRIBUTION */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* CHART - R - charts will be changed latter */}
                  <div className="bg-[#1a1b20]/60 backdrop-blur-md border border-white/5 rounded-2xl p-5 shadow-xl">
                    <div className="flex items-center gap-2 mb-4">
                      <AlertTriangle size={16} className="text-[#a02ff1]" />
                      <h3 className="text-sm font-bold text-white">Alert Severity Distribution</h3>
                    </div>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={extractedData.severityDistribution}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, value }) => `${name}: ${value}`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="count"
                          >
                            {extractedData.severityDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* STATUS DISTRIBUTION */}
                  <div className="bg-[#1a1b20]/60 backdrop-blur-md border border-white/5 rounded-2xl p-5 shadow-xl">
                    <div className="flex items-center gap-2 mb-4">
                      <CheckCircle size={16} className="text-[#a02ff1]" />
                      <h3 className="text-sm font-bold text-white">Alert Status Distribution</h3>
                    </div>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={extractedData.statusDistribution}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                          <XAxis dataKey="name" stroke="#9ca3af" />
                          <YAxis stroke="#9ca3af" />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#1a1b20', 
                              borderColor: '#374151',
                              borderRadius: '0.5rem',
                              color: 'white'
                            }}
                          />
                          <Bar dataKey="count" fill="#a02ff1" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* ALERTS TABLE */}
                <div className="bg-[#1a1b20]/60 backdrop-blur-md border border-white/5 rounded-2xl p-5 shadow-xl">
                  <div className="flex items-center gap-2 mb-4">
                    <Bell size={16} className="text-[#a02ff1]" />
                    <h3 className="text-sm font-bold text-white">Recent Alerts</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-700">
                      <thead>
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Alert</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Severity</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Cost Impact</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Created</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800">
                        {extractedData.alerts?.slice(0, 10).map((alert, index) => (
                          <tr key={index} className={index % 2 === 0 ? 'bg-gray-900/50' : 'bg-gray-800/50'}>
                            <td className="px-4 py-3">
                              <div>
                                <div className="text-sm font-medium text-gray-300">{alert.title || alert.name}</div>
                                <div className="text-xs text-gray-500">{alert.description || alert.summary}</div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getSeverityColor(alert.severity)}`}>
                                {alert.severity}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(alert.status)}`}>
                                {alert.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-300">
                              ${alert.costImpact?.toLocaleString() || '0'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500">
                              {new Date(alert.createdAt || alert.timestamp).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* BUDGET STATUS TAB */}
            {activeTab === 'budget' && (
              <div className="space-y-6">
                {/* BUDGET SUMMARY CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-[#1a1b20]/60 backdrop-blur-md border border-white/5 p-5 rounded-2xl shadow-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Total Budgets</p>
                        <p className="text-2xl font-bold text-white mt-1">
                          {extractedData.budgetStatus?.length || 0}
                        </p>
                      </div>
                      <div className="p-3 bg-[#a02ff1]/20 rounded-lg">
                        <DollarSign className="text-[#a02ff1]" size={24} />
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-[#1a1b20]/60 backdrop-blur-md border border-white/5 p-5 rounded-2xl shadow-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Over Budget</p>
                        <p className="text-2xl font-bold text-red-400 mt-1">
                          {extractedData.budgetStatus?.filter(b => b.status === 'Over Budget').length || 0}
                        </p>
                      </div>
                      <div className="p-3 bg-red-500/20 rounded-lg">
                        <AlertTriangle className="text-red-400" size={24} />
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-[#1a1b20]/60 backdrop-blur-md border border-white/5 p-5 rounded-2xl shadow-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">On Track</p>
                        <p className="text-2xl font-bold text-green-400 mt-1">
                          {extractedData.budgetStatus?.filter(b => b.status === 'On Track').length || 0}
                        </p>
                      </div>
                      <div className="p-3 bg-green-500/20 rounded-lg">
                        <CheckCircle className="text-green-400" size={24} />
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-[#1a1b20]/60 backdrop-blur-md border border-white/5 p-5 rounded-2xl shadow-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Near Limit</p>
                        <p className="text-2xl font-bold text-yellow-400 mt-1">
                          {extractedData.budgetStatus?.filter(b => b.status === 'Near Limit').length || 0}
                        </p>
                      </div>
                      <div className="p-3 bg-yellow-500/20 rounded-lg">
                        <AlertTriangle className="text-yellow-400" size={24} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* BUDGET STATUS TABLE */}
                <div className="bg-[#1a1b20]/60 backdrop-blur-md border border-white/5 rounded-2xl p-5 shadow-xl">
                  <div className="flex items-center gap-2 mb-4">
                    <DollarSign size={16} className="text-[#a02ff1]" />
                    <h3 className="text-sm font-bold text-white">Budget Status</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-700">
                      <thead>
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Budget Name</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Spent</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Budget</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Percentage</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800">
                        {extractedData.budgetStatus?.map((budget, index) => (
                          <tr key={index} className={index % 2 === 0 ? 'bg-gray-900/50' : 'bg-gray-800/50'}>
                            <td className="px-4 py-3 text-sm font-medium text-gray-300">
                              {budget.name || budget.budgetName}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                budget.status === 'Over Budget' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                                budget.status === 'On Track' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                                'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                              }`}>
                                {budget.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-300">
                              ${budget.spent?.toLocaleString() || '0'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-300">
                              ${budget.budget?.toLocaleString() || '0'}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center">
                                <div className="w-24 bg-gray-700 rounded-full h-2 mr-2">
                                  <div 
                                    className={`h-2 rounded-full ${
                                      budget.percentage >= 90 ? 'bg-red-500' :
                                      budget.percentage >= 75 ? 'bg-yellow-500' : 'bg-green-500'
                                    }`}
                                    style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs text-gray-400">{budget.percentage?.toFixed(1) || 0}%</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* OVERVIEW SUMMARY */}
                <div className="bg-[#1a1b20]/60 backdrop-blur-md border border-white/5 rounded-2xl p-5 shadow-xl">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp size={16} className="text-[#a02ff1]" />
                    <h3 className="text-sm font-bold text-white">Cost Alerts Overview</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-3">Alert Summary</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-300">Total Alerts</span>
                          <span className="text-sm font-bold text-white">{extractedData.alerts?.length || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-300">Critical Alerts</span>
                          <span className="text-sm font-bold text-red-400">
                            {extractedData.alerts?.filter(a => a.severity === 'Critical').length || 0}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-300">Active Alerts</span>
                          <span className="text-sm font-bold text-yellow-400">
                            {extractedData.alerts?.filter(a => a.status === 'Active').length || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-3">Budget Summary</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-300">Total Budgets</span>
                          <span className="text-sm font-bold text-white">{extractedData.budgetStatus?.length || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-300">Over Budget</span>
                          <span className="text-sm font-bold text-red-400">
                            {extractedData.budgetStatus?.filter(b => b.status === 'Over Budget').length || 0}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-300">On Track</span>
                          <span className="text-sm font-bold text-green-400">
                            {extractedData.budgetStatus?.filter(b => b.status === 'On Track').length || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientCCostAlertsView;