import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../common/widgets';
import type {
  ApiLikeError,
  ProjectBudgetComparisonRow,
  ProjectOverviewWidget,
  ProjectTrackingProps,
} from './types';

const ProjectTracking = ({ filters, api, caps, uploadId }: ProjectTrackingProps) => {
  const [overviewData, setOverviewData] = useState<ProjectOverviewWidget>({});
  const [budgetComparisonData, setBudgetComparisonData] = useState<ProjectBudgetComparisonRow[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (api && caps?.modules?.['projectTracking']?.endpoints?.['overview']) {
          const overviewResponse = await api.call<{ overview?: ProjectOverviewWidget }>('projectTracking', 'overview', {
            params: {
              provider: filters.provider !== 'All' ? filters.provider : undefined,
              service: filters.service !== 'All' ? filters.service : undefined,
              region: filters.region !== 'All' ? filters.region : undefined,
              uploadId: uploadId
            }
          });

          setOverviewData(overviewResponse?.overview || {});
        }

        if (api && caps?.modules?.['projectTracking']?.endpoints?.['budgetComparison']) {
          const budgetComparisonResponse = await api.call<{ budgetComparison?: ProjectBudgetComparisonRow[] }>('projectTracking', 'budgetComparison', {
            params: {
              provider: filters.provider !== 'All' ? filters.provider : undefined,
              service: filters.service !== 'All' ? filters.service : undefined,
              region: filters.region !== 'All' ? filters.region : undefined,
            }
          });

          setBudgetComparisonData(budgetComparisonResponse?.budgetComparison || []);
        }
      } catch (error: unknown) {
        const apiError = error as ApiLikeError;
        console.error('Error fetching project tracking data:', error);
        if (apiError.message) {
          console.error(apiError.message);
        }
      }
    };

    // Only fetch if API and capabilities are available
    if (api && caps) {
      fetchData();
    }
  }, [filters, api, caps, uploadId]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Active Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overviewData.activeProjects || 0}</div>
            <p className="text-xs text-gray-400">Currently active projects</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${overviewData.totalBudget?.toLocaleString() || 0}</div>
            <p className="text-xs text-gray-400">Combined project budgets</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Spent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${overviewData.totalSpent?.toLocaleString() || 0}</div>
            <p className="text-xs text-gray-400">Total amount spent</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Avg Burn Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${overviewData.avgBurnRate?.toLocaleString() || 0}/day</div>
            <p className="text-xs text-gray-400">Average daily spend</p>
          </CardContent>
        </Card>
      </div>

      <Card>
       
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Project</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Budget</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Spent</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Remaining</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {budgetComparisonData.map((project: ProjectBudgetComparisonRow, index: number) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-gray-900' : 'bg-gray-800'}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-300">{project.project}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">${project.budget?.toLocaleString()}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">${project.actual?.toLocaleString()}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">${project.remaining?.toLocaleString()}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        (project.remaining ?? 0) >= (project.budget ?? 0) * 0.2 ? 'bg-green-800 text-green-100' : 
                        (project.remaining ?? 0) >= (project.budget ?? 0) * 0.1 ? 'bg-yellow-800 text-yellow-100' : 'bg-red-800 text-red-100'
                      }`}>
                        {(project.remaining ?? 0) >= (project.budget ?? 0) * 0.2 ? 'Good' : 
                         (project.remaining ?? 0) >= (project.budget ?? 0) * 0.1 ? 'Warning' : 'Critical'}
                      </span>
                    </td>
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

export default ProjectTracking;
