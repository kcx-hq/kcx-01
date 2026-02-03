import React from 'react';
import { Filter, RefreshCw, ChevronDown, Cloud, Settings, MapPin, Crown, Lock } from 'lucide-react';
import { useAuthStore } from '../../../store/Authstore';

const FilterSelect = ({ field, displayLabel, icon: Icon, iconColor, options, value, onChange, isPremiumField = false }) => {
  const { user } = useAuthStore();
  const isPremium = !user?.is_premium && isPremiumField; // Show mask if user is NOT premium AND field is premium
  
  return (
  <div className="flex flex-col gap-1.5 relative">
    {isPremium && (
      <div className="absolute inset-0 bg-[#0f0f11]/80 backdrop-blur-sm z-50 pointer-events-auto flex items-center justify-center rounded-lg">
        <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-yellow-500/10 border border-yellow-500/30 rounded-md">
          <Crown size={12} className="text-yellow-400" />
          <span className="text-yellow-400 font-bold text-[10px]">Premium</span>
        </div>
      </div>
    )}
    <div className="flex items-center gap-2">
      {Icon && <Icon size={14} className={iconColor || "text-gray-500"} />}
      <label className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">
        {displayLabel}
      </label>
    </div>
    <div className="relative group">
      <select
        value={value ?? ""}
        onChange={(e) => !isPremium && onChange(field, e.target.value)}
        disabled={isPremium}
        className={`appearance-none bg-[#0f0f11] border border-white/10 hover:border-[#a02ff1]/50 rounded-lg pl-3 pr-8 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#a02ff1]/50 transition-all min-w-[140px] text-gray-300 z-40 relative ${
          isPremium ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer'
        }`}
      >
        {/* Options from backend only (no manual/hardcoded data) */}
        {Array.isArray(options) && options.length > 0 ? (
          options.map((opt, idx) => {
            const val = typeof opt === "object" && opt !== null && "value" in opt ? opt.value : String(opt);
            const label = typeof opt === "object" && opt !== null && "label" in opt ? opt.label : val;
            return <option key={`${val}-${idx}`} value={val}>{label}</option>;
          })
        ) : (
          <option value="">—</option>
        )}
      </select>
      
      {/* Dropdown Arrow Icon */}
      <ChevronDown 
        size={14} 
        className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none z-40 ${
          isPremium ? 'text-gray-600' : 'text-gray-500'
        }`}
      />
    </div>
  </div>
  );
};

const FilterBarCost = ({ 
  filters, 
  onChange, 
  onReset,
  providerOptions = [],
  serviceOptions = [],
  regionOptions = []
}) => {

  const handleFilterChange = (field, value) => {
    // Update only the changed field; keep other filter values so client can change them separately
    onChange({ ...filters, [field]: value });
  };

  const handleResetClick = (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (onReset) {
      onReset();
    } else {
      const first = (arr) => (Array.isArray(arr) && arr[0]) ?? "";
      onChange({
        provider: first(providerOptions),
        service: first(serviceOptions),
        region: first(regionOptions),
      });
    }
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
        isPremiumField={true}
      />
      
      <FilterSelect 
        field="region" 
        displayLabel="Region" 
        icon={MapPin} 
        iconColor="text-green-400" 
        options={regionOptions} 
        value={filters.region} 
        onChange={handleFilterChange}
        isPremiumField={true}
      />
      
      <button
        type="button"
        onClick={handleResetClick}
        className="ml-auto p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors border border-white/5"
        title="Reset all filters"
      >
        <RefreshCw size={16} />
      </button>
    </div>
  );
};

export default FilterBarCost;