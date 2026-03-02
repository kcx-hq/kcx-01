import { AlertTriangle, CheckCircle2, ShieldCheck, XCircle } from "lucide-react";
import type { ConfidenceModel, ForecastChecklistItem } from "../../types";
import { SectionPanel, StatusPill } from "../shared/ui";

interface ConfidenceGatingSectionProps {
  confidence: ConfidenceModel;
  checklist?: ForecastChecklistItem[];
}

const statusIcon = (status: "pass" | "warn" | "fail") => {
  if (status === "pass") return <CheckCircle2 size={14} className="text-emerald-600" />;
  if (status === "warn") return <AlertTriangle size={14} className="text-amber-600" />;
  return <XCircle size={14} className="text-rose-600" />;
};

export function ConfidenceGatingSection({ confidence, checklist = [] }: ConfidenceGatingSectionProps) {
  const gates: ForecastChecklistItem[] = checklist.length
    ? checklist
    : (confidence.gates || []).slice(0, 4).map((gate) => ({
        id: gate.id,
        label: gate.label,
        status: gate.status,
        value: gate.value,
        valueLabel: gate.value.toFixed(2),
        threshold: gate.threshold,
        detail: gate.consequence,
      }));

  const passCount = gates.filter((gate) => gate.status === "pass").length;
  const warnCount = gates.filter((gate) => gate.status === "warn").length;
  const failCount = gates.filter((gate) => gate.status === "fail").length;

  return (
    <SectionPanel title="Confidence Gates">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <ShieldCheck size={15} className="text-[var(--brand-primary)]" />
          Why confidence is {confidence.forecastConfidence.level.toUpperCase()}
        </p>
        <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.08em]">
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-emerald-700">
            Pass {passCount}
          </span>
          <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-amber-700">
            Warn {warnCount}
          </span>
          <span className="rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-rose-700">
            Fail {failCount}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        {gates.map((gate) => (
          <article
            key={gate.id}
            className={`rounded-xl border p-3 ${
              gate.status === "pass"
                ? "border-emerald-200 bg-emerald-50/60"
                : gate.status === "warn"
                  ? "border-amber-200 bg-amber-50/60"
                  : "border-rose-200 bg-rose-50/60"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                {statusIcon(gate.status)}
                <p className="text-sm font-semibold text-slate-900">{gate.label}</p>
              </div>
              <StatusPill status={gate.status} />
            </div>
            <p className="mt-2 text-lg font-black text-slate-900">{gate.valueLabel}</p>
            <p className="mt-1 text-xs text-slate-700">Threshold: {gate.threshold}</p>
            <p className="mt-1 text-xs text-slate-600">{gate.detail}</p>
          </article>
        ))}
      </div>
    </SectionPanel>
  );
}

