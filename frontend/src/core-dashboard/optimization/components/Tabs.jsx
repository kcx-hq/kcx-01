import React from "react";

export function Tabs({ activeTab, onChange, tabs }) {
  return (
    <div className="flex gap-2 overflow-x-auto rounded-xl border border-[var(--border-light)] bg-white p-2">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-xs font-bold transition-all ${
            activeTab === tab.id
              ? "border border-emerald-200 bg-emerald-50 text-[var(--brand-primary)]"
              : "text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-secondary)]"
          }`}
        >
          <tab.icon size={16} />
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );
}

export default Tabs;
