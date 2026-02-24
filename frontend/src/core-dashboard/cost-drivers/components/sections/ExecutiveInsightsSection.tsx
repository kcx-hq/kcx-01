import React, { useMemo } from 'react';

const tone = {
  high: 'border-rose-200 bg-rose-50',
  medium: 'border-amber-200 bg-amber-50',
  low: 'border-emerald-200 bg-emerald-50',
};

export default function ExecutiveInsightsSection({
  executiveInsights,
  onOpenDetail,
}) {
  const bullets = useMemo(() => {
    const raw = Array.isArray(executiveInsights?.bullets) ? executiveInsights.bullets : [];
    const seen = new Set();
    const out = [];
    for (const bullet of raw) {
      const key = `${bullet?.id || ''}::${bullet?.title || ''}::${bullet?.detail || ''}`.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(bullet);
    }
    return out;
  }, [executiveInsights]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-black uppercase tracking-wider text-slate-800">Executive Insights</h3>
      {bullets.length ? (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {bullets.map((bullet) => (
            <article
              key={bullet.id}
              className={[
                'rounded-xl border p-3',
                tone[bullet.severity] || tone.low,
              ].join(' ')}
            >
              <p className="text-xs font-black uppercase tracking-wider text-slate-700">{bullet.title}</p>
              <p className="mt-1 text-sm font-semibold text-slate-700">{bullet.detail}</p>
              {bullet?.evidencePayload?.driverKey ? (
                <button
                  type="button"
                  onClick={() =>
                    onOpenDetail({
                      key: bullet.evidencePayload.driverKey,
                      name: bullet.evidencePayload.driverKey,
                      dimension: bullet.evidencePayload.dimension || 'service',
                    })
                  }
                  className="mt-2 rounded-md border border-slate-300 bg-white px-2 py-1 text-[10px] font-black uppercase tracking-wider text-slate-700 hover:border-emerald-200 hover:text-emerald-700"
                >
                  View Evidence
                </button>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <p className="text-sm font-semibold text-slate-500">No executive insights available for selected scope.</p>
      )}
    </section>
  );
}
