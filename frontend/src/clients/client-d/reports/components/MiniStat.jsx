const MiniStat = ({ label, value, icon: Icon }) => (
  <div className="rounded-2xl border border-slate-200 bg-[#f3f7f5] p-4 shadow-2xl">
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
          {label}
        </div>
        <div className="text-lg font-extrabold text-slate-800 mt-1 truncate">
          {value}
        </div>
      </div>
      <div className="h-10 w-10 rounded-xl bg-white/5 border border-slate-200 flex items-center justify-center shrink-0">
        <Icon size={18} className="text-[#1EA88A]" />
      </div>
    </div>
  </div>
);

export default MiniStat 