import React from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area, Legend
} from 'recharts';
import { 
  AlertTriangle, 
  ShieldCheck, 
  FileText, 
  TrendingUp, 
  AlertCircle
} from "lucide-react";

const ClientCDataQualityView = ({
  api,
  caps,
  loading,
  qualityData,
  extractedData,
  isEmptyState,
  dataError
}) => {
  const COLORS = ['#a02ff1', '#48bb78', '#f56565', '#ecc94b', '#4fd1c5', '#805ad5'];

  // Early return for loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-[#0f0f11] rounded-xl border border-white/5">
        <div className="text-center text-gray-500">
          <FileText className="mx-auto mb-2 text-gray-500" size={32} />
          <p className="text-sm">Loading data quality analysis...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (dataError && !qualityData) {
    return (
      <div className="flex items-center justify-center h-64 bg-[#0f0f11] rounded-xl border border-white/5">
        <div className="text-center text-red-400">
          <AlertCircle className="mx-auto mb-2 text-red-500" size={32} />
          <p className="text-sm font-medium mb-1">Error Loading Data</p>
          <p className="text-xs text-gray-500 max-w-md mb-3">
            {dataError || 'Failed to load data quality data'}
          </p>
        </div>
      </div>
    );
  }

  // Show empty state
  if (!qualityData) {
    return (
      <div className="flex items-center justify-center h-64 bg-[#0f0f11] rounded-xl border border-white/5">
        <div className="text-center text-gray-500">
          <FileText className="mx-auto mb-2 text-gray-500" size={32} />
          <p className="text-sm">No data quality analysis available</p>
          <p className="text-xs text-gray-500 mt-1">Connect to the backend analysis endpoint to view data quality metrics</p>
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
            <div className="bg-[#1a1b20]/60 backdrop-blur-md border border-white/5 p-5 rounded-2xl shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Overall Quality</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {(extractedData.qualityMetrics.overallScore || 0).toFixed(2)}%
                  </p>
                </div>
                <div className="p-3 bg-[#a02ff1]/20 rounded-lg">
                  <ShieldCheck className="text-[#a02ff1]" size={24} />
                </div>
              </div>
              <p className="text-[10px] text-gray-500 mt-2">Data quality score</p>
            </div>
            
            <div className="bg-[#1a1b20]/60 backdrop-blur-md border border-white/5 p-5 rounded-2xl shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Total Issues</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {extractedData.qualityIssues?.length || 0}
                  </p>
                </div>
                <div className="p-3 bg-red-500/20 rounded-lg">
                  <AlertTriangle className="text-red-400" size={24} />
                </div>
              </div>
              <p className="text-[10px] text-gray-500 mt-2">Quality issues identified</p>
            </div>
            
            <div className="bg-[#1a1b20]/60 backdrop-blur-md border border-white/5 p-5 rounded-2xl shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Compliance</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {(extractedData.qualityMetrics.complianceRate || 0).toFixed(2)}%
                  </p>
                </div>
                <div className="p-3 bg-green-500/20 rounded-lg">
                  <TrendingUp className="text-green-400" size={24} />
                </div>
              </div>
              <p className="text-[10px] text-gray-500 mt-2">Tag compliance rate</p>
            </div>
            
            <div className="bg-[#1a1b20]/60 backdrop-blur-md border border-white/5 p-5 rounded-2xl shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Accuracy</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {(() => {
                      // Calculate accuracy from untagged resources
                      const totalResources = extractedData.qualityMetrics?.allCount || 0;
                      const untaggedCount = extractedData.qualityMetrics?.untaggedCount || 0;
                      const accuracyRate = totalResources > 0 ? 
                        ((totalResources - untaggedCount) / totalResources * 100) : 100;
                      return accuracyRate.toFixed(2) + '%';
                    })()}
                  </p>
                </div>
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <FileText className="text-blue-400" size={24} />
                </div>
              </div>
              <p className="text-[10px] text-gray-500 mt-2">Data tagging accuracy</p>
            </div>
          </div>

          {/* CHARTS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quality Metrics Chart */}
            <div className="bg-[#1a1b20]/60 backdrop-blur-md border border-white/5 rounded-2xl p-5 shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <BarChart size={16} className="text-[#a02ff1]" />
                <h3 className="text-sm font-bold text-white">Quality Metrics</h3>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={extractedData.qualityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" vertical={false} />
                    <XAxis 
                      dataKey="metric" 
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
                      tickFormatter={(value) => `${value}%`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1a1b20', 
                        borderColor: '#374151',
                        borderRadius: '0.5rem',
                        color: 'white'
                      }}
                      formatter={(value) => [`${value}%`, 'Score']}
                      labelStyle={{ fontWeight: 'bold', color: '#d1d5db' }}
                    />
                    <Bar 
                      dataKey="score" 
                      fill="#a02ff1" 
                      radius={[4, 4, 0, 0]}
                      barSize={20}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Issue Distribution Chart */}
            <div className="bg-[#1a1b20]/60 backdrop-blur-md border border-white/5 rounded-2xl p-5 shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <FileText size={16} className="text-[#a02ff1]" />
                <h3 className="text-sm font-bold text-white">Issue Distribution</h3>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={extractedData.qualityIssues}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      innerRadius={40}
                      fill="#8884d8"
                      dataKey="count"
                      label={false} // Remove static labels to prevent overlap
                    >
                      {extractedData.qualityIssues.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(26, 27, 32, 0.95)', 
                        borderColor: '#a02ff1',
                        borderWidth: '2px',
                        borderRadius: '0.5rem',
                        color: 'white',
                        padding: '12px',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                        backdropFilter: 'blur(10px)',
                        maxWidth: '300px'
                      }}
                      wrapperStyle={{ outline: 'none' }}
                      isAnimationActive={false}
                      formatter={(value, name, props) => {
                        try {
                          const total = extractedData.qualityIssues?.reduce((sum, issue) => sum + issue.count, 0) || 0;
                          const percentage = total > 0 ? ((value / total) * 100).toFixed(2) : 0;
                          
                          // Enhanced tooltip content with better formatting
                          let displayValue = `${value} issues`;
                          if (props.payload?.category === 'financial-risk') {
                            displayValue = `$${(value / 100).toFixed(2)}`;
                          } else if (props.payload?.category === 'cost-optimization' && props.payload?.payload?.cost) {
                            displayValue = `${value} resources ($${props.payload.payload.cost.toFixed(2)})`;
                          }
                          
                          // Return formatted strings (Recharts expects strings, not JSX)
                          return [displayValue, props.payload?.type || name];
                        } catch (error) {
                          console.error('Tooltip formatter error:', error);
                          return [value, name];
                        }
                      }}
                      labelFormatter={(label) => {
                        try {
                          const total = extractedData.qualityIssues.reduce((sum, issue) => sum + issue.count, 0);
                          const currentItem = extractedData.qualityIssues.find(issue => issue.type === label);
                          const percentage = total > 0 && currentItem ? ((currentItem.count / total) * 100).toFixed(1) : 0;
                          const severityColor = {
                            'high': '#f87171',
                            'medium': '#fbbf24',
                            'low': '#34d399'
                          }[currentItem?.severity] || '#9ca3af';
                          
                          // Create a formatted string instead of JSX to prevent breaking
                          return `${label}
Severity: ${currentItem?.severity?.toUpperCase() || 'UNKNOWN'}
Percentage: ${percentage}% of total issues`;
                        } catch (error) {
                          console.error('Tooltip label formatter error:', error);
                          return label;
                        }
                      }}
                      itemSorter={(item) => -item.value}
                    />
                    <Legend 
                      layout="vertical" 
                      verticalAlign="middle" 
                      align="right"
                      content={(props) => {
                        const { payload } = props;
                        // Create shortened legend labels
                        const shortLabels = {
                          'Missing application Tag': 'App Tag',
                          'Missing environment Tag': 'Env Tag',
                          'Missing business_unit Tag': 'BU Tag',
                          'Missing CostAllocationTest Tag': 'CAT Tag',
                          'Missing env Tag': 'Env2 Tag',
                          'Untagged Resources': 'Untagged',
                          'Data Anomalies': 'Anomalies',
                          'Amazon Elastic Compute Cloud': 'EC2',
                          'Amazon Virtual Private Cloud': 'VPC',
                          'Amazon Relational Database Service': 'RDS',
                          'Elastic Load Balancing': 'ELB',
                          'AmazonCloudWatch': 'CloudWatch',
                          'Financial Risk': 'Risk',
                          'Untagged Department': 'Dept'
                        };
                        
                        return (
                          <div className="text-xs text-gray-300 ml-4 max-w-[120px]">
                            {payload?.slice(0, 8).map((entry, index) => {
                              const originalLabel = entry.payload?.type || entry.value;
                              const shortLabel = shortLabels[originalLabel] || originalLabel.split(' ')[0] || originalLabel;
                              return (
                                <div key={`legend-${index}`} className="flex items-center mb-1">
                                  <div 
                                    className="w-3 h-3 rounded-full mr-2 flex-shrink-0" 
                                    style={{ backgroundColor: entry.color }}
                                  ></div>
                                  <span className="truncate" title={originalLabel}>{shortLabel}</span>
                                </div>
                              );
                            })}
                            {payload?.length > 8 && (
                              <div className="text-[10px] text-gray-500 mt-2">+{payload.length - 8} more</div>
                            )}
                          </div>
                        );
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Quality Issues Table */}
          <div className="bg-[#1a1b20]/60 backdrop-blur-md border border-white/5 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={16} className="text-[#a02ff1]" />
              <h3 className="text-sm font-bold text-white">Quality Issues</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Issue Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Impact</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Severity</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {extractedData.qualityIssues.map((issue, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-gray-900/50' : 'bg-gray-800/50'}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-300">{issue.type}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                        {issue.category === 'financial-risk' ? 
                          `$${(issue.count / 100).toFixed(2)}` : 
                          `${issue.count} resources`
                        }
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          issue.severity === 'high' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 
                          issue.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 'bg-green-500/20 text-green-400 border border-green-500/30'
                        }`}>
                          {issue.severity}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300">{issue.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientCDataQualityView;