import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useAuthStore } from "../../../store/Authstore";
import DataQualityView from "./DataQualityView";
import { useDataQuality } from "./hooks/useDataQuality";

const DataQuality = ({ filters, api, caps }) => {
  const { user } = useAuthStore();
  const isLocked = !user?.is_premium;

  if (!api || !caps || !caps.modules?.dataQuality?.enabled) return null;

  const [activeTab, setActiveTab] = useState("overview");
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 20;
  const maxAllowedPage = 3;

  const { loading, stats, error } = useDataQuality({ filters, api, caps });

  // list for tabs
  const activeList = useMemo(() => {
    if (!stats) return [];
    if (activeTab === "overview") return stats?.buckets?.all || [];
    return stats?.buckets?.[activeTab] || [];
  }, [stats, activeTab]);

  const actualTotalPages = useMemo(() => {
    return Math.ceil((activeList?.length || 0) / itemsPerPage) || 0;
  }, [activeList, itemsPerPage]);

  // free users: only 2 pages accessible; page 3 is "overlay"
  const accessiblePages = isLocked ? Math.min(2, actualTotalPages) : actualTotalPages;
  const totalPages = accessiblePages;

  const currentListData = useMemo(() => {
    const list = activeList || [];

    if (isLocked) {
      const limited = list.slice(0, 2 * itemsPerPage);
      const start = (currentPage - 1) * itemsPerPage;
      return limited.slice(start, start + itemsPerPage);
    }

    const start = (currentPage - 1) * itemsPerPage;
    return list.slice(start, start + itemsPerPage);
  }, [activeList, currentPage, isLocked, itemsPerPage]);

  const isAccessingPremiumPage = isLocked && currentPage === maxAllowedPage;

  useEffect(() => {
    if (isLocked && currentPage > maxAllowedPage) setCurrentPage(maxAllowedPage);
  }, [currentPage, isLocked]);

  const onTabChange = useCallback((tabId) => {
    setActiveTab(tabId);
    setCurrentPage(1);
    setSelectedIssue(null);
  }, []);

  const onRowClick = useCallback(
    (row) => {
      const isPremiumTab =
        activeTab === "untagged" ||
        activeTab === "anomalies" ||
        activeTab === "missingMeta";

      if (isPremiumTab || (isAccessingPremiumPage && activeTab === "overview")) return;
      setSelectedIssue(row);
    },
    [activeTab, isAccessingPremiumPage]
  );

  const onPrev = useCallback(() => setCurrentPage((p) => Math.max(1, p - 1)), []);

  const onNext = useCallback(() => {
    if (isLocked) {
      if (currentPage >= accessiblePages) {
        setCurrentPage(Math.min(accessiblePages + 1, maxAllowedPage)); // go to overlay page 3
      } else {
        setCurrentPage((p) => Math.min(accessiblePages, p + 1));
      }
      return;
    }
    setCurrentPage((p) => Math.min(totalPages, p + 1));
  }, [isLocked, currentPage, accessiblePages, totalPages]);

  return (
    <DataQualityView
      loading={loading}
      error={error}
      stats={stats}
      activeTab={activeTab}
      currentPage={currentPage}
      totalPages={totalPages}
      actualTotalPages={actualTotalPages}
      accessiblePages={accessiblePages}
      itemsPerPage={itemsPerPage}
      selectedIssue={selectedIssue}
      setSelectedIssue={setSelectedIssue}
      isLocked={isLocked}
      isAccessingPremiumPage={isAccessingPremiumPage}
      currentListData={currentListData}
      onTabChange={onTabChange}
      onRowClick={onRowClick}
      onPrev={onPrev}
      onNext={onNext}
      maxAllowedPage={maxAllowedPage}
    />
  );
};

export default DataQuality;
