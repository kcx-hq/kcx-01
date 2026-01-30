import React, { useState, useMemo, useCallback } from "react";
import { useAuthStore } from "../../store/Authstore";
import DataQualityView from "./DataQualityView.jsx";
import { useDataQuality } from "./hooks/useDataQuality.js";

const DataQuality = ({ filters, api, caps }) => {
  const { user } = useAuthStore();

  // LOCK when NOT premium (same behavior as your original: isPremium = !is_premium)
  const isLocked = !user?.is_premium;

  // Do not render if module not enabled / api missing
  if (!api || !caps || !caps.modules?.dataQuality?.enabled) return null;

  const [activeTab, setActiveTab] = useState("overview");
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 20;
  const maxAllowedPage = 3;

  const { loading, stats } = useDataQuality({ filters, api, caps });

  const actualTotalPages = useMemo(() => {
    if (!stats) return 0;
    const list =
      activeTab === "overview"
        ? stats.buckets?.all || []
        : stats.buckets?.[activeTab] || [];
    return Math.ceil(list.length / itemsPerPage);
  }, [stats, activeTab]);

  // Your exact rule: free users only 2 pages accessible, premium unlimited
  const accessiblePages = isLocked ? 2 : actualTotalPages;
  const totalPages = isLocked ? Math.min(actualTotalPages, 2) : actualTotalPages;

  const currentListData = useMemo(() => {
    if (!stats) return [];

    const list =
      activeTab === "overview"
        ? stats.buckets?.all || []
        : stats.buckets?.[activeTab] || [];

    if (isLocked) {
      // free users: only first 40 items (2 pages)
      const limited = list.slice(0, 2 * itemsPerPage);
      const start = (currentPage - 1) * itemsPerPage;
      return limited.slice(start, start + itemsPerPage);
    }

    // premium users: full list
    const start = (currentPage - 1) * itemsPerPage;
    return list.slice(start, start + itemsPerPage);
  }, [stats, activeTab, currentPage, isLocked]);

  // free users can go to page 3 only to show overlay (but don't go > 3)
  const isAccessingPremiumPage = isLocked && currentPage === maxAllowedPage;

  // ensure page never exceeds 3 for free users
  React.useEffect(() => {
    if (isLocked && currentPage > maxAllowedPage) setCurrentPage(maxAllowedPage);
  }, [currentPage, isLocked]);

  const onTabChange = useCallback((tabId) => {
    setActiveTab(tabId);
    setCurrentPage(1);
    setSelectedIssue(null);
  }, []);

  const onRowClick = useCallback(
    (row) => {
      // Disable clicking on premium tabs or premium page 3 (same as original)
      const isPremiumTab =
        activeTab === "untagged" ||
        activeTab === "anomalies" ||
        activeTab === "missingMeta";

      if (isPremiumTab || (isAccessingPremiumPage && activeTab === "overview")) return;
      setSelectedIssue(row);
    },
    [activeTab, isAccessingPremiumPage]
  );

  const onPrev = useCallback(() => {
    setCurrentPage((p) => Math.max(1, p - 1));
  }, []);

  const onNext = useCallback(() => {
    if (isLocked) {
      // free users: try to go page 3 for overlay; don't exceed 3
      if (currentPage >= accessiblePages) {
        setCurrentPage(Math.min(accessiblePages + 1, maxAllowedPage));
      } else {
        setCurrentPage((p) => Math.min(accessiblePages, p + 1));
      }
      return;
    }
    setCurrentPage((p) => Math.min(totalPages, p + 1));
  }, [isLocked, currentPage, accessiblePages, totalPages]);

  return (
    <DataQualityView
      // state
      loading={loading}
      stats={stats}
      activeTab={activeTab}
      currentPage={currentPage}
      totalPages={totalPages}
      actualTotalPages={actualTotalPages}
      accessiblePages={accessiblePages}
      itemsPerPage={itemsPerPage}
      selectedIssue={selectedIssue}
      isLocked={isLocked}
      isAccessingPremiumPage={isAccessingPremiumPage}
      currentListData={currentListData}
      // actions
      onTabChange={onTabChange}
      setSelectedIssue={setSelectedIssue}
      onRowClick={onRowClick}
      onPrev={onPrev}
      onNext={onNext}
      // gate helpers
      maxAllowedPage={maxAllowedPage}
    />
  );
};

export default DataQuality;
