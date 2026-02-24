 const Panel = ({ title, children }) => (
  <div className="rounded-2xl border border-slate-200 bg-[#f3f7f5] shadow-2xl overflow-hidden">
    <div className="px-4 py-3 border-b border-slate-200 bg-emerald-50">
      <div className="text-xs font-extrabold tracking-wide text-gray-200">
        {title}
      </div>
    </div>
    <div className="p-4">{children}</div>
  </div>
);

export default Panel