import PremiumGate from "../common/PremiumGate";
import { ShieldCheck } from "lucide-react";
import { DataQualityStates } from "./components/DataQualityStates";
import ScoreCard from "./components/ScoreCard";
import { ComplianceMatrix } from "./components/ComplianceMatrix";
import ActionBar from "./components/ActionBar";
import Tabs from "./components/Tabs";
import IssuesTable from "./components/IssuesTable";
import PaginationBar from "./components/PaginationBar";
import IssueInspector from "./components/IssueInspector";

const DataQualityView = ({
  loading,
  stats,
  activeTab,
  currentPage,
  totalPages,
  actualTotalPages,
  accessiblePages,
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
    <div className="core-shell animate-in fade-in duration-500">
      <div className="core-panel">
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-2">
            <ShieldCheck size={18} className="text-[var(--brand-primary)]" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight md:text-xl">Data Quality</h1>
            <p className="text-xs text-[var(--text-muted)] md:text-sm">
              Validate billing integrity, metadata coverage, and anomaly risks.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
        <ScoreCard stats={stats} />
        <ComplianceMatrix stats={stats} />
      </div>

      <ActionBar stats={stats} />

      <div className="relative flex h-[62vh] min-h-[420px] flex-col overflow-hidden rounded-xl border border-[var(--border-light)] bg-white md:h-[560px]">
        <Tabs
          stats={stats}
          activeTab={activeTab}
          onTabChange={onTabChange}
          isLocked={isLocked}
        />

        <div className="dq-scrollbar relative flex-1 overflow-auto">
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

      <style>{`
        .dq-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #9fb8af transparent;
        }
        .dq-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .dq-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .dq-scrollbar::-webkit-scrollbar-thumb {
          background-color: #b7cbc4;
          border-radius: 999px;
        }
        .dq-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #8da89e;
        }
      `}</style>
    </div>
  );
};

export default DataQualityView;

