import type { SplitBarProps } from "../types";

const SplitBar = ({ leftLabel, leftPct, rightLabel, rightPct }: SplitBarProps) => {
  const l = Math.max(0, Math.min(100, Number(leftPct || 0)));
  const r = Math.max(0, Math.min(100, Number(rightPct || 0)));

  return (
    <div className="rounded-2xl border border-white/10 bg-[#121319] p-4 shadow-2xl">
      <div className="flex items-center justify-between text-xs text-gray-300">
        <span className="font-semibold text-white">{leftLabel}</span>
        <span className="text-gray-400">{l.toFixed(2)}%</span>
      </div>

      <div className="mt-2 h-2 rounded-full bg-black/30 overflow-hidden border border-white/10">
        <div className="h-full bg-[#007758]/70" style={{ width: `${l}%` }} />
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-gray-300">
        <span className="font-semibold text-white">{rightLabel}</span>
        <span className="text-gray-400">{r.toFixed(2)}%</span>
      </div>
    </div>
  );
};

export default SplitBar
