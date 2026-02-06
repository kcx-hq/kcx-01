import React from "react";
import {
  Filter,
  RefreshCw,
  ChevronDown,
  Cloud,
  Settings,
  MapPin,
  Crown,
} from "lucide-react";
import { useAuthStore } from "../../../store/Authstore";

const FilterSelect = ({
  field,
  displayLabel,
  icon: Icon,
  iconColor,
  options,
  value,
  onChange,
  isPremiumField = false,
}) => {
  const { user } = useAuthStore();
  const isPremium = !user?.is_premium && isPremiumField;
  const brand = "var(--brand-secondary, #007758)";

  return (
    <div className="flex flex-col gap-1.5 relative">
      {isPremium && (
        <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-50 flex items-center justify-center rounded-lg">
          <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-yellow-100 border border-yellow-300 rounded-md">
            <Crown size={12} className="text-yellow-600" />
            <span className="text-yellow-700 font-bold text-[10px]">
              Premium
            </span>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        {Icon && <Icon size={14} className={iconColor || "text-gray-500"} />}
        <label className="text-[10px] text-gray-600 font-semibold uppercase tracking-wider">
          {displayLabel}
        </label>
      </div>

      <div className="relative">
        <select
          value={value ?? ""}
          onChange={(e) => !isPremium && onChange(field, e.target.value)}
          disabled={isPremium}
          className={`appearance-none bg-[var(--bg-main)] border border-gray-300 rounded-lg pl-3 pr-8 py-2 text-xs font-medium focus:outline-none transition-all min-w-[140px] text-gray-800 ${
            isPremium
              ? "opacity-60 cursor-not-allowed"
              : "cursor-pointer hover:border-[var(--brand-secondary)]"
          }`}
          onFocus={(e) => {
            if (isPremium) return;
            e.currentTarget.style.borderColor = brand;
            e.currentTarget.style.boxShadow =
              "0 0 0 2px rgba(0,119,88,0.15)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "";
            e.currentTarget.style.boxShadow = "";
          }}
        >
          {Array.isArray(options) && options.length > 0 ? (
            options.map((opt, idx) => {
              const val =
                typeof opt === "object" && opt !== null && "value" in opt
                  ? opt.value
                  : String(opt);
              const label =
                typeof opt === "object" && opt !== null && "label" in opt
                  ? opt.label
                  : val;
              return (
                <option key={`${val}-${idx}`} value={val}>
                  {label}
                </option>
              );
            })
          ) : (
            <option value="">—</option>
          )}
        </select>

        <ChevronDown
          size={14}
          className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500"
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
  regionOptions = [],
}) => {
  const brand = "var(--brand-secondary, #007758)";

  const handleFilterChange = (field, value) => {
    onChange({ ...filters, [field]: value });
  };

  return (
    <div
      className="bg-[var(--bg-surface)] border border-gray-200 p-4 rounded-xl flex flex-wrap gap-4 items-center shadow-sm relative z-40"
    >
      <div className="flex items-center gap-2 text-sm text-gray-700 font-bold mr-2 uppercase tracking-wider">
        <Filter size={16} style={{ color: brand }} /> Filters
      </div>

      <FilterSelect
        field="provider"
        displayLabel="Provider"
        icon={Cloud}
        iconColor="text-teal-600"
        options={providerOptions}
        value={filters.provider}
        onChange={handleFilterChange}
      />

      <FilterSelect
        field="service"
        displayLabel="Service"
        icon={Settings}
        iconColor="text-gray-600"
        options={serviceOptions}
        value={filters.service}
        onChange={handleFilterChange}
        isPremiumField
      />

      <FilterSelect
        field="region"
        displayLabel="Region"
        icon={MapPin}
        iconColor="text-green-600"
        options={regionOptions}
        value={filters.region}
        onChange={handleFilterChange}
        isPremiumField
      />

      <button
        type="button"
        onClick={onReset}
        className="ml-auto p-2 bg-[var(--bg-soft)] hover:bg-[var(--highlight-green)] rounded-lg text-gray-600 hover:text-[var(--brand-secondary)] transition-colors border border-gray-200"
        title="Reset all filters"
      >
        <RefreshCw size={16} />
      </button>
    </div>
  );
};

export default FilterBarCost;
