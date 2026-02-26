import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { DataQualityStates } from "./components/DataQualityStates";
import type { DataQualityStats, GovernanceModel } from "./types";
import {
  CostBasisConsistencyPanel,
  DenominatorQualityPanel,
  GovernanceRunbookPanel,
  IngestionReliabilityPanel,
  OverviewControlPanel,
  OwnershipAllocationPanel,
  PolicyCompliancePanel,
  SharedPoolIntegrityPanel,
  TagMetadataPanel,
  TopRisksPanel,
} from "./components/governance";
import { formatDateTime } from "./utils/governance.format";

interface DataQualityViewProps {
  loading: boolean;
  stats: DataQualityStats | null;
  filters?: {
    provider?: string;
    service?: string;
    region?: string;
  };
}

type GovernanceTab = "governance" | "data-quality";

const EMPTY_GOVERNANCE: GovernanceModel | null = null;
const filterLabel = (value?: string): string => (!value || value === "All" ? "All" : value);

const DataQualityView = ({ loading, stats, filters }: DataQualityViewProps) => {
  const [activeTab, setActiveTab] = useState<GovernanceTab>("governance");

  if (loading) return <DataQualityStates type="loading" />;
  if (!stats) return <DataQualityStates type="empty" />;

  const governance = (stats.governance || EMPTY_GOVERNANCE) as GovernanceModel | null;
  if (!governance) {
    return (
      <div className="space-y-4">
        <DataQualityStates type="empty" />
      </div>
    );
  }

  const sections = governance.informationArchitecture?.sections || [];
  const userFlow = governance.informationArchitecture?.userFlow || [];

  return (
    <div className="core-shell animate-in fade-in duration-500 space-y-4">
      <div className="core-panel">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-2">
              <ShieldCheck size={18} className="text-[var(--brand-primary)]" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight md:text-xl">Governance & Data Quality</h1>
              <p className="text-xs text-[var(--text-muted)] md:text-sm">
                Control layer for trust, compliance, allocation integrity, and unit-metric reliability.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <ScopeChip label={`Provider: ${filterLabel(filters?.provider)}`} />
            <ScopeChip label={`Service: ${filterLabel(filters?.service)}`} />
            <ScopeChip label={`Region: ${filterLabel(filters?.region)}`} />
            <ScopeChip label={`Version: ${governance.formulaVersion}`} />
            <ScopeChip label={`Generated: ${formatDateTime(governance.generatedAt)}`} />
          </div>
        </div>
      </div>

      <section className="rounded-2xl border border-[var(--border-light)] bg-white p-3 md:p-4">
        <div className="flex flex-wrap gap-2">
          <TabButton
            active={activeTab === "governance"}
            label="Governance"
            onClick={() => setActiveTab("governance")}
          />
          <TabButton
            active={activeTab === "data-quality"}
            label="Data Quality"
            onClick={() => setActiveTab("data-quality")}
          />
        </div>
      </section>

      {activeTab === "governance" ? (
        <>
          <OverviewControlPanel governance={governance} />
          <TopRisksPanel governance={governance} />

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <OwnershipAllocationPanel governance={governance} />
            <SharedPoolIntegrityPanel governance={governance} />
          </div>

          <PolicyCompliancePanel governance={governance} />
          <GovernanceRunbookPanel governance={governance} />
        </>
      ) : (
        <>
          <TagMetadataPanel governance={governance} />

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <IngestionReliabilityPanel governance={governance} />
            <CostBasisConsistencyPanel governance={governance} />
          </div>

          <DenominatorQualityPanel governance={governance} />

          <section className="rounded-2xl border border-[var(--border-light)] bg-white p-4 md:p-5">
            <h2 className="text-sm font-black uppercase tracking-[0.12em] text-[var(--text-primary)] md:text-base">
              Section Flow
            </h2>
            <div className="mt-3 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <div className="rounded-xl border border-slate-200 p-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">
                  Information architecture
                </p>
                <ol className="mt-2 list-decimal space-y-1 pl-4 text-sm text-slate-700">
                  {sections.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ol>
              </div>
              <div className="rounded-xl border border-slate-200 p-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">
                  Root-cause navigation path
                </p>
                <ol className="mt-2 list-decimal space-y-1 pl-4 text-sm text-slate-700">
                  {userFlow.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ol>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
};

function TabButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] transition ${
        active
          ? "border-emerald-400 bg-emerald-100 text-emerald-800"
          : "border-slate-200 bg-slate-50 text-slate-600 hover:border-emerald-200 hover:text-emerald-700"
      }`}
    >
      {label}
    </button>
  );
}

function ScopeChip({ label }: { label: string }) {
  return (
    <span className="inline-flex rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800">
      {label}
    </span>
  );
}

export default DataQualityView;
