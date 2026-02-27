import React, { useCallback, useMemo, useState } from 'react';
import { useDebounce } from '../../../hooks/useDebounce';
import { useAuthStore } from '../../../store/Authstore';

import { useCostDriversData } from '../../../core-dashboard/cost-drivers/hooks/useCostDriversData';
import { useDriverDetails } from '../../../core-dashboard/cost-drivers/hooks/useDriverDetails';
import { CostDriversView } from './CostDriversView';
import type { CostDriverItem, CostDriversProps, DriverType, SortListBy } from "./types";

export default function CostDrivers({ filters, api, caps }: CostDriversProps) {
  const { user } = useAuthStore();
  const isMasked = !user?.is_premium; // NOT premium => masked

  const [period, setPeriod] = useState(30);
  const [dimension] = useState('ServiceName');
  const [minChange] = useState(0);
  const [selectedDriver, setSelectedDriver] = useState<CostDriverItem | null>(null);
  const [sortListBy, setSortListBy] = useState<SortListBy>('diff');
  const [activeServiceFilter, setActiveServiceFilter] = useState('All');
  const [showTreeMap, setShowTreeMap] = useState(false);

  const debouncedFilters = useDebounce(filters, 400);
  const debouncedPeriod = useDebounce(period, 400);
  const debouncedDimension = useDebounce(dimension, 400);
  const debouncedMinChange = useDebounce(minChange, 400);

  const data = useCostDriversData({
    api,
    caps,
    filters,
    period,
    dimension,
    minChange,
    debouncedFilters,
    debouncedPeriod,
    debouncedDimension,
    debouncedMinChange,
  });

  const filteredIncreases = useMemo(() => {
    if (!activeServiceFilter || activeServiceFilter === 'All') return data.increases;
    return data.increases.filter((x: CostDriverItem) => x?.name?.toLowerCase?.().includes(activeServiceFilter.toLowerCase()));
  }, [data.increases, activeServiceFilter]);

  const filteredDecreases = useMemo(() => {
    if (!activeServiceFilter || activeServiceFilter === 'All') return data.decreases;
    return data.decreases.filter((x: CostDriverItem) => x?.name?.toLowerCase?.().includes(activeServiceFilter.toLowerCase()));
  }, [data.decreases, activeServiceFilter]);

  const onSelectDriver = useCallback((driver: CostDriverItem, driverType: DriverType) => {
    setSelectedDriver({ ...driver, _driverType: driverType });
  }, []);

  const onBack = useCallback(() => setSelectedDriver(null), []);

  const details = useDriverDetails({
    api,
    caps,
    driver: selectedDriver,
    period,
  });

  return (
    <CostDriversView
      api={api}
      caps={caps}
      filters={filters}
      isMasked={isMasked}
      period={period}
      setPeriod={setPeriod}
      dimension={dimension}
      minChange={minChange}
      selectedDriver={selectedDriver}
      setSelectedDriver={setSelectedDriver}
      sortListBy={sortListBy}
      setSortListBy={setSortListBy}
      activeServiceFilter={activeServiceFilter}
      setActiveServiceFilter={setActiveServiceFilter}
      showTreeMap={showTreeMap}
      setShowTreeMap={setShowTreeMap}
      onSelectDriver={onSelectDriver}
      onBack={onBack}
      filteredIncreases={filteredIncreases}
      filteredDecreases={filteredDecreases}
      details={details}
      {...data}
    />
  );
}
