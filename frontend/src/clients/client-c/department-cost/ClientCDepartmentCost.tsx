// ClientCDepartmentCost.jsx
import React, { useState, useEffect, useMemo } from "react";
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
import type {
  ApiLikeError,
  ClientCDepartmentCostProps,
  DepartmentCostSourceData,
  DepartmentMetric,
  DepartmentOverviewItem,
  DepartmentResourceCost,
  DepartmentServiceCost,
  NormalizedDepartmentCostData,
  NumericValue,
} from "./types";

const ClientCDepartmentCost = ({ api, caps }: ClientCDepartmentCostProps) => {
  const [departmentData, setDepartmentData] = useState<DepartmentCostSourceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatCurrency = (value: NumericValue) => `$${Number(value || 0).toLocaleString()}`;

  useEffect(() => {
    const fetchDepartmentCostData = async () => {
      if (!api || !caps?.modules?.["departmentCost"]) {
        setError('Department cost module not available');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch all department cost endpoints
        const [overviewRes, trendRes, drilldownRes] = await Promise.allSettled([
          api.call<DepartmentCostSourceData["overview"]>('departmentCost', 'overview'),
          api.call<DepartmentCostSourceData["trend"]>('departmentCost', 'trend'),
          api.call<DepartmentCostSourceData["drilldown"]>('departmentCost', 'drilldown')
        ]);

        const overviewData = overviewRes.status === 'fulfilled'
          ? (overviewRes.value ?? { departments: [], totalCost: 0 })
          : { departments: [], totalCost: 0 };

        const trendData = trendRes.status === 'fulfilled'
          ? (trendRes.value ?? { daily: [], totalCost: 0 })
          : { daily: [], totalCost: 0 };

        const drilldownData = drilldownRes.status === 'fulfilled'
          ? (drilldownRes.value ?? { services: [], resources: [] })
          : { services: [], resources: [] };

        setDepartmentData({
          overview: overviewData,
          trend: trendData,
          drilldown: drilldownData
        });
      } catch (err: unknown) {
        const apiError = err as ApiLikeError;
        setError(apiError.message || 'Failed to fetch department cost data');
      } finally {
        setLoading(false);
      }
    };

    fetchDepartmentCostData();
  }, [api, caps]);

  const extractedData = useMemo<NormalizedDepartmentCostData>(() => {
    if (!departmentData) {
      return {
        overview: {
          departments: [],
          totalCost: 0,
          departmentMetrics: {}
        },
        trend: {
          daily: [],
          totalTrendCost: 0
        },
        drilldown: {
          services: [],
          resources: []
        },
        metadata: {
          isEmptyState: true
        }
      };
    }

    // Normalize overview data
    const overview = departmentData.overview || {};
    const departments: DepartmentOverviewItem[] = Array.isArray(overview.departments) ? overview.departments : [];
    
    const departmentMetrics = departments.reduce<Record<string, DepartmentMetric>>((acc, dept) => {
      acc[dept.name] = {
        totalCost: dept.totalCost || 0,
        percentage: dept.percentage || 0,
        recordCount: dept.recordCount || 0,
        earliestDate: dept.earliestDate || null,
        latestDate: dept.latestDate || null
      };
      return acc;
    }, {});

    // Normalize trend data
    const trend = departmentData.trend || {};
    const dailyTrend = Array.isArray(trend.daily) ? trend.daily : [];

    // Normalize drilldown data
    const drilldown = departmentData.drilldown || {};
    const services = Array.isArray(drilldown.services) ? drilldown.services : [];
    const resources = Array.isArray(drilldown.resources) ? drilldown.resources : [];

    return {
      overview: {
        departments,
        totalCost: overview.totalCost || 0,
        departmentMetrics
      },
      trend: {
        daily: dailyTrend,
        totalTrendCost: trend.totalCost || 0
      },
      drilldown: {
        services,
        resources
      },
      metadata: {
        isEmptyState: departments.length === 0 && 
                     dailyTrend.length === 0 &&
                     services.length === 0 &&
                     resources.length === 0
      }
    };
  }, [departmentData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-[#0f0f11] rounded-xl border border-white/5">
        <div className="text-center text-gray-500">
          <DollarSign className="mx-auto mb-2 text-gray-500" size={32} />
          <p className="text-sm">Loading department cost analysis...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 bg-[#0f0f11] rounded-xl border border-white/5">
        <div className="text-center text-red-400 p-4">
          <DollarSign className="mx-auto mb-2" size={32} />
          <p className="text-sm font-medium mb-1">Error Loading Data</p>
          <p className="text-xs text-gray-500 max-w-md mb-3">
            {error || 'An unexpected error occurred. Please try again.'}
          </p>
        </div>
      </div>
    );
  }

  if (extractedData.metadata.isEmptyState) {
    return (
      <div className="flex items-center justify-center h-64 bg-[#0f0f11] rounded-xl border border-white/5">
        <div className="text-center text-gray-500">
          <DollarSign className="mx-auto mb-2 text-gray-500" size={32} />
          <p className="text-sm">No department cost analysis available</p>
          <p className="text-xs text-gray-500 mt-1">Connect to the backend analysis endpoint to view department cost metrics</p>
        </div>
      </div>
    );
  }

  const COLORS = ['#007758', '#48bb78', '#f56565', '#ecc94b', '#4fd1c5', '#059669', '#ed8936', '#68d391', '#4c77b6', '#d53f8c'];

  return (
    <div className="animate-in fade-in zoom-in-95 duration-300 flex flex-col h-full">
      <div className="flex-1 overflow-y-auto relative min-h-0">
        <div className="space-y-6">
          {/* KPI CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-[#1a1b20]/60 backdrop-blur-md border border-white/5 p-5 rounded-2xl shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Total Cost</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    ${extractedData.overview.totalCost?.toLocaleString() || 0}
                  </p>
                </div>
                <div className="p-3 bg-[#007758]/20 rounded-lg">
                  <DollarSign className="text-[#007758]" size={24} />
                </div>
              </div>
              <p className="text-[10px] text-gray-500 mt-2">Overall department spending</p>
            </div>
            
            <div className="bg-[#1a1b20]/60 backdrop-blur-md border border-white/5 p-5 rounded-2xl shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Departments</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {extractedData.overview.departments?.length || 0}
                  </p>
                </div>
                <div className="p-3 bg-green-500/20 rounded-lg">
                  <Users className="text-green-400" size={24} />
                </div>
              </div>
              <p className="text-[10px] text-gray-500 mt-2">Active cost centers</p>
            </div>
            
            <div className="bg-[#1a1b20]/60 backdrop-blur-md border border-white/5 p-5 rounded-2xl shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Avg/Department</p>
                  <p className="text-2xl font-bold text-white mt-1">
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
            
            <div className="bg-[#1a1b20]/60 backdrop-blur-md border border-white/5 p-5 rounded-2xl shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Top Dept</p>
                  <p className="text-lg font-bold text-white mt-1 truncate max-w-[120px]">
                    {extractedData.overview.departments?.[0]?.name || 'N/A'}
                  </p>
                  <p className="text-sm text-white">
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
            <div className="bg-[#1a1b20]/60 backdrop-blur-md border border-white/5 rounded-2xl p-5 shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <PieChartIcon size={16} className="text-[#007758]" />
                <h3 className="text-sm font-bold text-white">Department Cost Distribution</h3>
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
                      label={({ name, totalCost }: { name?: string; totalCost?: number }) => `${name}: ${formatCurrency(totalCost || 0)}`}
                    >
                      {extractedData.overview.departments.slice(0, 10).map((entry: DepartmentOverviewItem, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1a1b20', 
                        borderColor: '#374151',
                        borderRadius: '0.5rem',
                        color: 'white'
                      }}
                      formatter={(value: NumericValue) => [formatCurrency(value), 'Cost']}
                      labelStyle={{ fontWeight: 'bold', color: '#d1d5db' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Cost Trend Over Time */}
            <div className="bg-[#1a1b20]/60 backdrop-blur-md border border-white/5 rounded-2xl p-5 shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={16} className="text-[#007758]" />
                <h3 className="text-sm font-bold text-white">Cost Trend</h3>
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
                      tickFormatter={(value: NumericValue) => formatCurrency(value)}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1a1b20', 
                        borderColor: '#374151',
                        borderRadius: '0.5rem',
                        color: 'white'
                      }}
                      formatter={(value: NumericValue) => [formatCurrency(value), 'Cost']}
                      labelStyle={{ fontWeight: 'bold', color: '#d1d5db' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="cost" 
                      stroke="#007758" 
                      fill="#007758" 
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
            <div className="bg-[#1a1b20]/60 backdrop-blur-md border border-white/5 rounded-2xl p-5 shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <BarChartIcon size={16} className="text-[#007758]" />
                <h3 className="text-sm font-bold text-white">Top Services by Cost</h3>
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
                    {extractedData.drilldown.services.slice(0, 10).map((service: DepartmentServiceCost, index: number) => (
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
            <div className="bg-[#1a1b20]/60 backdrop-blur-md border border-white/5 rounded-2xl p-5 shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <BarChartIcon size={16} className="text-[#007758]" />
                <h3 className="text-sm font-bold text-white">Top Resources by Cost</h3>
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
                    {extractedData.drilldown.resources.slice(0, 10).map((resource: DepartmentResourceCost, index: number) => (
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

export default ClientCDepartmentCost;
