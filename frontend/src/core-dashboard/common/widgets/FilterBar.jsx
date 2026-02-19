import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Filter,
  RefreshCcw,
  ChevronDown,
  Cloud,
  Settings,
  MapPin,
  Lock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
  compactMobile = false,
}) => {
  const { user } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const isPremium = !user?.is_premium && isPremiumField;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (val) => {
    if (!isPremium) {
      onChange(field, val);
      setIsOpen(false);
    }
  };

  const currentLabel = useMemo(() => {
    if (value === "All") return `All ${displayLabel}s`;
    const selectedOpt = options.find(
      (opt) => (typeof opt === "object" ? opt.value : opt) === value
    );
    return typeof selectedOpt === "object" ? selectedOpt.label : selectedOpt;
  }, [value, options, displayLabel]);

  return (
    <div
      className={`relative group ${
        compactMobile ? "w-11 flex-none sm:min-w-[160px]" : "flex min-w-[160px] flex-col gap-1.5"
      }`}
      ref={dropdownRef}
    >
      <div
        className={`${
          compactMobile
            ? "mb-1.5 hidden items-center gap-1.5 ml-1 sm:flex"
            : "ml-1 flex items-center gap-1.5"
        }`}
      >
        {Icon && <Icon size={14} className={iconColor || "text-slate-400"} />}
        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
          {displayLabel}
        </label>
        {isPremium && (
          <div className="ml-auto rounded border border-amber-100 bg-amber-50 p-0.5">
            <Lock size={10} className="text-amber-500" />
          </div>
        )}
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() => !isPremium && setIsOpen((p) => !p)}
          aria-label={`${displayLabel} filter`}
          className={`
            flex w-full items-center justify-between bg-white border font-semibold transition-all shadow-sm
            ${
              compactMobile
                ? "h-10 w-11 justify-between rounded-lg px-2 text-[11px] sm:h-auto sm:w-full sm:justify-between sm:py-2 sm:pl-2.5 sm:pr-2"
                : "rounded-xl py-2.5 pl-3 pr-3 text-xs"
            }
            ${isOpen ? "border-emerald-500 text-emerald-700 ring-4 ring-emerald-50 shadow-md" : "border-slate-200 text-[#192630] hover:border-slate-300"}
            ${isPremium ? "cursor-not-allowed bg-slate-50/50 text-slate-400 opacity-50" : "cursor-pointer"}
          `}
        >
          <span className={`flex min-w-0 items-center gap-1 ${compactMobile ? "mr-0 sm:mr-2" : "mr-2"}`}>
            {compactMobile && Icon && (
              <Icon
                size={compactMobile ? 14 : 13}
                className={`${iconColor || "text-slate-400"} sm:hidden`}
              />
            )}
            <span className={`${compactMobile ? "hidden truncate sm:inline" : "truncate"}`}>
              {currentLabel || `All ${displayLabel}s`}
            </span>
          </span>

          <ChevronDown
            size={14}
            className={`shrink-0 transition-transform duration-300 ${
              compactMobile ? "block" : ""
            } ${
              isOpen ? "rotate-180 text-emerald-600" : "rotate-0 text-slate-400"
            }`}
          />
        </button>

        <AnimatePresence>
          {isOpen && !isPremium && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              className="absolute left-0 z-[100] mt-2 w-full min-w-[190px] overflow-hidden rounded-2xl border border-slate-100 bg-white p-1.5 shadow-2xl ring-1 ring-slate-200/50"
            >
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect("All");
                }}
                className={`w-full rounded-xl px-4 py-2.5 text-left text-xs font-bold transition-colors ${
                  value === "All" ? "bg-emerald-50 text-emerald-700" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                All {displayLabel}s
              </button>

              <div className="custom-scrollbar max-h-60 overflow-y-auto">
                {options
                  .filter((opt) => (typeof opt === "object" ? opt.value : opt) !== "All")
                  .map((opt, idx) => {
                    const val = typeof opt === "object" ? opt.value : opt;
                    const label = typeof opt === "object" ? opt.label : opt;
                    return (
                      <button
                        key={`${val}-${idx}`}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleSelect(val);
                        }}
                        className={`w-full rounded-xl px-4 py-2.5 text-left text-xs font-bold transition-colors ${
                          value === val ? "bg-emerald-50 text-emerald-700" : "text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {isPremium && (
          <div className="absolute inset-0 z-10 cursor-not-allowed rounded-xl bg-white/10 backdrop-blur-[0.5px]" />
        )}
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
  compactMobile = false,
  tight = false,
}) => {
  const handleFilterChange = (field, value) => {
    onChange({ ...filters, [field]: value });
  };

  return (
    <div
      className={`relative z-40 border border-slate-200 bg-white shadow-sm ${
        compactMobile
          ? `flex items-center gap-3 rounded-2xl p-3 sm:items-end sm:gap-5 ${tight ? "sm:rounded-2xl sm:p-4" : "sm:rounded-3xl sm:p-4"}`
          : "flex flex-wrap items-end gap-5 rounded-3xl p-4"
      }`}
    >
      <div
        className={`${
          compactMobile
            ? "flex items-center gap-2.5 flex-none"
            : "mr-4 flex items-center gap-3 border-r border-slate-100 pb-1 pr-6"
        }`}
      >
        <div
          className={`border border-emerald-100/50 bg-emerald-50 text-emerald-600 shadow-inner ${
            compactMobile ? "rounded-xl p-2" : "rounded-2xl p-2.5"
          }`}
        >
          <Filter size={18} />
        </div>
        <div className="hidden sm:flex sm:flex-col sm:gap-0.5">
          <span className="block text-[10px] font-black uppercase leading-[1.1] tracking-[0.15em] text-slate-400">
            Command
          </span>
          <span className="block text-base font-black leading-[1.1] text-[#192630]">Filters</span>
        </div>
      </div>

      <div className={`${compactMobile ? "flex min-w-0 flex-1 items-center gap-3" : "flex flex-1 flex-wrap items-center gap-5"}`}>
        <FilterSelect
          field="provider"
          displayLabel="Provider"
          icon={Cloud}
          iconColor="text-sky-500"
          options={providerOptions}
          value={filters.provider}
          onChange={handleFilterChange}
          compactMobile={compactMobile}
        />

        <FilterSelect
          field="service"
          displayLabel="Service"
          icon={Settings}
          iconColor="text-indigo-500"
          options={serviceOptions}
          value={filters.service}
          onChange={handleFilterChange}
          isPremiumField
          compactMobile={compactMobile}
        />

        <FilterSelect
          field="region"
          displayLabel="Region"
          icon={MapPin}
          iconColor="text-emerald-500"
          options={regionOptions}
          value={filters.region}
          onChange={handleFilterChange}
          isPremiumField
          compactMobile={compactMobile}
        />
      </div>

      <div className={`${compactMobile ? "ml-auto flex-none sm:border-l sm:border-slate-100 sm:pl-4" : "ml-auto border-l border-slate-100 pl-4"}`}>
        <button
          type="button"
          onClick={onReset}
          className={`group border border-slate-200 bg-slate-50 text-slate-400 shadow-sm transition-all hover:border-emerald-200 hover:bg-white hover:text-emerald-600 active:scale-95 ${
            compactMobile ? "rounded-xl p-2.5" : "rounded-2xl p-3"
          }`}
          title="Reset all filters"
        >
          <RefreshCcw
            size={18}
            className="transition-transform duration-700 ease-in-out group-hover:rotate-180"
          />
        </button>
      </div>
    </div>
  );
};

export default FilterBarCost;
