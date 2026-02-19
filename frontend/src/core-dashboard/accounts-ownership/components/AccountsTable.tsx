import React from "react";
import { AlertTriangle, CheckCircle } from "lucide-react";
import { formatCurrency } from "../utils/format";

export function AccountsTable({ accounts, sortBy, sortOrder, onSortChange }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-[1100px] w-full border-collapse text-left">
        <thead className="sticky top-0 z-10 bg-[var(--bg-surface)] text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] shadow-sm">
          <tr>
            <th className="px-4 py-4 text-left md:px-6">
              <button onClick={() => onSortChange("name")} className="flex items-center gap-1 transition-colors hover:text-[var(--text-primary)]">
                Account Name / Account ID
                {sortBy === "name" && (sortOrder === "asc" ? " (asc)" : " (desc)")}
              </button>
            </th>

            <th className="px-4 py-4 text-left md:px-6">Cloud Provider</th>
            <th className="px-4 py-4 text-left md:px-6">Top Service by Spend</th>

            <th className="px-4 py-4 text-right md:px-6">
              <button
                onClick={() => onSortChange("cost")}
                className="ml-auto flex items-center gap-1 transition-colors hover:text-[var(--text-primary)]"
              >
                Monthly Cost
                {sortBy === "cost" && (sortOrder === "asc" ? " (asc)" : " (desc)")}
              </button>
            </th>

            <th className="px-4 py-4 text-right md:px-6">% of Total Spend</th>

            <th className="px-4 py-4 text-left md:px-6">
              <button
                onClick={() => onSortChange("owner")}
                className="flex items-center gap-1 transition-colors hover:text-[var(--text-primary)]"
                title="Ownership is inferred from resource tags"
              >
                Inferred Owner (from tags)
                {sortBy === "owner" && (sortOrder === "asc" ? " (asc)" : " (desc)")}
              </button>
            </th>

            <th className="px-4 py-4 text-left md:px-6">Ownership Status</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-[var(--border-muted)] text-sm">
          {accounts.length === 0 ? (
            <tr>
              <td colSpan="7" className="px-6 py-12 text-center text-[var(--text-muted)]">
                No accounts found matching filters/search
              </td>
            </tr>
          ) : (
            accounts.map((account) => (
              <tr
                key={account.accountId}
                className={`transition-colors hover:bg-[var(--bg-surface)] ${
                  account.ownershipStatus === "No owner tag detected" || !account.owner
                    ? "bg-rose-50/60"
                    : ""
                }`}
              >
                <td className="px-4 py-4 md:px-6">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-[var(--text-primary)]">{account.accountName}</span>
                    <span className="font-mono text-[10px] text-[var(--text-muted)]" title={account.accountId}>
                      {account.displayAccountId || account.accountId}
                    </span>
                  </div>
                </td>

                <td className="px-4 py-4 md:px-6">
                  <span className="text-xs text-[var(--text-secondary)]">{account.provider}</span>
                </td>

                <td className="px-4 py-4 md:px-6">
                  <span className="text-xs text-[var(--text-secondary)]">{account.topService}</span>
                </td>

                <td className="px-4 py-4 text-right md:px-6">
                  <span className="font-mono text-xs font-bold text-[var(--text-primary)]">{formatCurrency(account.cost)}</span>
                </td>

                <td className="px-4 py-4 text-right md:px-6">
                  <span className="font-mono text-[10px] text-[var(--text-muted)]">{Number(account.percentage || 0).toFixed(2)}%</span>
                </td>

                <td className="px-4 py-4 md:px-6">
                  {account.owner ? (
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-[var(--brand-primary)]">
                        {account.owner.charAt(0).toUpperCase()}
                      </div>
                      <span className="max-w-[150px] truncate text-xs text-[var(--text-secondary)]" title={account.owner}>
                        {account.owner}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs italic text-[var(--text-muted)]">No owner tag detected</span>
                  )}
                </td>

                <td className="px-4 py-4 md:px-6">
                  {account.ownershipStatus === "Assigned (inferred)" || account.owner ? (
                    <span className="flex w-fit items-center gap-1.5 rounded border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">
                      <CheckCircle size={10} /> Assigned (inferred)
                    </span>
                  ) : (
                    <span className="flex w-fit items-center gap-1.5 rounded border border-rose-200 bg-rose-50 px-2 py-1 text-[10px] font-bold text-rose-700">
                      <AlertTriangle size={10} /> No owner tag detected
                    </span>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default AccountsTable;
