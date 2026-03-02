import React from 'react';
import { Filter, RefreshCw, ChevronDown, Cloud, Settings, MapPin } from 'lucide-react';
import type { ChangeEvent, ComponentType } from "react";

type FilterField = "provider" | "service" | "region";

interface FilterValues {
  provider: string;
  service: string;
  region: string;
}

interface FilterSelectProps {
  field: FilterField;
  displayLabel: string;
  icon?: ComponentType<{ size?: number; className?: string }>;
  iconColor?: string;
  options: string[];
  value: string;
  onChange: (field: FilterField, value: string) => void;
}

interface FilterBarProps {
  filters: FilterValues;
  onChange: (next: FilterValues) => void;
  onReset?: () => void;
  providerOptions?: string[];
  serviceOptions?: string[];
  regionOptions?: string[];
}

const FilterSelect = ({ field, displayLabel, icon: Icon, iconColor, options, value, onChange }: FilterSelectProps) => {
  return (
  <div className="flex flex-col gap-1.5 relative">
    <div className="flex items-center gap-2">
      {Icon && <Icon size={14} className={iconColor || "text-gray-500"} />}
      <label className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">
        {displayLabel}
      </label>
    </div>
    <div className="relative group">
      <select
        value={value || "All"}
        onChange={(e: ChangeEvent<HTMLSelectElement>) => onChange(field, e.target.value)}
        className="appearance-none bg-[#0f0f11] border border-white/10 hover:border-[#23a282]/50 rounded-lg pl-3 pr-8 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#23a282]/50 transition-all min-w-[140px] text-gray-300 z-40 relative cursor-pointer"
      >
        <option value="All">All</option>
        {Array.isArray(options) && options
          .filter((opt: string) => opt !== "All")
          .map((opt: string, idx: number) => (
            <option key={`${opt}-${idx}`} value={opt}>{opt}</option>
        ))}
      </select>
      
      <ChevronDown 
        size={14} 
        className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none z-40 text-gray-500"
      />
    </div>
  </div>
  );
};

const FilterBar = ({ 
  filters, 
  onChange, 
  onReset,
  providerOptions = [],
  serviceOptions = [],
  regionOptions = []
}: FilterBarProps) => {

  const handleFilterChange = (field: FilterField, value: string) => {
    onChange({ ...filters, [field]: value });
  };

  const handleResetClick = () => {
    if (onReset) {
      onReset();
    } else {
      onChange({ provider: 'All', service: 'All', region: 'All' });
    }
  };

  return (
    <div 
      className="bg-[#1a1b20] border border-white/5 p-4 rounded-xl flex flex-wrap gap-4 items-center shadow-lg relative z-40"
    >
      <div className="flex items-center gap-2 text-sm text-gray-400 font-bold mr-2 uppercase tracking-wider">
        <Filter size={16} className="text-[#23a282]" /> Filters
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
        iconColor="text-[#23a282]" 
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
      
      <button 
        onClick={handleResetClick}
        className="ml-auto p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors border border-white/5"
        title="Reset all filters"
      >
        <RefreshCw size={16} />
      </button>
    </div>
  );
};

export default FilterBar;
