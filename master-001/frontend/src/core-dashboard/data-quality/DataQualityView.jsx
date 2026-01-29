import PremiumGate from "../common/PremiumGate.jsx"; // reuse same component from overview (or copy here)
import DataQualityStates from "./components/DataQualityStates.jsx";
import ScoreCard from "./components/ScoreCard.jsx";
import ComplianceMatrix from "./components/ComplianceMatrix.jsx";
import ActionBar from "./components/ActionBar.jsx";
import Tabs from "./components/Tabs.jsx";
import IssuesTable from "./components/IssuesTable.jsx";
import PaginationBar from "./components/PaginationBar.jsx";
import IssueInspector from "./components/IssueInspector.jsx";

const DataQualityView = ({
  loading,
  stats,

  activeTab,
  currentPage,
  totalPages,
  actualTotalPages,
  accessiblePages,
  itemsPerPage,

  selectedIssue,
  setSelectedIssue,

  isLocked,
  isAccessingPremiumPage,
  currentListData,

  onTabChange,
  onRowClick,
  onPrev,
  onNext,
  maxAllowedPage,
}) => {
  if (loading) return <DataQualityStates type="loading" />;

  if (!stats) return <DataQualityStates type="empty" />;

  const isPremiumTab =
    activeTab === "untagged" ||
    activeTab === "anomalies" ||
    activeTab === "missingMeta";

  const shouldShowGate =
    isLocked &&
    (isPremiumTab || (isAccessingPremiumPage && activeTab === "overview"));

  return (
    <div className="p-6 space-y-6 min-h-screen bg-[#0f0f11] text-white font-sans animate-in fade-in duration-500 relative">
      {/* HEADER ROW */}
      <div className="flex flex-col lg:flex-row gap-6">
        <ScoreCard stats={stats} />
        <ComplianceMatrix stats={stats} />
      </div>

      {/* ACTION BAR */}
      <ActionBar stats={stats} />

      {/* MAIN TABLE */}
      <div className="bg-[#1a1b20] border border-white/10 rounded-xl flex flex-col h-[550px] relative">
        <Tabs
          stats={stats}
          activeTab={activeTab}
          onTabChange={onTabChange}
          isLocked={isLocked}
        />

        <div className="flex-1 overflow-auto relative">
          {shouldShowGate ? (
            <PremiumGate mode="wrap">
             
              <IssuesTable
                rows={currentListData}
                activeTab={activeTab}
                isLocked={isLocked}
                isAccessingPremiumPage={isAccessingPremiumPage}
                onRowClick={onRowClick}
              />
              <PaginationBar
                currentPage={currentPage}
                totalPages={totalPages}
                actualTotalPages={actualTotalPages}
                accessiblePages={accessiblePages}
                isLocked={isLocked}
                maxAllowedPage={maxAllowedPage}
                onPrev={onPrev}
                onNext={onNext}
              />
            </PremiumGate>
          ) : (
            <>
              <IssuesTable
                rows={currentListData}
                activeTab={activeTab}
                isLocked={isLocked}
                isAccessingPremiumPage={isAccessingPremiumPage}
                onRowClick={onRowClick}
              />
              <PaginationBar
                currentPage={currentPage}
                totalPages={totalPages}
                actualTotalPages={actualTotalPages}
                accessiblePages={accessiblePages}
                isLocked={isLocked}
                maxAllowedPage={maxAllowedPage}
                onPrev={onPrev}
                onNext={onNext}
              />
            </>
          )}
        </div>

      
      </div>

      <IssueInspector
        selectedIssue={selectedIssue}
        setSelectedIssue={setSelectedIssue}
      />
    </div>
  );
};

export default DataQualityView;
