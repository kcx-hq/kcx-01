import React from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  BarChartIcon, 
  PieChart as PieChartIcon
} from "lucide-react";

const ClientCDepartmentCostView = ({
  api,
  caps,
  loading,
  departmentData,
  extractedData,
  isEmptyState
}) => {
  const COLORS = ['#1EA88A', '#48bb78', '#f56565', '#ecc94b', '#4fd1c5', '#22c55e', '#ed8936', '#68d391', '#4c77b6', '#10b981'];

  // Early return for loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-[#f8faf9] rounded-xl border border-slate-200">
        <div className="text-center text-gray-500">
          <DollarSign className="mx-auto mb-2 text-gray-500" size={32} />
          <p className="text-sm">Loading department cost analysis...</p>
        </div>
      </div>
    );
  }

  // Show empty state
  if (!departmentData) {
    return (
      <div className="flex items-center justify-center h-64 bg-[#f8faf9] rounded-xl border border-slate-200">
        <div className="text-center text-gray-500">
          <DollarSign className="mx-auto mb-2 text-gray-500" size={32} />
          <p className="text-sm">No department cost analysis available</p>
          <p className="text-xs text-gray-500 mt-1">Connect to the backend analysis endpoint to view department cost metrics</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in zoom-in-95 duration-300 flex flex-col h-full">

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto relative min-h-0">

        <div className="space-y-6">
          {/* KPI CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-[#ffffff]/60 backdrop-blur-md border border-slate-200 p-5 rounded-2xl shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Total Cost</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">
                    ${extractedData.overview.totalCost?.toLocaleString() || 0}
                  </p>
                </div>
                <div className="p-3 bg-[#1EA88A]/20 rounded-lg">
                  <DollarSign className="text-[#1EA88A]" size={24} />
                </div>
              </div>
              <p className="text-[10px] text-gray-500 mt-2">Overall department spending</p>
            </div>
            
            <div className="bg-[#ffffff]/60 backdrop-blur-md border border-slate-200 p-5 rounded-2xl shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Departments</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">
                    {extractedData.overview.departments?.length || 0}
                  </p>
                </div>
                <div className="p-3 bg-green-500/20 rounded-lg">
                  <Users className="text-green-400" size={24} />
                </div>
              </div>
              <p className="text-[10px] text-gray-500 mt-2">Active cost centers</p>
            </div>
            
            <div className="bg-[#ffffff]/60 backdrop-blur-md border border-slate-200 p-5 rounded-2xl shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Avg/Department</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">
                    ${extractedData.overview.departments?.length > 0 
                      ? Math.round(extractedData.overview.totalCost / extractedData.overview.departments.length).toLocaleString() 
                      : 0}
                  </p>
                </div>
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <TrendingUp className="text-blue-400" size={24} />
                </div>
              </div>
              <p className="text-[10px] text-gray-500 mt-2">Average cost per department</p>
            </div>
            
            <div className="bg-[#ffffff]/60 backdrop-blur-md border border-slate-200 p-5 rounded-2xl shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Top Dept</p>
                  <p className="text-lg font-bold text-slate-800 mt-1 truncate max-w-[120px]">
                    {extractedData.overview.departments?.[0]?.name || 'N/A'}
                  </p>
                  <p className="text-sm text-slate-800">
                    ${extractedData.overview.departments?.[0]?.totalCost?.toLocaleString() || 0}
                  </p>
                </div>
                <div className="p-3 bg-emerald-500/20 rounded-lg">
                  <BarChartIcon className="text-emerald-400" size={24} />
                </div>
              </div>
              <p className="text-[10px] text-gray-500 mt-2">Highest spending department</p>
            </div>
          </div>

          {/* CHARTS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Department Cost Distribution */}
            <div className="bg-[#ffffff]/60 backdrop-blur-md border border-slate-200 rounded-2xl p-5 shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <PieChartIcon size={16} className="text-[#1EA88A]" />
                <h3 className="text-sm font-bold text-slate-800">Department Cost Distribution</h3>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={extractedData.overview.departments.slice(0, 10)}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="totalCost"
                      label={({ name, totalCost }) => `${name}: $${totalCost.toLocaleString()}`}
                    >
                      {extractedData.overview.departments.slice(0, 10).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#ffffff', 
                        borderColor: '#374151',
                        borderRadius: '0.5rem',
                        color: 'white'
                      }}
                      formatter={(value) => [`$${value.toLocaleString()}`, 'Cost']}
                      labelStyle={{ fontWeight: 'bold', color: '#d1d5db' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Cost Trend Over Time */}
            <div className="bg-[#ffffff]/60 backdrop-blur-md border border-slate-200 rounded-2xl p-5 shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={16} className="text-[#1EA88A]" />
                <h3 className="text-sm font-bold text-slate-800">Cost Trend</h3>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={extractedData.trend.daily}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      stroke="#9ca3af" 
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="#9ca3af" 
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `$${value.toLocaleString()}`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#ffffff', 
                        borderColor: '#374151',
                        borderRadius: '0.5rem',
                        color: 'white'
                      }}
                      formatter={(value) => [`$${value.toLocaleString()}`, 'Cost']}
                      labelStyle={{ fontWeight: 'bold', color: '#d1d5db' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="cost" 
                      stroke="#1EA88A" 
                      fill="#1EA88A" 
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* SERVICE BREAKDOWN */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Services by Department */}
            <div className="bg-[#ffffff]/60 backdrop-blur-md border border-slate-200 rounded-2xl p-5 shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <BarChartIcon size={16} className="text-[#1EA88A]" />
                <h3 className="text-sm font-bold text-slate-800">Top Services by Cost</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Service</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Cost</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Percentage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {extractedData.drilldown.services.slice(0, 10).map((service, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-gray-900/50' : 'bg-gray-800/50'}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-300">{service.name}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">${service.cost?.toLocaleString()}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                          {extractedData.trend.totalTrendCost > 0 
                            ? `${((service.cost / extractedData.trend.totalTrendCost) * 100).toFixed(2)}%` 
                            : '0%'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top Resources by Department */}
            <div className="bg-[#ffffff]/60 backdrop-blur-md border border-slate-200 rounded-2xl p-5 shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <BarChartIcon size={16} className="text-[#1EA88A]" />
                <h3 className="text-sm font-bold text-slate-800">Top Resources by Cost</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Resource ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Cost</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Percentage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {extractedData.drilldown.resources.slice(0, 10).map((resource, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-gray-900/50' : 'bg-gray-800/50'}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-300 truncate max-w-[150px]">{resource.resourceId}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">${resource.cost?.toLocaleString()}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                          {extractedData.trend.totalTrendCost > 0 
                            ? `${((resource.cost / extractedData.trend.totalTrendCost) * 100).toFixed(2)}%` 
                            : '0%'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientCDepartmentCostView;