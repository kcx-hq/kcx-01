// ClientCProjectTracking.jsx
import React, { useState, useEffect, useMemo } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import { 
  FolderOpen, 
  TrendingUp, 
  Calendar,
  BarChartIcon, 
  PieChart as PieChartIcon,
  DollarSign,
  AlertCircle,
  Loader2,
  Clock
} from "lucide-react";

const ClientCProjectTracking = ({ api, caps }) => {
  const [projectData, setProjectData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProjectTrackingData = async () => {
      if (!api || !caps.modules?.projectTracking) {
        setError('Project tracking module not available');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch all project tracking endpoints
        const [overviewRes, burnRateRes, budgetComparisonRes] = await Promise.allSettled([
          api.call('projectTracking', 'overview'),
          api.call('projectTracking', 'burnRate'),
          api.call('projectTracking', 'budgetComparison')
        ]);

        const overviewData = overviewRes.status === 'fulfilled' && overviewRes.value?.success 
          ? overviewRes.value.data 
          : { projects: [], totalCost: 0 };

        const burnRateData = burnRateRes.status === 'fulfilled' && burnRateRes.value?.success 
          ? burnRateRes.value.data 
          : { dailyRates: [], totalRate: 0 };

        const budgetComparisonData = budgetComparisonRes.status === 'fulfilled' && budgetComparisonRes.value?.success 
          ? budgetComparisonRes.value.data 
          : { budgets: [], comparisons: [] };

        setProjectData({
          overview: overviewData,
          burnRate: burnRateData,
          budgetComparison: budgetComparisonData
        });
      } catch (err) {
        setError(err.message || 'Failed to fetch project tracking data');
      } finally {
        setLoading(false);
      }
    };

    fetchProjectTrackingData();
  }, [api, caps]);

  const extractedData = useMemo(() => {
    if (!projectData) {
      return {
        overview: {
          projects: [],
          totalCost: 0,
          projectMetrics: {}
        },
        burnRate: {
          dailyRates: [],
          totalRate: 0
        },
        budgetComparison: {
          budgets: [],
          comparisons: []
        },
        metadata: {
          isEmptyState: true
        }
      };
    }

    // Normalize overview data
    const overview = projectData.overview || {};
    const projects = Array.isArray(overview.projects) ? overview.projects : [];
    
    const projectMetrics = projects.reduce((acc, project) => {
      acc[project.name] = {
        name: project.name,
        totalCost: project.totalCost || 0,
        percentage: project.percentage || 0,
        daysActive: project.daysActive || 0,
        avgDailyCost: project.avgDailyCost || 0,
        startDate: project.startDate || null,
        endDate: project.endDate || null
      };
      return acc;
    }, {});

    // Normalize burn rate data
    const burnRate = projectData.burnRate || {};
    const dailyRates = Array.isArray(burnRate.dailyRates) ? burnRate.dailyRates : [];

    // Normalize budget comparison data
    const budgetComparison = projectData.budgetComparison || {};
    const budgets = Array.isArray(budgetComparison.budgets) ? budgetComparison.budgets : [];
    const comparisons = Array.isArray(budgetComparison.comparisons) ? budgetComparison.comparisons : [];

    return {
      overview: {
        projects,
        totalCost: overview.totalCost || 0,
        projectMetrics
      },
      burnRate: {
        dailyRates,
        totalRate: burnRate.totalRate || 0
      },
      budgetComparison: {
        budgets,
        comparisons
      },
      metadata: {
        isEmptyState: projects.length === 0 && 
                     dailyRates.length === 0 &&
                     budgets.length === 0 &&
                     comparisons.length === 0
      }
    };
  }, [projectData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-[#0f0f11] rounded-xl border border-white/5">
        <div className="text-center text-gray-500">
          <FolderOpen className="mx-auto mb-2 text-gray-500" size={32} />
          <p className="text-sm">Loading project tracking...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 bg-[#0f0f11] rounded-xl border border-white/5">
        <div className="text-center text-red-400 p-4">
          <AlertCircle className="mx-auto mb-2" size={32} />
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
          <FolderOpen className="mx-auto mb-2 text-gray-500" size={32} />
          <p className="text-sm">No project tracking data available</p>
          <p className="text-xs text-gray-500 mt-1">Connect to the backend analysis endpoint to view project tracking metrics</p>
        </div>
      </div>
    );
  }

  const COLORS = ['#a02ff1', '#48bb78', '#f56565', '#ecc94b', '#4fd1c5', '#805ad5', '#ed8936', '#68d391', '#4c77b6', '#d53f8c'];

  return (
    <div className="animate-in fade-in zoom-in-95 duration-300 flex flex-col h-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Project Tracking</h1>
        <p className="text-sm text-gray-400">Monitor and track your project costs and burn rates</p>
      </div>
      
      <div className="flex-1 overflow-y-auto relative min-h-0">
        <div className="space-y-6">
          {/* KPI CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-[#1a1b20]/60 backdrop-blur-md border border-white/5 p-5 rounded-2xl shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Total Cost</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    ${extractedData.overview.totalCost?.toFixed(2) || 0}
                  </p>
                </div>
                <div className="p-3 bg-[#a02ff1]/20 rounded-lg">
                  <DollarSign className="text-[#a02ff1]" size={24} />
                </div>
              </div>
              <p className="text-[10px] text-gray-500 mt-2">Overall project spending</p>
            </div>
            
            <div className="bg-[#1a1b20]/60 backdrop-blur-md border border-white/5 p-5 rounded-2xl shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Active Projects</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {extractedData.overview.projects?.length || 0}
                  </p>
                </div>
                <div className="p-3 bg-green-500/20 rounded-lg">
                  <FolderOpen className="text-green-400" size={24} />
                </div>
              </div>
              <p className="text-[10px] text-gray-500 mt-2">Projects being tracked</p>
            </div>
            
            <div className="bg-[#1a1b20]/60 backdrop-blur-md border border-white/5 p-5 rounded-2xl shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Avg Daily Cost</p>
                  <p className="text-lg font-bold text-white mt-1">
                    ${extractedData.overview.projects?.reduce((sum, proj) => sum + (proj.avgDailyCost || 0), 0) / (extractedData.overview.projects?.length || 1) || 0}
                  </p>
                </div>
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <TrendingUp className="text-blue-400" size={24} />
                </div>
              </div>
              <p className="text-[10px] text-gray-500 mt-2">Average daily spending</p>
            </div>
            
            <div className="bg-[#1a1b20]/60 backdrop-blur-md border border-white/5 p-5 rounded-2xl shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Top Project</p>
                  <p className="text-lg font-bold text-white mt-1 truncate max-w-[120px]">
                    {extractedData.overview.projects?.[0]?.name || 'N/A'}
                  </p>
                  <p className="text-sm text-white">
                    ${extractedData.overview.projects?.[0]?.totalCost?.toFixed(2) || 0}
                  </p>
                </div>
                <div className="p-3 bg-purple-500/20 rounded-lg">
                  <BarChartIcon className="text-purple-400" size={24} />
                </div>
              </div>
              <p className="text-[10px] text-gray-500 mt-2">Highest spending project</p>
            </div>
          </div>

          {/* CHARTS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Project Cost Distribution */}
            {/* <div className="bg-[#1a1b20]/60 backdrop-blur-md border border-white/5 rounded-2xl p-5 shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <PieChartIcon size={16} className="text-[#a02ff1]" />
                <h3 className="text-sm font-bold text-white">Project Cost Distribution</h3>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={extractedData.overview.projects.slice(0, 10)}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="totalCost"
                      label={({ name, totalCost }) => `${name}: $${totalCost.toFixed(2)}`}
                    >
                      {extractedData.overview.projects.slice(0, 10).map((entry, index) => (
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
                      formatter={(value) => [`$${value.toFixed(2)}`, 'Cost']}
                      labelStyle={{ fontWeight: 'bold', color: '#d1d5db' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div> */}

            {/* Burn Rate */}
            {/* <div className="bg-[#1a1b20]/60 backdrop-blur-md border border-white/5 rounded-2xl p-5 shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={16} className="text-[#a02ff1]" />
                <h3 className="text-sm font-bold text-white">Daily Burn Rate</h3>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={extractedData.burnRate.dailyRates}>
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
                      tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1a1b20', 
                        borderColor: '#374151',
                        borderRadius: '0.5rem',
                        color: 'white'
                      }}
                      formatter={(value) => [`$${value}`, 'Cost']}
                      labelStyle={{ fontWeight: 'bold', color: '#d1d5db' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="cost" 
                      stroke="#a02ff1" 
                      fill="#a02ff1" 
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div> */}
          </div>

          {/* PROJECT DETAILS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Project List */}
            <div className="bg-[#1a1b20]/60 backdrop-blur-md border border-white/5 rounded-2xl p-5 shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <FolderOpen size={16} className="text-[#a02ff1]" />
                <h3 className="text-sm font-bold text-white">Project Details</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Project</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Cost</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Days Active</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Avg Daily</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {extractedData.overview.projects.slice(0, 10).map((project, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-gray-900/50' : 'bg-gray-800/50'}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-300">{project.name}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">${project.totalCost?.toFixed(2)}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{project.daysActive}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">${project.avgDailyCost?.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Budget Comparison */}
            <div className="bg-[#1a1b20]/60 backdrop-blur-md border border-white/5 rounded-2xl p-5 shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign size={16} className="text-[#a02ff1]" />
                <h3 className="text-sm font-bold text-white">Budget Comparison</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Budget</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actual</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Budgeted</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Variance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {extractedData.budgetComparison.comparisons.slice(0, 10).map((comparison, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-gray-900/50' : 'bg-gray-800/50'}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-300">{comparison.name || 'N/A'}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">${comparison.actual?.toFixed(2) || '0.00'}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">${comparison.budgeted?.toFixed(2) || '0.00'}</td>
                        <td className={`px-4 py-3 whitespace-nowrap text-sm font-medium ${
                          comparison.variance > 0 ? 'text-red-400' : 'text-green-400'
                        }`}>
                          {comparison.variance > 0 ? '+' : ''}
                          ${comparison.variance?.toFixed(2) || '0.00'}
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

export default ClientCProjectTracking;