import React, { useCallback, useState } from 'react';
import { useDebounce } from '../../../hooks/useDebounce';

import { useClientCCostDriversData } from './hooks/useClientCCostDriversData';
import { useClientCDriverDetails } from './hooks/useClientCDriverDetails';
import { ClientCCostDriversView } from './ClientCCostDriversView';
import type {
  ClientCCostDriversProps,
  CostDriverItem,
  DriverType,
  SortListBy,
} from './types';

export default function ClientCCostDrivers({ api, caps }: ClientCCostDriversProps) {
  // Only period state needed
  const [period, setPeriod] = useState(30);
  const [dimension] = useState('ServiceName');
  const [minChange] = useState(0);
  const [selectedDriver, setSelectedDriver] = useState<CostDriverItem | null>(null);
  const [sortListBy, setSortListBy] = useState<SortListBy>('diff');
  const [showTreeMap, setShowTreeMap] = useState(false);

  // Debounce the parameters
  const debouncedPeriod = useDebounce(period, 400);
  const debouncedDimension = useDebounce(dimension, 400);
  const debouncedMinChange = useDebounce(minChange, 400);

  const data = useClientCCostDriversData({
    api,
    caps,
    period,
    dimension,
    minChange,
    debouncedPeriod,
    debouncedDimension,
    debouncedMinChange,
  });

  // No filtering needed - show all data
  const filteredIncreases = data.increases;
  const filteredDecreases = data.decreases;

  const onSelectDriver = useCallback((driver: CostDriverItem, driverType: DriverType) => {
    setSelectedDriver({ ...driver, _driverType: driverType });
  }, []);

  const onBack = useCallback(() => setSelectedDriver(null), []);

  const details = useClientCDriverDetails({
    api,
    caps,
    driver: selectedDriver,
    period,
  });

  return (
    <ClientCCostDriversView
      api={api}
      caps={caps}
      period={period}
      setPeriod={setPeriod}
      dimension={dimension}
      minChange={minChange}
      selectedDriver={selectedDriver}
      setSelectedDriver={setSelectedDriver}
      sortListBy={sortListBy}
      setSortListBy={setSortListBy}
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

