import React, { useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Server, Activity, Ghost, Tag, TrendingUp, Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

import { Card, CardContent, CardHeader, CardTitle } from '../common/widgets';
import type {
  CountDatum,
  ResourceInventoryItem,
  ResourceInventoryStats,
  ResourceInventoryViewProps,
} from './types';

const ResourceInventoryView = ({
  onReset,
  loading,
  isFiltering,
  extractedData,
  isEmptyState,
  error
}: ResourceInventoryViewProps) => {
  // Safe destructuring with defaults to prevent crashes
  const {
    inventory = [],
    stats = {}
  }: { inventory: ResourceInventoryItem[]; stats: ResourceInventoryStats } = extractedData || { inventory: [], stats: {} };

  // Prepare bar chart data for resource status
  const resourceStatusData = useMemo<CountDatum[]>(() => {
    const statusCounts: Record<string, number> = {
      Active: inventory.filter((r: ResourceInventoryItem) => r.status === 'Active').length,
      Zombie: inventory.filter((r: ResourceInventoryItem) => r.status === 'Zombie').length,
      Spiking: inventory.filter((r: ResourceInventoryItem) => r.status === 'Spiking').length,
      New: inventory.filter((r: ResourceInventoryItem) => r.status === 'New').length
    };
    
    return Object.entries(statusCounts).map(([name, value]: [string, number]) => ({
      name,
      value
    }));
  }, [inventory]);

  // Prepare department data
  const departmentData = useMemo<CountDatum[]>(() => {
    const deptCounts: Record<string, number> = {};
    inventory.forEach((resource: ResourceInventoryItem) => {
      const dept = resource.department || 'Unassigned';
      deptCounts[dept] = (deptCounts[dept] || 0) + 1;
    });
    
    return Object.entries(deptCounts).map(([name, value]: [string, number]) => ({
      name,
      value
    }));
  }, [inventory]);

  // Render loading state
  if (loading || isFiltering) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2 text-white">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading resource inventory data...</span>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6">
        <div className="flex items-center space-x-2 text-red-400">
          <AlertCircle className="w-5 h-5" />
          <h3 className="font-medium">Error Loading Resources</h3>
        </div>
        <p className="text-red-300 mt-2 text-sm">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  // Render empty state
  if (isEmptyState) {
    return (
      <div className="text-center py-12">
        <Activity className="w-16 h-16 mx-auto text-gray-600 mb-4" />
        <h3 className="text-xl font-medium text-gray-300 mb-2">No Resources Found</h3>
        <p className="text-gray-500 max-w-md mx-auto">
          No resources detected in the selected period. Try adjusting your filters or selecting a different time range.
        </p>
        <button 
          onClick={onReset}
          className="mt-6 px-6 py-2 bg-[#23a282] hover:bg-[#8b2bd4] text-white rounded-lg transition-colors"
        >
          Reset Filters
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      

      {/* KPI Cards */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total Resources</CardTitle>
            <Server className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {stats.total || inventory.length}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Active resources in inventory
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Zombie Assets</CardTitle>
            <Ghost className="w-4 h-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-400">
              {stats.zombieCount || 0}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Unused resources with cost
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Untagged</CardTitle>
            <Tag className="w-4 h-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">
              {stats.untaggedCount || 0}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Non-compliant resources
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Spiking</CardTitle>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-400">
              {stats.spikingCount || 0}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Resources with rapid growth
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Resource Type Distribution */}
        <div className="lg:col-span-1">
          {/* Department Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Department Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={departmentData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    <XAxis dataKey="name" stroke="#aaa" />
                    <YAxis stroke="#aaa" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1a1b20', 
                        borderColor: '#333', 
                        color: 'white',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="value" fill="#ec4899" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Status and Department Charts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Resource Status */}
          <Card>
            <CardHeader>
              <CardTitle>Resource Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={resourceStatusData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    <XAxis dataKey="name" stroke="#aaa" />
                    <YAxis stroke="#aaa" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1a1b20', 
                        borderColor: '#333', 
                        color: 'white',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="value" fill="#23a282" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>


        </div>
      </div>

      {/* Resource Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle>Resource Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Resource ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Region</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Department</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {inventory.map((resource: ResourceInventoryItem, index: number) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-gray-900' : 'bg-gray-800'}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-300 max-w-xs truncate" title={resource.id}>{resource.id}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{resource.service}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        resource.status === 'Active' ? 'bg-green-800 text-green-100' : 
                        resource.status === 'Zombie' ? 'bg-orange-800 text-orange-100' :
                        resource.status === 'Spiking' ? 'bg-emerald-800 text-emerald-100' :
                        resource.status === 'New' ? 'bg-blue-800 text-blue-100' : 'bg-gray-800 text-gray-100'
                      }`}>
                        {resource.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{resource.region}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{resource.department || 'Unassigned'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">${resource.totalCost?.toFixed(2) || '0.00'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResourceInventoryView;
