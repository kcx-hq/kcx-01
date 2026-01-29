import { getScoreBg, getScoreColor } from "../utils/format.js";

const ScoreCard = ({ stats }) => {
  const score = stats?.score ?? 100;
  const trend = Array.isArray(stats?.trendData) ? stats.trendData : [];

  return (
    <div
      className={`flex-1 flex flex-col justify-center p-6 rounded-2xl border ${getScoreBg(
        score
      )} relative overflow-hidden`}
    >
      <div className="z-10">
        <div className="flex justify-between items-start mb-2">
          <p className="text-xs font-bold uppercase opacity-70">Data Health Score</p>
          <div
            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-black/20 ${getScoreColor(
              score
            )}`}
          >
            {score >= 90 ? "Excellent" : score >= 70 ? "Fair" : "Critical"}
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className={`text-5xl font-black ${getScoreColor(score)}`}>{score}</span>
          <span className="text-sm opacity-50">/ 100</span>
        </div>
      </div>

      <div className="absolute bottom-0 right-0 w-32 h-16 opacity-20">
        <svg className="w-full h-full" viewBox="0 0 100 50" preserveAspectRatio="none">
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
