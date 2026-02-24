import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../common/widgets';

const DataExplorer = ({ filters = {}, api, caps, uploadId }) => {
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const renderCellValue = (value) => {
    if (value === null || value === undefined) return '-';

    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }

    if (Array.isArray(value)) {
      return value.map(String).join(', ');
    }

    if (typeof value === 'object') {
      try {
        return Object.entries(value)
          .map(([key, val]) => `${key}: ${val}`)
          .join(' | ');
      } catch (error) {
        return '[Object]';
      }
    }

    return String(value);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!api || !caps?.modules?.dataExplorer?.enabled) return;

        const response = await api.call('dataExplorer', 'dataExplorer', {
          params: {
            page,
            limit: 50,
            provider:
              filters?.provider && filters.provider !== 'All'
                ? filters.provider
                : undefined,
            service:
              filters?.service && filters.service !== 'All'
                ? filters.service
                : undefined,
            region:
              filters?.region && filters.region !== 'All'
                ? filters.region
                : undefined,
            uploadId
          }
        });

        if (response?.success) {
          setData(response.data.data || response.data.records || []);
          setColumns(response.data.allColumns || response.data.columns || []);
          setTotalPages(
            response.data.pagination?.totalPages ||
              response.data.totalPages ||
              1
          );
        }
      } catch (error) {
        console.error('Error fetching data explorer data:', error);
      }
    };

    fetchData();
  }, [filters, api, caps, page, uploadId]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Data Explorer</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead>
                <tr>
                  {columns.map((column, index) => (
                    <th
                      key={index}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-800">
                {data.map((row, index) => (
                  <tr
                    key={index}
                    className={index % 2 === 0 ? 'bg-gray-900' : 'bg-gray-800'}
                  >
                    {columns.map((column, colIndex) => (
                      <td
                        key={colIndex}
                        className="px-4 py-3 whitespace-nowrap text-sm text-gray-300"
                      >
                        {renderCellValue(row[column])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center mt-4">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-gray-700 text-slate-800 rounded-lg disabled:opacity-50"
            >
              Previous
            </button>

            <span className="text-gray-400">
              Page {page} of {totalPages}
            </span>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-gray-700 text-slate-800 rounded-lg disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DataExplorer;
