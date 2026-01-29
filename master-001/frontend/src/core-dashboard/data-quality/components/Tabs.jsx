import { Crown } from "lucide-react";

const Tabs = ({ stats, activeTab, onTabChange, isLocked }) => {
  const tabs = [
    { id: "overview", label: "All Records", premium: false },
    { id: "untagged", label: `Untagged (${stats?.buckets?.untagged?.length || 0})`, premium: true },
    { id: "missingMeta", label: `Broken Metadata (${stats?.buckets?.missingMeta?.length || 0})`, premium: true },
    { id: "anomalies", label: `Zero Cost (${stats?.buckets?.anomalies?.length || 0})`, premium: true },
  ];

  return (
    <div className="p-4 border-b border-white/10 flex gap-2 bg-[#25262b] overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === tab.id
              ? "bg-[#a02ff1] text-white"
              : "text-gray-400 hover:text-white hover:bg-white/5"
          }`}
        >
          {tab.label}
          {isLocked && tab.premium && <Crown size={12} className="text-yellow-400" />}
        </button>
      ))}
    </div>
  );
};

export default Tabs;
