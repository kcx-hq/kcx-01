import { formatCurrency } from "../utils/format.js";

const ActionBar = ({ stats }) => {
  return (
    <div className="flex justify-between items-center bg-[#1a1b20] p-3 rounded-xl border border-white/10">
      <div className="flex gap-4 items-center px-2">
        <div className="flex flex-col">
          <span className="text-[10px] text-gray-500 uppercase font-bold">Cost at Risk</span>
          <span className="text-lg font-bold text-red-400">
            {formatCurrency(stats?.costAtRisk || 0)}
          </span>
        </div>

        <div className="w-px h-8 bg-white/10" />

        <div className="flex flex-col">
          <span className="text-[10px] text-gray-500 uppercase font-bold">Untagged Rows</span>
          <span className="text-lg font-bold text-white">
            {(stats?.buckets?.untagged?.length || 0).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ActionBar;
