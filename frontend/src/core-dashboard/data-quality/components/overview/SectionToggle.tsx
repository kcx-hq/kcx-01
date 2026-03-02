import type { SectionView } from "./overview.models";

interface SectionToggleProps {
  activeSection: SectionView;
  onChange: (section: SectionView) => void;
}

const sectionButtonClass = (isActive: boolean) =>
  `rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] transition ${
    isActive
      ? "border-emerald-400 bg-emerald-100 text-emerald-800"
      : "border-slate-200 bg-slate-50 text-slate-600 hover:border-emerald-200 hover:text-emerald-700"
  }`;

export const SectionToggle = ({ activeSection, onChange }: SectionToggleProps) => (
  <section className="rounded-2xl border border-slate-200 bg-white p-3 md:p-4">
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => onChange("governance")}
        className={sectionButtonClass(activeSection === "governance")}
        aria-pressed={activeSection === "governance"}
      >
        Governance
      </button>
      <button
        type="button"
        onClick={() => onChange("data-quality")}
        className={sectionButtonClass(activeSection === "data-quality")}
        aria-pressed={activeSection === "data-quality"}
      >
        Data Quality
      </button>
    </div>
  </section>
);
