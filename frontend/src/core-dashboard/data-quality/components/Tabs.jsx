import { Crown } from "lucide-react";

const Tabs = ({ stats, activeTab, onTabChange, isLocked }) => {
  const tabs = [
    { id: "overview", label: "All Records", premium: false },
    { id: "untagged", label: `Untagged (${stats?.buckets?.untagged?.length || 0})`, premium: true },
    { id: "missingMeta", label: `Broken Metadata (${stats?.buckets?.missingMeta?.length || 0})`, premium: true },
    { id: "anomalies", label: `Zero Cost (${stats?.buckets?.anomalies?.length || 0})`, premium: true },
  ];

  return (
    <div className="flex gap-2 overflow-x-auto border-b border-[var(--border-light)] bg-[var(--bg-surface)] p-3 md:p-4">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-4 py-2 text-xs font-bold transition-all ${
            activeTab === tab.id
              ? "bg-white text-[var(--brand-primary)] shadow-sm"
              : "text-[var(--text-muted)] hover:bg-white hover:text-[var(--text-secondary)]"
          }`}
        >
          {tab.label}
          {isLocked && tab.premium && <Crown size={12} className="text-amber-500" />}
        </button>
      ))}
    </div>
  );
};

export default Tabs;

