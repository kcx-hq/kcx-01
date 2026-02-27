import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../common/widgets';
import type { AccountItem, AccountsOwnershipViewProps, DepartmentMergedItem } from "./types";

const AccountsOwnershipView = ({
  loading,
  isFiltering,
  accountsData,
  complianceData,
  departmentData
}: AccountsOwnershipViewProps) => {
  // Format currency
  const formatCurrency = (val: number | string | null | undefined) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(val ?? 0));

  if (loading && !accountsData.accounts) {
    return (
      <div className="animate-in fade-in zoom-in-95 duration-300 flex flex-col h-full">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#007758] mx-auto mb-4"></div>
            <p className="text-gray-400">Loading accounts data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in zoom-in-95 duration-300 flex flex-col h-full">

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto relative min-h-0">
        {isFiltering && (
          <div className="absolute top-4 right-4 z-50 flex items-center gap-2 bg-[#1a1b20]/90 backdrop-blur-md border border-[#007758]/30 rounded-lg px-3 py-2 shadow-lg">
            <span className="text-xs text-gray-300 font-medium">Filtering...</span>
          </div>
        )}

        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Total Accounts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{accountsData.totalAccounts}</div>
                <p className="text-xs text-gray-400">Active accounts</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Account Ownership</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{accountsData.ownershipRate}%</div>
                <p className="text-xs text-gray-400">{accountsData.ownedAccounts} of {accountsData.totalAccounts} assigned</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Tag Compliance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{complianceData.complianceRate}%</div>
                <p className="text-xs text-gray-400">{complianceData.compliant} of {complianceData.compliant + complianceData.nonCompliant} compliant</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Total Spend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(accountsData.totalSpend)}</div>
                <p className="text-xs text-gray-400">Total cloud spend</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* <Card>
              <CardHeader>
                <CardTitle>Account Ownership</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={departmentData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    <XAxis dataKey="name" stroke="#aaa" />
                    <YAxis stroke="#aaa" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1a1b20', borderColor: '#333', color: 'white' }}
                      itemStyle={{ color: 'white' }}
                      formatter={(value) => [formatCurrency(value), 'Cost']}
                    />
                    <Bar dataKey="ownedCost" fill="#48bb78" name="Owned" />
                    <Bar dataKey="unownedCost" fill="#f56565" name="Unowned" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card> */}

            {/* <Card>
              <CardHeader>
                <CardTitle>Compliance Status</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Compliant', value: complianceData.compliant },
                        { name: 'Non-Compliant', value: complianceData.nonCompliant }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      <Cell key="cell-0" fill="#48bb78" />
                      <Cell key="cell-1" fill="#f56565" />
                    </Pie>
                    <Tooltip formatter={(value) => [formatCurrency(value), 'Cost']} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card> */}
          </div>

          {/* Department Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Department Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Department</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Total Cost</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Owned Cost</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Unowned Cost</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Ownership Rate</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Compliance Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {departmentData.map((dept: DepartmentMergedItem, index: number) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-gray-900' : 'bg-gray-800'}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-300">{dept.name}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{formatCurrency(dept.totalCost)}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{formatCurrency(dept.ownedCost)}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{formatCurrency(dept.unownedCost)}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            dept.ownershipRate >= 80 ? 'bg-green-800 text-green-100' : 
                            dept.ownershipRate >= 50 ? 'bg-yellow-800 text-yellow-100' : 'bg-red-800 text-red-100'
                          }`}>
                            {dept.ownershipRate}%
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            dept.complianceRate >= 80 ? 'bg-green-800 text-green-100' : 
                            dept.complianceRate >= 50 ? 'bg-yellow-800 text-yellow-100' : 'bg-red-800 text-red-100'
                          }`}>
                            {dept.complianceRate}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Account Details */}
          <Card>
            <CardHeader>
              <CardTitle>Account Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Account ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Owner</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Department</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {accountsData.accounts.map((account: AccountItem, index: number) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-gray-900' : 'bg-gray-800'}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-300">{account.accountId}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{account.accountName}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{account.owner || 'Unassigned'}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{account.provider}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            account.owner ? 'bg-green-800 text-green-100' : 'bg-red-800 text-red-100'
                          }`}>
                            {account.owner ? 'Assigned' : 'Unassigned'}
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
      </div>
    </div>
  );
};

export default AccountsOwnershipView;
