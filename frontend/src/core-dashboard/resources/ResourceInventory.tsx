import React, { useState } from 'react';
import { useAuthStore } from '../../store/Authstore';

import { useResourceInventoryData } from './hooks/useResourceInventoryData';
import { useFilteredResources } from './hooks/useFilteredResources';
import { useGroupedResources } from './hooks/useGroupedResources';
import { useFlaggedResources } from './hooks/useFlaggedResources';

import { exportResourceInventoryCSV } from './utils/csv';

import ResourceInventoryView from './ResourceInventoryView';

const ResourceInventory = ({ filters, api, caps }) => {
  const { user } = useAuthStore();

  // ⚠️ Your original code uses inverted naming.
  // If you want: isPremium = user?.is_premium === true
  // If you want: mask when NOT premium:
  const isPremiumMasked = !user?.is_premium;

  if (!api || !caps || !caps.modules?.resources?.enabled) return null;

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [grouping, setGrouping] = useState('none');
  const [selectedResource, setSelectedResource] = useState(null);

  const { flaggedResources, toggleFlag } = useFlaggedResources();

  const { loading, inventory, stats } = useResourceInventoryData({ filters, api, caps });

  const filteredData = useFilteredResources({
    inventory,
    searchTerm,
    activeTab,
  });

  const groupedData = useGroupedResources({
    filteredData,
    grouping,
  });

  const onExportCSV = () =>
    exportResourceInventoryCSV({ activeTab, filteredData, flaggedResources });

  return (
    <ResourceInventoryView
      loading={loading}
      isPremiumMasked={isPremiumMasked}
      searchTerm={searchTerm}
      activeTab={activeTab}
      grouping={grouping}
      selectedResource={selectedResource}
      stats={stats}
      filteredData={filteredData}
      groupedData={groupedData}
      inventory={inventory}
      flaggedResources={flaggedResources}
      onExportCSV={onExportCSV}
      setSearchTerm={setSearchTerm}
      setActiveTab={setActiveTab}
      setGrouping={setGrouping}
      setSelectedResource={setSelectedResource}
      onToggleFlag={toggleFlag}
    />
  );
};

export default ResourceInventory;
