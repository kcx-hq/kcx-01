import React from "react";

export function Tabs({ activeTab, onChange, tabs }) {
  return (
    <div className="flex gap-2 border-b border-white/5">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
            activeTab === tab.id
              ? "border-[#a02ff1] text-[#a02ff1]"
              : "border-transparent text-gray-400 hover:text-white"
          }`}
        >
          <tab.icon size={16} />
          <span className="text-sm font-medium">{tab.label}</span>
        </button>
      ))}
    </div>
  );
}
