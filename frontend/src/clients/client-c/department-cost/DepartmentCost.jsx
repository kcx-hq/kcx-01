import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../common/widgets';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const DepartmentCost = ({ filters, api, caps, uploadId }) => {
  const [overviewData, setOverviewData] = useState({});
  const [trendData, setTrendData] = useState([]);
  const [drilldownData, setDrilldownData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (api && caps.modules?.departmentCost?.endpoints?.overview) {
          const overviewResponse = await api.call('departmentCost', 'overview', {
            params: {
              provider: filters.provider !== 'All' ? filters.provider : undefined,
              service: filters.service !== 'All' ? filters.service : undefined,
              region: filters.region !== 'All' ? filters.region : undefined,
              uploadId: uploadId
            }
          });
          
          if (overviewResponse?.success) {
            setOverviewData(overviewResponse.data.overview || {});
          }
        }

        if (api && caps.modules?.departmentCost?.endpoints?.trend) {
          const trendResponse = await api.call('departmentCost', 'trend', {
            params: {
              provider: filters.provider !== 'All' ? filters.provider : undefined,
              service: filters.service !== 'All' ? filters.service : undefined,
              region: filters.region !== 'All' ? filters.region : undefined,
              uploadId: uploadId
            }
          });
          
          if (trendResponse?.success) {
            setTrendData(trendResponse.data.trend || []);
          }
        }

        if (api && caps.modules?.departmentCost?.endpoints?.drilldown) {
          const drilldownResponse = await api.call('departmentCost', 'drilldown', {
            params: {
              provider: filters.provider !== 'All' ? filters.provider : undefined,
              service: filters.service !== 'All' ? filters.service : undefined,
              region: filters.region !== 'All' ? filters.region : undefined,
              uploadId: uploadId
            }
          });
          
          if (drilldownResponse?.success) {
            setDrilldownData(drilldownResponse.data.drilldown || []);
          }
        }
      } catch (error) {
        console.error('Error fetching department cost data:', error);
      }
    };

    // Only fetch if API and capabilities are available
    if (api && caps) {
      fetchData();
    }
  }, [filters, api, caps, uploadId]);

  const COLORS = ['#a02ff1', '#48bb78', '#f56565', '#ecc94b', '#4fd1c5', '#805ad5'];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total Department Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${overviewData.totalCost?.toLocaleString() || 0}</div>
            <p className="text-xs text-gray-400">Current period</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Departments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overviewData.departmentCount || 0}</div>
            <p className="text-xs text-gray-400">Active departments</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Avg Department Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${Math.round((overviewData.totalCost || 0) / (overviewData.departmentCount || 1)).toLocaleString()}</div>
            <p className="text-xs text-gray-400">Average per department</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Top Department</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overviewData.topDepartment || 'N/A'}</div>
            <p className="text-xs text-gray-400">Highest spending dept</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Department Cost Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="date" stroke="#aaa" />
                <YAxis stroke="#aaa" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1b20', borderColor: '#333', color: 'white' }}
                  itemStyle={{ color: 'white' }}
                  formatter={(value) => [`$${value.toLocaleString()}`, 'Cost']}
                />
                <Legend />
                <Line type="monotone" dataKey="totalCost" stroke="#a02ff1" strokeWidth={2} dot={{ r: 4 }} name="Total Cost" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Department Cost Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={drilldownData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="cost"
                >
                  {drilldownData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Cost']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Department Cost Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={drilldownData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis dataKey="name" stroke="#aaa" />
              <YAxis stroke="#aaa" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1a1b20', borderColor: '#333', color: 'white' }}
                itemStyle={{ color: 'white' }}
                formatter={(value) => [`$${value.toLocaleString()}`, 'Cost']}
              />
              <Legend />
              <Bar dataKey="cost" fill="#a02ff1" name="Cost" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default DepartmentCost;