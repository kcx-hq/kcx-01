import { formatCurrency } from "../../../../core-dashboard/accounts-ownership/utils/format";
const BarRow = ({ name, value, percentage }) => {
  const pct = Math.max(0, Math.min(100, Number(percentage || 0)));
  return (
    <div className="rounded-xl bg-white/5 border border-slate-200 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-800 truncate">{name}</div>
          <div className="text-xs text-gray-500 mt-0.5">{formatCurrency(value || 0)}</div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-sm font-extrabold text-slate-800">{pct.toFixed(2)}%</div>
          <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">share</div>
        </div>
      </div>

      <div className="mt-2 h-2 rounded-full bg-white/90 overflow-hidden border border-slate-200">
        <div className="h-full bg-[#1EA88A]/70" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};
export default BarRow