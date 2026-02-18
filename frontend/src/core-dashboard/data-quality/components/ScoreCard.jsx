import { getScoreBg, getScoreColor } from "../utils/format.js";

const ScoreCard = ({ stats }) => {
  const score = stats?.score ?? 100;
  const trend = Array.isArray(stats?.trendData) ? stats.trendData : [];

  return (
    <div
      className={`relative flex flex-1 flex-col justify-center overflow-hidden rounded-2xl border p-5 md:p-6 ${getScoreBg(
        score
      )}`}
    >
      <div className="z-10">
        <div className="mb-2 flex items-start justify-between">
          <p className="text-xs font-bold uppercase text-[var(--text-muted)]">Data Health Score</p>
          <div
            className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase bg-white/70 ${getScoreColor(
              score
            )}`}
          >
            {score >= 90 ? "Excellent" : score >= 70 ? "Fair" : "Critical"}
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className={`text-5xl font-black ${getScoreColor(score)}`}>{score}</span>
          <span className="text-sm text-[var(--text-muted)]">/ 100</span>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-0 right-0 h-16 w-32 opacity-30">
        <svg className="h-full w-full" viewBox="0 0 100 50" preserveAspectRatio="none">
          <polyline
            points={
              trend.length > 1
                ? trend
                    .map((d, i) => `${(i / (trend.length - 1)) * 100},${100 - d.score}`)
                    .join(" ")
                : ""
            }
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>
      </div>
    </div>
  );
};

export default ScoreCard;

