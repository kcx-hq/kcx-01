import { LineChart } from "lucide-react";
import type { ForecastingControls } from "../../types";
import { ScopeChip } from "../shared/ui";

interface HeaderSectionProps {
  controls: ForecastingControls;
  filters: { provider?: string; service?: string; region?: string };
  executiveSentence: string;
}

export function HeaderSection({ controls, filters, executiveSentence }: HeaderSectionProps) {
  return (
    <>
      <section className="core-panel">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-xl font-black text-[var(--text-primary)] md:text-2xl">
              <LineChart size={22} className="text-[var(--brand-primary)]" />
              Forecasting & Budgets
            </h1>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Planning and control outputs on final allocated cost with governance-gated confidence.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ScopeChip label={`Provider: ${filters.provider || "All"}`} />
            <ScopeChip label={`Service: ${filters.service || "All"}`} />
            <ScopeChip label={`Region: ${filters.region || "All"}`} />
            <ScopeChip label={`Basis: ${controls.costBasis.toUpperCase()}`} />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4">
        <p className="text-sm font-semibold text-emerald-800">{executiveSentence}</p>
      </section>
    </>
  );
}

