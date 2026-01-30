import React from "react";
import { AlertTriangle, CheckCircle } from "lucide-react";
import { formatCurrency } from "../utils/format";

export function AccountsTable({ accounts, sortBy, sortOrder, onSortChange }) {
  return (
    <table className="w-full text-left border-collapse">
      <thead className="bg-[#15161a] text-gray-500 font-bold text-[10px] uppercase tracking-wider sticky top-0 z-10 shadow-sm">
        <tr>
          <th className="px-6 py-4 text-left">
            <button onClick={() => onSortChange("name")} className="flex items-center gap-1 hover:text-white transition-colors">
              Account Name / Account ID
              {sortBy === "name" && (sortOrder === "asc" ? " ↑" : " ↓")}
            </button>
          </th>

          <th className="px-6 py-4 text-left">Cloud Provider</th>
          <th className="px-6 py-4 text-left">Top Service by Spend</th>

          <th className="px-6 py-4 text-right">
            <button
              onClick={() => onSortChange("cost")}
              className="flex items-center gap-1 hover:text-white transition-colors ml-auto"
            >
              Monthly Cost
              {sortBy === "cost" && (sortOrder === "asc" ? " ↑" : " ↓")}
            </button>
          </th>

          <th className="px-6 py-4 text-right">% of Total Spend</th>

          <th className="px-6 py-4 text-left">
            <button
              onClick={() => onSortChange("owner")}
              className="flex items-center gap-1 hover:text-white transition-colors"
              title="Ownership is inferred from resource tags"
            >
              Inferred Owner (from tags)
              {sortBy === "owner" && (sortOrder === "asc" ? " ↑" : " ↓")}
            </button>
          </th>

          <th className="px-6 py-4 text-left">Ownership Status</th>
        </tr>
      </thead>

      <tbody className="text-sm divide-y divide-white/5">
        {accounts.length === 0 ? (
          <tr>
            <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
              No accounts found matching filters/search
            </td>
          </tr>
        ) : (
          accounts.map((account) => (
            <tr
              key={account.accountId}
              className={`hover:bg-white/5 transition-colors ${
                account.ownershipStatus === "No owner tag detected" || !account.owner
                  ? "bg-red-500/5 border-l-2 border-red-500/50"
                  : ""
              }`}
            >
              <td className="px-6 py-4">
                <div className="flex flex-col gap-1">
                  <span className="text-gray-200 text-xs font-bold">{account.accountName}</span>
                  <span className="text-[10px] text-gray-500 font-mono" title={account.accountId}>
                    {account.displayAccountId || account.accountId}
                  </span>
                </div>
              </td>

              <td className="px-6 py-4">
                <span className="text-xs text-gray-400">{account.provider}</span>
              </td>

              <td className="px-6 py-4">
                <span className="text-xs text-gray-300">{account.topService}</span>
              </td>

              <td className="px-6 py-4 text-right">
                <span className="font-mono text-xs font-bold text-white">{formatCurrency(account.cost)}</span>
              </td>

              <td className="px-6 py-4 text-right">
                <span className="text-[10px] text-gray-500 font-mono">{Number(account.percentage || 0).toFixed(2)}%</span>
              </td>

              <td className="px-6 py-4">
                {account.owner ? (
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-[10px] font-bold text-blue-400">
                      {account.owner.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs text-gray-400 truncate max-w-[150px]" title={account.owner}>
                      {account.owner}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-gray-600 italic">No owner tag detected</span>
                )}
              </td>

              <td className="px-6 py-4">
                {account.ownershipStatus === "Assigned (inferred)" || account.owner ? (
                  <span className="flex items-center gap-1.5 text-[10px] bg-green-500/10 text-green-400 px-2 py-1 rounded border border-green-500/20 w-fit font-bold">
                    <CheckCircle size={10} /> Assigned (inferred)
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-[10px] bg-red-500/10 text-red-400 px-2 py-1 rounded border border-red-500/20 w-fit font-bold">
                    <AlertTriangle size={10} /> No owner tag detected
                  </span>
                )}
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}
