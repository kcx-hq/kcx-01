import { useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ForecastingBudgetsPayload, ForecastTimelinePoint } from "../../types";
import { formatCurrency, toNumber } from "../../utils/format";
import { SectionPanel } from "../shared/ui";

interface ForecastTimelineSectionProps {
  data: ForecastingBudgetsPayload;
  currency: string;
}

function buildFallbackTimeline(data: ForecastingBudgetsPayload): ForecastTimelinePoint[] {
  const rows = data.submodules?.budgetSetupOwnership?.rows || [];
  const currentCost = rows.reduce((sum, row) => sum + toNumber(row.consumed), 0);
  const forecastCost = toNumber(data.kpiStrip?.eomForecastAllocatedCost);
  const burnRate = Math.max(0.01, toNumber(data.kpiStrip?.burnRate));
  const daysRemaining = Math.max(0, Math.round(toNumber(data.submodules?.budgetBurnControls?.daysRemaining)));
  const daysElapsed = Math.max(1, Math.round(currentCost / burnRate));
  const totalDays = Math.max(daysElapsed, daysElapsed + daysRemaining);
  const bandRatio = Math.max(0, Math.min(0.6, toNumber(data.confidence?.confidenceBandPct) / 100));

  const points: ForecastTimelinePoint[] = [];
  let cumulative = 0;

  for (let day = 1; day <= daysElapsed; day += 1) {
    cumulative += currentCost / daysElapsed;
    points.push({
      dayIndex: day,
      date: null,
      label: `D${day}`,
      phase: "actual",
      actualToDate: cumulative,
      forecastToDate: day === daysElapsed ? cumulative : null,
      lowerBound: null,
      upperBound: null,
    });
  }

  const remainingCost = Math.max(0, forecastCost - cumulative);
  const remainingDays = Math.max(0, totalDays - daysElapsed);
  const perDayForecast = remainingDays > 0 ? remainingCost / remainingDays : 0;
  for (let offset = 1; offset <= remainingDays; offset += 1) {
    cumulative += perDayForecast;
    points.push({
      dayIndex: daysElapsed + offset,
      date: null,
      label: `D${daysElapsed + offset}`,
      phase: "forecast",
      actualToDate: null,
      forecastToDate: cumulative,
      lowerBound: cumulative * (1 - bandRatio),
      upperBound: cumulative * (1 + bandRatio),
    });
  }
  return points;
}

export function ForecastTimelineSection({ data, currency }: ForecastTimelineSectionProps) {
  const points = useMemo(() => {
    const apiPoints = data.forecastView?.timeline?.points || [];
    if (apiPoints.length) return apiPoints;
    return buildFallbackTimeline(data);
  }, [data]);

  return (
    <SectionPanel title="Forecast Timeline">
      <div className="mb-3 flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-600">
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-slate-700" />
          Actual spend to date
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-emerald-600" />
          Forecast remaining days
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-emerald-300" />
          Confidence band
        </span>
      </div>

      <div className="h-[290px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#64748b" }} />
            <YAxis
              tick={{ fontSize: 11, fill: "#64748b" }}
              tickFormatter={(value) => formatCurrency(value, currency)}
            />
            <Tooltip
              formatter={(value: number | string | null) =>
                value == null ? "N/A" : formatCurrency(value, currency)
              }
              labelFormatter={(value) => `Day ${value}`}
            />
            <Line
              type="monotone"
              dataKey="actualToDate"
              name="Actual"
              stroke="#334155"
              strokeWidth={2.2}
              dot={false}
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="forecastToDate"
              name="Forecast"
              stroke="#23a282"
              strokeWidth={2.2}
              dot={false}
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="lowerBound"
              name="Band Low"
              stroke="#6ee7b7"
              strokeWidth={1.3}
              strokeDasharray="4 3"
              dot={false}
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="upperBound"
              name="Band High"
              stroke="#6ee7b7"
              strokeWidth={1.3}
              strokeDasharray="4 3"
              dot={false}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </SectionPanel>
  );
}

