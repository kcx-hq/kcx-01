import React from "react";
import { Search, Download } from "lucide-react";

export function Toolbar({
  searchTerm,
  setSearchTerm,
  filterOwner,
  onFilterOwnerChange,
  filterProvider,
  onFilterProviderChange,
  providers,
  onExport,
}) {
  return (
    <div className="p-4 border-b border-white/10 flex flex-col lg:flex-row justify-between items-center gap-4 bg-[#25262b]">
      <div className="flex-1 w-full lg:w-auto relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
        <input
          type="text"
          placeholder="Search accounts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-white focus:border-[#a02ff1] focus:ring-1 focus:ring-[#a02ff1] outline-none transition-all placeholder:text-gray-600"
        />
      </div>

      <div className="flex gap-2 w-full lg:w-auto overflow-x-auto">
        <select
          value={filterOwner}
          onChange={(e) => onFilterOwnerChange(e.target.value)}
          className="pl-3 pr-8 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-bold text-white outline-none cursor-pointer min-w-[140px] transition-colors"
        >
          <option value="All" className="bg-[#1a1b20]">
            All Ownership Status
          </option>
          <option value="Assigned" className="bg-[#1a1b20]">
            Assigned (inferred)
          </option>
          <option value="Unassigned" className="bg-[#1a1b20]">
            No owner tag detected
          </option>
        </select>

        <select
          value={filterProvider}
          onChange={(e) => onFilterProviderChange(e.target.value)}
          className="pl-3 pr-8 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-bold text-white outline-none cursor-pointer min-w-[120px] transition-colors"
        >
          <option value="All" className="bg-[#1a1b20]">
            All Providers
          </option>
          {(providers || []).map((p) => (
            <option key={p} value={p} className="bg-[#1a1b20]">
              {p}
            </option>
          ))}
        </select>

        <button
          onClick={onExport}
          className="flex items-center gap-2 px-4 py-2 bg-[#a02ff1]/10 hover:bg-[#a02ff1]/20 border border-[#a02ff1]/30 rounded-lg text-xs font-bold text-[#a02ff1] transition-all whitespace-nowrap"
        >
          <Download size={14} /> Export CSV
        </button>
      </div>
    </div>
  );
}
