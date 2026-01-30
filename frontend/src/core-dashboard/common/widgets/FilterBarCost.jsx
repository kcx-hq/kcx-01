import React from 'react';
import { Filter, RefreshCw, ChevronDown, BarChart2, Cloud, Settings, MapPin } from 'lucide-react';

const FilterSelect = ({ field, displayLabel, icon: Icon, iconColor, options, value, onChange }) => (
  <div className="flex flex-col gap-1.5">
    <div className="flex items-center gap-2">
      {Icon && <Icon size={14} className={iconColor || "text-gray-500"} />}
      <label className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">
        {displayLabel}
      </label>
    </div>
    <div className="relative group">
      <select
        value={value || "All"}
        onChange={(e) => onChange(field, e.target.value)}
        className="appearance-none bg-[#0f0f11] border border-white/10 hover:border-[#a02ff1]/50 rounded-lg pl-3 pr-8 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#a02ff1]/50 transition-all min-w-[140px] cursor-pointer text-gray-300 z-50 relative"
      >
        {/* Always render one default 'All' option */}
        <option value="All">All</option>
        
        {/* Render backend options, filtering out 'All' to prevent duplicates */}
        {Array.isArray(options) && options
          .filter(opt => opt !== "All")
          .map((opt, idx) => (
            <option key={`${opt}-${idx}`} value={opt}>{opt}</option>
        ))}
      </select>
      
      {/* Dropdown Arrow Icon */}
      <ChevronDown 
        size={14} 
        className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 z-50" 
      />
    </div>
  </div>
);

const FilterBarCost = ({ 
  filters, 
  onChange, 
  groupBy, 
  onGroupChange,
  providerOptions = [],
  serviceOptions = [],
  regionOptions = []
}) => {

  const handleFilterChange = (field, value) => {
    onChange({ ...filters, [field]: value });
  };

  return (
    <div 
      className="bg-[#1a1b20] border border-white/5 p-4 rounded-xl flex flex-wrap gap-4 items-center shadow-lg relative z-40"
    >
      <div className="flex items-center gap-2 text-sm text-gray-400 font-bold mr-2 uppercase tracking-wider">
        <Filter size={16} className="text-[#a02ff1]" /> Filters
      </div>
      
      <FilterSelect 
        field="provider" 
        displayLabel="Provider" 
        icon={Cloud} 
        iconColor="text-cyan-400" 
        options={providerOptions} 
        value={filters.provider} 
        onChange={handleFilterChange} 
      />
      
      <FilterSelect 
        field="service" 
        displayLabel="Service" 
        icon={Settings} 
        iconColor="text-[#a02ff1]" 
        options={serviceOptions} 
        value={filters.service} 
        onChange={handleFilterChange} 
      />
      
      <FilterSelect 
        field="region" 
        displayLabel="Region" 
        icon={MapPin} 
        iconColor="text-green-400" 
        options={regionOptions} 
        value={filters.region} 
        onChange={handleFilterChange} 
      />

      <div className="w-px h-8 bg-white/10 mx-2 hidden md:block"></div>

      <div className="flex flex-col gap-1.5">
         <div className="flex items-center gap-2">
            <BarChart2 size={14} className="text-blue-400" />
            <label className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Group By</label>
         </div>
         <div className="relative group">
            <select
               value={groupBy}
               onChange={(e) => onGroupChange(e.target.value)}
               className="appearance-none bg-[#0f0f11] border border-blue-500/30 hover:border-blue-500/70 rounded-lg pl-3 pr-8 py-2 text-xs font-bold text-blue-100 focus:outline-none min-w-[140px] cursor-pointer"
            >
               <option value="ServiceName">Service Name</option>
               <option value="RegionName">Region</option>
               <option value="ProviderName">Provider</option>
            </select>
            {/* Group By Arrow */}
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-blue-400" />
         </div>
      </div>
      
      <button 
        onClick={() => {
           onChange({ provider: 'All', service: 'All', region: 'All' });
           onGroupChange('ServiceName');
        }}
        className="ml-auto p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors border border-white/5"
      >
        <RefreshCw size={16} />
      </button>
    </div>
  );
};

export default FilterBarCost;