import React from "react";
import {
  Filter,
  RefreshCw,
  ChevronDown,
  BarChart2,
  Cloud,
  Settings,
  MapPin,
  type LucideIcon,
} from "lucide-react";

const BRAND = "var(--brand-secondary, #007758)";

type FilterField = "provider" | "service" | "region";
type GroupByValue = "ServiceName" | "RegionName" | "ProviderName";

interface CostFilters {
  provider: string;
  service: string;
  region: string;
}

interface FilterSelectProps {
  field: FilterField;
  displayLabel: string;
  icon?: LucideIcon;
  iconColor?: string;
  options: string[];
  value: string;
  onChange: (field: FilterField, value: string) => void;
}

interface FilterBarCostProps {
  filters: CostFilters;
  onChange: (next: CostFilters) => void;
  groupBy: GroupByValue;
  onGroupChange: (groupBy: GroupByValue) => void;
  providerOptions?: string[];
  serviceOptions?: string[];
  regionOptions?: string[];
}

const FilterSelect = ({
  field,
  displayLabel,
  icon: Icon,
  iconColor,
  options,
  value,
  onChange,
}: FilterSelectProps) => (
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
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onChange(field, e.target.value)}
        className="appearance-none bg-[#0f0f11] border border-white/10 rounded-lg pl-3 pr-8 py-2 text-xs font-medium focus:outline-none focus:ring-2 transition-all min-w-[140px] cursor-pointer text-gray-300 z-50 relative"
        onFocus={(e: React.FocusEvent<HTMLSelectElement>) => {
          e.currentTarget.style.borderColor = BRAND;
          e.currentTarget.style.boxShadow =
            "0 0 0 2px rgba(0, 119, 88, 0.25)";
        }}
        onBlur={(e: React.FocusEvent<HTMLSelectElement>) => {
          e.currentTarget.style.borderColor = "";
          e.currentTarget.style.boxShadow = "";
        }}
        onMouseEnter={(e: React.MouseEvent<HTMLSelectElement>) => {
          e.currentTarget.style.borderColor = "rgba(0, 119, 88, 0.5)";
        }}
        onMouseLeave={(e: React.MouseEvent<HTMLSelectElement>) => {
          e.currentTarget.style.borderColor = "";
        }}
      >
        {/* Always render one default 'All' option */}
        <option value="All">All</option>

        {/* Render backend options, filtering out 'All' to prevent duplicates */}
        {Array.isArray(options) &&
          options
            .filter((opt: string) => opt !== "All")
            .map((opt: string, idx: number) => (
              <option key={`${opt}-${idx}`} value={opt}>
                {opt}
              </option>
            ))}
      </select>

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
  regionOptions = [],
}: FilterBarCostProps) => {
  const handleFilterChange = (field: FilterField, value: string) => {
    onChange({ ...filters, [field]: value });
  };

  return (
    <div className="bg-[#1a1b20] border border-white/5 p-4 rounded-xl flex flex-wrap gap-4 items-center shadow-lg relative z-40">
      <div className="flex items-center gap-2 text-sm text-gray-400 font-bold mr-2 uppercase tracking-wider">
        <Filter size={16} style={{ color: BRAND }} /> Filters
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
        iconColor="text-gray-300"
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

      <div className="w-px h-8 bg-white/10 mx-2 hidden md:block" />

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <BarChart2 size={14} style={{ color: BRAND }} />
          <label className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">
            Group By
          </label>
        </div>

        <div className="relative group">
          <select
            value={groupBy}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
              const value = e.target.value;
              if (
                value === "ServiceName" ||
                value === "RegionName" ||
                value === "ProviderName"
              ) {
                onGroupChange(value);
              }
            }}
            className="appearance-none bg-[#0f0f11] border border-white/10 rounded-lg pl-3 pr-8 py-2 text-xs font-bold text-gray-200 focus:outline-none min-w-[140px] cursor-pointer transition-all"
            onFocus={(e: React.FocusEvent<HTMLSelectElement>) => {
              e.currentTarget.style.borderColor = BRAND;
              e.currentTarget.style.boxShadow =
                "0 0 0 2px rgba(0, 119, 88, 0.25)";
            }}
            onBlur={(e: React.FocusEvent<HTMLSelectElement>) => {
              e.currentTarget.style.borderColor = "";
              e.currentTarget.style.boxShadow = "";
            }}
            onMouseEnter={(e: React.MouseEvent<HTMLSelectElement>) => {
              e.currentTarget.style.borderColor = "rgba(0, 119, 88, 0.5)";
            }}
            onMouseLeave={(e: React.MouseEvent<HTMLSelectElement>) => {
              e.currentTarget.style.borderColor = "";
            }}
          >
            <option value="ServiceName">Service Name</option>
            <option value="RegionName">Region</option>
            <option value="ProviderName">Provider</option>
          </select>

          <ChevronDown
            size={14}
            className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: BRAND }}
          />
        </div>
      </div>

      <button
        onClick={() => {
          onChange({ provider: "All", service: "All", region: "All" });
          onGroupChange("ServiceName");
        }}
        className="ml-auto p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors border border-white/5"
        title="Reset filters"
      >
        <RefreshCw size={16} />
      </button>
    </div>
  );
};

export default FilterBarCost;
