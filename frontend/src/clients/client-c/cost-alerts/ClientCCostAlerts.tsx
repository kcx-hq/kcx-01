// ClientCCostAlerts.jsx
import React, { useState, useEffect, useMemo } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import { 
  AlertTriangle, 
  Bell, 
  TrendingUp, 
  BarChartIcon, 
  PieChart as PieChartIcon,
  DollarSign,
  AlertCircle,
  Loader2,
  Calendar
} from "lucide-react";
import type {
  AlertItem,
  AlertsEndpointData,
  ApiLikeError,
  BudgetItem,
  BudgetStatusEndpointData,
  ClientCCostAlertsProps,
  CostAlertsApiData,
  CostAlertsExtractedData,
} from "./types";

const ClientCCostAlerts = ({ api, caps }: ClientCCostAlertsProps) => {
  const [alertsData, setAlertsData] = useState<CostAlertsApiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCostAlertsData = async () => {
      if (!api || !caps?.modules?.["costAlerts"]) {
        setError('Cost alerts module not available');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch all cost alerts endpoints
        const [alertsRes, budgetStatusRes] = await Promise.allSettled([
          api.call<AlertsEndpointData | AlertItem[]>('costAlerts', 'alerts'),
          api.call<BudgetStatusEndpointData | BudgetItem[]>('costAlerts', 'budgetStatus')
        ]);

        console.log('Alerts Response Status:', alertsRes.status);
        if (alertsRes.status === "fulfilled") {
          console.log('Alerts Response Value:', alertsRes.value);
        }
        console.log('Budget Status Response Status:', budgetStatusRes.status);
        if (budgetStatusRes.status === "fulfilled") {
          console.log('Budget Status Response Value:', budgetStatusRes.value);
        }

        // Extract data from responses
        let alertsRaw: AlertsEndpointData | AlertItem[] = { alerts: [], summary: {} };
        let budgetStatusRaw: BudgetStatusEndpointData | BudgetItem[] = { budgets: [], status: {} };

        if (alertsRes.status === 'fulfilled' && alertsRes.value) {
          alertsRaw = alertsRes.value;
          console.log('Raw alerts data:', alertsRaw);
        } else {
          console.log('Using default alerts data due to failed response');
        }

        if (budgetStatusRes.status === 'fulfilled' && budgetStatusRes.value) {
          budgetStatusRaw = budgetStatusRes.value;
          console.log('Raw budget status data:', budgetStatusRaw);
        } else {
          console.log('Using default budget status data due to failed response');
        }

        const normalizedAlertsData: AlertsEndpointData = Array.isArray(alertsRaw)
          ? { alerts: alertsRaw, summary: {} }
          : {
              ...alertsRaw,
              alerts: Array.isArray(alertsRaw.alerts) ? alertsRaw.alerts : [],
              summary: alertsRaw.summary || {},
            };

        const normalizedBudgetStatusData: BudgetStatusEndpointData = Array.isArray(budgetStatusRaw)
          ? { budgets: budgetStatusRaw, status: {} }
          : {
              ...budgetStatusRaw,
              budgets: Array.isArray(budgetStatusRaw.budgets) ? budgetStatusRaw.budgets : [],
              status: budgetStatusRaw.status || {},
            };

        console.log('Final processed alerts data:', normalizedAlertsData);
        console.log('Final processed budget status data:', normalizedBudgetStatusData);

        setAlertsData({
          alerts: normalizedAlertsData,
          budgetStatus: normalizedBudgetStatusData
        });
      } catch (err: unknown) {
        const typedErr = err as ApiLikeError;
        console.error('Error fetching cost alerts data:', err);
        setError(typedErr.message || 'Failed to fetch cost alerts data');
      } finally {
        setLoading(false);
      }
    };

    fetchCostAlertsData();
  }, [api, caps]);

  const extractedData = useMemo<CostAlertsExtractedData>(() => {
    if (!alertsData) {
      return {
        alerts: {
          alerts: [],
          summary: {},
          alertMetrics: {}
        },
        budgetStatus: {
          budgets: [],
          status: {},
          budgetMetrics: {}
        },
        metadata: {
          isEmptyState: true
        }
      };
    }

    // Log the raw data for debugging
    console.log('Processing alertsData:', alertsData);

    // Normalize alerts data
    const alerts = alertsData.alerts || {};
    // Handle case where alertsData.alerts might be an array directly
    const alertsList: AlertItem[] = Array.isArray(alertsData.alerts) ? alertsData.alerts : 
                      (typeof alerts === "object" && alerts !== null && Array.isArray((alerts as AlertsEndpointData).alerts)) ? (alerts as AlertsEndpointData).alerts || [] : 
                      Array.isArray(alerts) ? alerts : [];
    
    console.log('Normalized alerts list:', alertsList);
    
    const alertMetrics = alertsList.reduce<Record<string, {
      name: string;
      severity: string;
      status: string;
      costImpact: number;
      triggeredDate: string | null;
      ruleName: string;
    }>>((acc, alert, index) => {
      const key = String(alert.id ?? index);
      acc[key] = {
        name: alert.name || 'Alert',
        severity: alert.severity || 'medium',
        status: alert.status || 'open',
        costImpact: alert.costImpact || 0,
        triggeredDate: alert.triggeredDate || null,
        ruleName: alert.ruleName || 'Unknown Rule'
      };
      return acc;
    }, {});

    // Normalize budget status data
    const budgetStatus = alertsData.budgetStatus || {};
    // Handle case where budgetStatus might be an array directly
    const budgets: BudgetItem[] = Array.isArray(alertsData.budgetStatus) ? alertsData.budgetStatus :
                   (typeof budgetStatus === "object" && budgetStatus !== null && Array.isArray((budgetStatus as BudgetStatusEndpointData).budgets))
                     ? (budgetStatus as BudgetStatusEndpointData).budgets || []
                     :
                   Array.isArray(budgetStatus) ? budgetStatus : [];
    
    console.log('Normalized budgets list:', budgets);

    const status =
      typeof budgetStatus === "object" && budgetStatus !== null && "status" in budgetStatus
        ? ((budgetStatus as BudgetStatusEndpointData).status || {})
        : {};

    const budgetMetrics = budgets.reduce<Record<string, {
      name: string;
      currentSpent: number;
      budgetAmount: number;
      percentageUsed: number;
      status: string;
    }>>((acc, budget, index) => {
      const key = String(budget.id ?? index);
      acc[key] = {
        name: budget.name || 'Budget',
        currentSpent: budget.currentSpent || 0,
        budgetAmount: budget.budgetAmount || 0,
        percentageUsed: (budget.budgetAmount || 0) > 0 ? ((budget.currentSpent || 0) / (budget.budgetAmount || 0)) * 100 : 0,
        status: budget.status || 'active'
      };
      return acc;
    }, {});

    // Check if we have actual data
    const hasAlerts = alertsList.length > 0;
    const hasBudgets = budgets.length > 0;
    console.log('Has alerts:', hasAlerts, 'Has budgets:', hasBudgets);

    return {
      alerts: {
        alerts: alertsList,
        summary:
          typeof alerts === "object" && alerts !== null && "summary" in alerts
            ? ((alerts as AlertsEndpointData).summary || {})
            : {},
        alertMetrics
      },
      budgetStatus: {
        budgets,
        status,
        budgetMetrics
      },
      metadata: {
        isEmptyState: !hasAlerts && !hasBudgets
      }
    };
  }, [alertsData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-[#0f0f11] rounded-xl border border-white/5">
        <div className="text-center text-gray-500">
          <Bell className="mx-auto mb-2 text-gray-500" size={32} />
          <p className="text-sm">Loading cost alerts...</p>
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
          <Bell className="mx-auto mb-2 text-gray-500" size={32} />
          <p className="text-sm">No cost alerts available</p>
          <p className="text-xs text-gray-500 mt-1">Connect to the backend analysis endpoint to view cost alerts</p>
        </div>
      </div>
    );
  }

  // Log the final extracted data for debugging
  console.log('Final extracted data:', extractedData);

  const COLORS = ['#007758', '#48bb78', '#f56565', '#ecc94b', '#4fd1c5', '#059669', '#ed8936', '#68d391', '#4c77b6', '#d53f8c'];

  return (
    <div className="animate-in fade-in zoom-in-95 duration-300 flex flex-col h-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Cost Alerts</h1>
        <p className="text-sm text-gray-400">Monitor and manage your cost alerts and budget status</p>
      </div>
      
      <div className="flex-1 overflow-y-auto relative min-h-0">
        <div className="space-y-6">
          {/* KPI CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-[#1a1b20]/60 backdrop-blur-md border border-white/5 p-5 rounded-2xl shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Total Alerts</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {extractedData.alerts.alerts?.length || 0}
                  </p>
                </div>
                <div className="p-3 bg-[#007758]/20 rounded-lg">
                  <Bell className="text-[#007758]" size={24} />
                </div>
              </div>
              <p className="text-[10px] text-gray-500 mt-2">Active cost alerts</p>
            </div>
            
            <div className="bg-[#1a1b20]/60 backdrop-blur-md border border-white/5 p-5 rounded-2xl shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Critical</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {extractedData.alerts.alerts?.filter((alert: AlertItem) => alert.severity === 'critical')?.length || 0}
                  </p>
                </div>
                <div className="p-3 bg-red-500/20 rounded-lg">
                  <AlertTriangle className="text-red-400" size={24} />
                </div>
              </div>
              <p className="text-[10px] text-gray-500 mt-2">Critical severity alerts</p>
            </div>
            
            <div className="bg-[#1a1b20]/60 backdrop-blur-md border border-white/5 p-5 rounded-2xl shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Budgets</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {extractedData.budgetStatus.budgets?.length || 0}
                  </p>
                </div>
                <div className="p-3 bg-green-500/20 rounded-lg">
                  <DollarSign className="text-green-400" size={24} />
                </div>
              </div>
              <p className="text-[10px] text-gray-500 mt-2">Active budgets</p>
            </div>
            
            <div className="bg-[#1a1b20]/60 backdrop-blur-md border border-white/5 p-5 rounded-2xl shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Over Budget</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {extractedData.budgetStatus.budgets?.filter((budget: BudgetItem) => (budget.percentageUsed || 0) > 100)?.length || 0}
                  </p>
                </div>
                <div className="p-3 bg-orange-500/20 rounded-lg">
                  <TrendingUp className="text-orange-400" size={24} />
                </div>
              </div>
              <p className="text-[10px] text-gray-500 mt-2">Budgets exceeded</p>
            </div>
          </div>

          {/* CHARTS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Alert Distribution */}
            <div className="bg-[#1a1b20]/60 backdrop-blur-md border border-white/5 rounded-2xl p-5 shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <PieChartIcon size={16} className="text-[#007758]" />
                <h3 className="text-sm font-bold text-white">Alert Distribution by Severity</h3>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={extractedData.alerts.alerts.reduce<Array<{ name: string; value: number }>>((acc, alert) => {
                        const existing = acc.find((item) => item.name === alert.severity);
                        if (existing) {
                          existing.value++;
                        } else {
                          acc.push({ name: alert.severity || "unknown", value: 1 });
                        }
                        return acc;
                      }, [])}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }: { name?: string; value?: number }) => `${name}: ${value}`}
                    >
                      {extractedData.alerts.alerts.reduce<Array<{ name: string; value: number }>>((acc, alert) => {
                        const existing = acc.find((item) => item.name === alert.severity);
                        if (existing) {
                          existing.value++;
                        } else {
                          acc.push({ name: alert.severity || "unknown", value: 1 });
                        }
                        return acc;
                      }, []).map((entry, index: number) => (
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
                      formatter={(value: number | string) => [value, 'Count']}
                      labelStyle={{ fontWeight: 'bold', color: '#d1d5db' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Budget Status */}
            <div className="bg-[#1a1b20]/60 backdrop-blur-md border border-white/5 rounded-2xl p-5 shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign size={16} className="text-[#007758]" />
                <h3 className="text-sm font-bold text-white">Budget Status</h3>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={extractedData.budgetStatus.budgets.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      stroke="#9ca3af" 
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis 
                      stroke="#9ca3af" 
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value: number | string) => `${value}%`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1a1b20', 
                        borderColor: '#374151',
                        borderRadius: '0.5rem',
                        color: 'white'
                      }}
                      formatter={(value: number | string) => [`${value}%`, 'Percentage']}
                      labelStyle={{ fontWeight: 'bold', color: '#d1d5db' }}
                    />
                    <Bar 
                      dataKey={(budget: BudgetItem) => Math.min(budget.percentageUsed || 0, 100)} 
                      name="Used" 
                      fill="#007758" 
                      stackId="a" 
                    />
                    <Bar 
                      dataKey={(budget: BudgetItem) => Math.max(0, (budget.percentageUsed || 0) - 100)} 
                      name="Over" 
                      fill="#f56565" 
                      stackId="a" 
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* ALERTS AND BUDGET DETAILS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Alerts */}
            <div className="bg-[#1a1b20]/60 backdrop-blur-md border border-white/5 rounded-2xl p-5 shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle size={16} className="text-[#007758]" />
                <h3 className="text-sm font-bold text-white">Recent Alerts</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Rule Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Severity</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Cost Impact</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {extractedData.alerts.alerts.slice(0, 10).map((alert: AlertItem, index: number) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-gray-900/50' : 'bg-gray-800/50'}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-300">{alert.ruleName || 'N/A'}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            alert.severity === 'critical' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 
                            alert.severity === 'high' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                            alert.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 'bg-green-500/20 text-green-400 border border-green-500/30'
                          }`}>
                            {alert.severity}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            alert.status === 'open' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 
                            alert.status === 'acknowledged' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 'bg-green-500/20 text-green-400 border border-green-500/30'
                          }`}>
                            {alert.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">${alert.costImpact?.toFixed(2) || '0.00'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Budget Details */}
            <div className="bg-[#1a1b20]/60 backdrop-blur-md border border-white/5 rounded-2xl p-5 shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign size={16} className="text-[#007758]" />
                <h3 className="text-sm font-bold text-white">Budget Details</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Budget Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Current Spent</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Budget Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {extractedData.budgetStatus.budgets.slice(0, 10).map((budget: BudgetItem, index: number) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-gray-900/50' : 'bg-gray-800/50'}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-300">{budget.name || 'N/A'}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">${budget.currentSpent?.toFixed(2) || '0.00'}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">${budget.budgetAmount?.toFixed(2) || '0.00'}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            (budget.percentageUsed || 0) > 100 ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 
                            (budget.percentageUsed || 0) > 90 ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                            (budget.percentageUsed || 0) > 75 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 'bg-green-500/20 text-green-400 border border-green-500/30'
                          }`}>
                            {(budget.percentageUsed || 0) > 100 ? 'Over Budget' : 
                             (budget.percentageUsed || 0) > 90 ? 'Near Limit' :
                             (budget.percentageUsed || 0) > 75 ? 'Warning' : 'Good'}
                          </span>
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

export default ClientCCostAlerts;
