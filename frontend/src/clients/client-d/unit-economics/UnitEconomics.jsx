import React, { useMemo, useState } from "react";
import { useAuthStore } from "../../../store/Authstore";
import { AlertCircle, Loader2 } from "lucide-react";

import UnitEconomicsView from "./UnitEconomicsView.jsx";
import { useUnitEconomicsData } from "./hooks/useUnitEconomicsData.js";

const UnitEconomics = ({ filters = {}, api, caps }) => {
  const { user } = useAuthStore();
  const isLocked = !user?.is_premium;

  if (!api || !caps || !caps.modules?.unitEconomics?.enabled) return null;

  const { loading, data, error } = useUnitEconomicsData({ api, caps, filters });

  // Client-side helpers
  const normalized = useMemo(() => {
    const kpis = data?.kpis || {};
    const drift = data?.drift || null;
    const trend = Array.isArray(data?.trend) ? data.trend : [];
    const skuEfficiency = Array.isArray(data?.skuEfficiency) ? data.skuEfficiency : [];

    // sort: highest cost first
    const skuSorted = [...skuEfficiency].sort((a, b) => (Number(b?.cost || 0) - Number(a?.cost || 0)));

    return { kpis, drift, trend, skuEfficiency: skuSorted };
  }, [data]);

  const [skuSearch, setSkuSearch] = useState("");
  const filteredSkus = useMemo(() => {
    if (!skuSearch.trim()) return normalized.skuEfficiency;
    const q = skuSearch.trim().toLowerCase();
    return normalized.skuEfficiency.filter((s) => String(s?.sku || "").toLowerCase().includes(q));
  }, [normalized.skuEfficiency, skuSearch]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center text-[#1EA88A]">
        <Loader2 className="animate-spin" size={48} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 min-h-screen bg-[#f8faf9] text-slate-800">
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-2">
          <AlertCircle className="text-red-400" size={18} />
          <span className="text-red-300 text-sm">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <UnitEconomicsView
      isLocked={isLocked}
      kpis={normalized.kpis}
      drift={normalized.drift}
      trend={normalized.trend}
      skuEfficiency={filteredSkus}
      skuSearch={skuSearch}
      setSkuSearch={setSkuSearch}
    />
  );
};

export default UnitEconomics;
