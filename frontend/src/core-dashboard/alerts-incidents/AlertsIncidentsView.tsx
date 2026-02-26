import { AlertTriangle, Bell, ShieldAlert } from "lucide-react";
import { SectionEmpty, SectionError, SectionLoading, SectionRefreshOverlay } from "../common/SectionStates";
import type { AlertsIncidentsControls, AlertsIncidentsPayload, AlertRow } from "./types";
import { formatCurrency, formatDateTime, formatPercent } from "./utils/format";

interface AlertsIncidentsViewProps {
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  data: AlertsIncidentsPayload;
  controls: AlertsIncidentsControls;
  onControlsChange: (patch: Partial<AlertsIncidentsControls>) => void;
  filters: { provider?: string; service?: string; region?: string };
}

export default function AlertsIncidentsView({
  loading,
  refreshing,
  error,
  data,
  controls,
  onControlsChange,
  filters,
}: AlertsIncidentsViewProps) {
  if (loading) return <SectionLoading label="Building Alerts & Incidents..." />;
  if (error) return <SectionError message={error} />;
  if (!data?.controls) return <SectionEmpty message="No alerts data available." />;

  const currency = data.controls.currency || "USD";
  const alerts = Array.isArray(data.alerts) ? data.alerts : [];

  return (
    <div className="core-shell animate-in fade-in duration-300 space-y-4">
      <section className="core-panel">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-xl font-black text-[var(--text-primary)] md:text-2xl">
              <Bell size={22} className="text-[var(--brand-primary)]" />
              Alerts & Incidents
            </h1>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Unified anomaly-to-incident workflow with ownership routing and notification plan.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ScopeChip label={`Provider: ${filters.provider || "All"}`} />
            <ScopeChip label={`Service: ${filters.service || "All"}`} />
            <ScopeChip label={`Region: ${filters.region || "All"}`} />
          </div>
        </div>
      </section>

      <section className="relative rounded-2xl border border-[var(--border-light)] bg-white p-4 md:p-5">
        {refreshing ? <SectionRefreshOverlay rounded="rounded-2xl" label="Refreshing alerts..." /> : null}
        <h2 className="text-sm font-black uppercase tracking-[0.12em] text-[var(--text-primary)] md:text-base">
          Controls
        </h2>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <SelectField
            label="Period"
            value={controls.period}
            onChange={(value) => onControlsChange({ period: value as AlertsIncidentsControls["period"] })}
            options={[
              { value: "mtd", label: "MTD" },
              { value: "qtd", label: "QTD" },
              { value: "30d", label: "Last 30d" },
              { value: "90d", label: "Last 90d" },
            ]}
          />
          <SelectField
            label="Cost Basis"
            value={controls.costBasis}
            onChange={(value) =>
              onControlsChange({ costBasis: value as AlertsIncidentsControls["costBasis"] })
            }
            options={[
              { value: "actual", label: "Actual" },
              { value: "amortized", label: "Amortized" },
              { value: "net", label: "Net" },
            ]}
          />
          <SelectField
            label="Severity"
            value={controls.severity}
            onChange={(value) =>
              onControlsChange({ severity: value as AlertsIncidentsControls["severity"] })
            }
            options={[
              { value: "", label: "All" },
              { value: "critical", label: "Critical" },
              { value: "high", label: "High" },
              { value: "medium", label: "Medium" },
              { value: "low", label: "Low" },
            ]}
          />
          <SelectField
            label="Type"
            value={controls.type}
            onChange={(value) => onControlsChange({ type: value as AlertsIncidentsControls["type"] })}
            options={[
              { value: "", label: "All" },
              { value: "spend_anomaly", label: "Spend" },
              { value: "forecast_budget_risk", label: "Forecast/Budget" },
              { value: "governance_control", label: "Governance" },
              { value: "optimization_workflow", label: "Optimization" },
              { value: "commitment_risk", label: "Commitments" },
            ]}
          />
          <SelectField
            label="Status"
            value={controls.status}
            onChange={(value) =>
              onControlsChange({ status: value as AlertsIncidentsControls["status"] })
            }
            options={[
              { value: "", label: "All" },
              { value: "new", label: "New" },
              { value: "acknowledged", label: "Acknowledged" },
              { value: "in_progress", label: "In Progress" },
              { value: "mitigated", label: "Mitigated" },
              { value: "resolved", label: "Resolved" },
            ]}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border-light)] bg-white p-4 md:p-5">
        <h2 className="text-sm font-black uppercase tracking-[0.12em] text-[var(--text-primary)] md:text-base">
          Incident KPIs
        </h2>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <Metric label="Open Alerts" value={`${data.kpis.totalOpenAlerts}`} detail="Unresolved incidents" />
          <Metric label="Critical" value={`${data.kpis.criticalAlerts}`} detail="Immediate response required" />
          <Metric label="High" value={`${data.kpis.highAlerts}`} detail="Same-day action required" />
          <Metric label="SLA Breaches" value={`${data.kpis.unresolvedSlaBreaches}`} detail="Past due unresolved alerts" />
          <Metric label="Impacted Spend" value={formatCurrency(data.kpis.totalImpact, currency)} detail="Current open impact" />
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border-light)] bg-white p-4 md:p-5">
        <h2 className="text-sm font-black uppercase tracking-[0.12em] text-[var(--text-primary)] md:text-base">
          Alerts Inbox
        </h2>
        <AlertsTable rows={alerts} currency={currency} />
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <section className="rounded-2xl border border-[var(--border-light)] bg-white p-4 md:p-5">
          <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.12em] text-[var(--text-primary)] md:text-base">
            <ShieldAlert size={16} className="text-[var(--brand-primary)]" />
            Notification Queue
          </h2>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Metric label="Queued" value={`${data.notificationCenter.totalQueued}`} detail="Pending outbound notifications" />
            <Metric
              label="Routed Owners"
              value={`${data.notificationCenter.routedOwners || 0}`}
              detail="Distinct recipients in queue"
            />
          </div>
          <div className="mt-3 max-h-[260px] overflow-y-auto pr-1">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">
                <tr>
                  <th className="px-2 py-1.5">Alert</th>
                  <th className="px-2 py-1.5">Mode</th>
                  <th className="px-2 py-1.5">Channels</th>
                  <th className="px-2 py-1.5">Recipients</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.notificationCenter.queue.slice(0, 20).map((item) => (
                  <tr key={`${item.alertId}-${item.queuedAt}`}>
                    <td className="px-2 py-1.5 text-slate-700">{item.alertId}</td>
                    <td className="px-2 py-1.5 text-slate-700">{item.mode}</td>
                    <td className="px-2 py-1.5 text-slate-700">{item.channels.join(", ")}</td>
                    <td className="px-2 py-1.5 text-slate-700">{item.recipients.slice(0, 2).join(", ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--border-light)] bg-white p-4 md:p-5">
          <h2 className="text-sm font-black uppercase tracking-[0.12em] text-[var(--text-primary)] md:text-base">
            Embedded Alert Surfaces
          </h2>
          <div className="mt-3 space-y-2">
            {Object.entries(data.embeddedViews || {}).map(([moduleName, model]) => (
              <div key={moduleName} className="rounded-xl border border-slate-200 p-3">
                <p className="text-sm font-semibold capitalize text-slate-900">
                  {moduleName.replace(/([A-Z])/g, " $1")}
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  {model.count} alerts | top {Math.min(3, model.top?.length || 0)} shown in module context
                </p>
                <a href={model.deepLink} className="mt-1 inline-block text-xs font-semibold text-emerald-700">
                  Open module
                </a>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function ScopeChip({ label }: { label: string }) {
  return (
    <span className="inline-flex rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800">
      {label}
    </span>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold uppercase tracking-[0.1em] text-slate-500">
        {label}
      </span>
      <select
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none ring-emerald-300 focus:ring-2"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-black text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-600">{detail}</p>
    </div>
  );
}

function AlertsTable({ rows, currency }: { rows: AlertRow[]; currency: string }) {
  if (!rows.length) {
    return (
      <div className="mt-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
        No alerts for the selected filters.
      </div>
    );
  }

  return (
    <div className="mt-3 max-h-[420px] overflow-auto pr-1">
      <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
        <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">
          <tr>
            <th className="px-2 py-1.5">Severity</th>
            <th className="px-2 py-1.5">Type</th>
            <th className="px-2 py-1.5">Scope</th>
            <th className="px-2 py-1.5">Impact</th>
            <th className="px-2 py-1.5">Confidence</th>
            <th className="px-2 py-1.5">Owner</th>
            <th className="px-2 py-1.5">Detected</th>
            <th className="px-2 py-1.5">SLA Due</th>
            <th className="px-2 py-1.5">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr key={row.id}>
              <td className="px-2 py-1.5">
                <SeverityPill severity={row.severity} />
              </td>
              <td className="px-2 py-1.5 text-slate-700">{row.type}</td>
              <td className="px-2 py-1.5 text-slate-700">
                {row.scope.service} | {row.scope.region}
              </td>
              <td className="px-2 py-1.5 text-slate-700">
                {formatCurrency(row.impact.amount, currency)} ({formatPercent(row.impact.pct)})
              </td>
              <td className="px-2 py-1.5 text-slate-700">{row.confidence}</td>
              <td className="px-2 py-1.5 text-slate-700">{row.owner.primary}</td>
              <td className="px-2 py-1.5 text-slate-700">{formatDateTime(row.detectedAt)}</td>
              <td className="px-2 py-1.5 text-slate-700">{formatDateTime(row.dueAt)}</td>
              <td className="px-2 py-1.5">
                <a href={row.deepLink} className="text-xs font-semibold text-emerald-700">
                  Open source
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SeverityPill({ severity }: { severity: AlertRow["severity"] }) {
  const cls =
    severity === "critical"
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : severity === "high"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : severity === "medium"
          ? "border-cyan-200 bg-cyan-50 text-cyan-700"
          : "border-emerald-200 bg-emerald-50 text-emerald-700";
  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${cls}`}>
      {severity}
    </span>
  );
}

