import { GroupSummary } from "@/lib/weather";
import WeatherIcon from "./WeatherIcon";

interface CalmSummaryRowProps {
  summary: GroupSummary;
}

function trend(start: number, end: number, unit: string, decimals = 1): string {
  const a = start.toFixed(decimals);
  const b = end.toFixed(decimals);
  if (a === b) return `${a} ${unit}`;
  return `${a} → ${b} ${unit}`;
}

export default function CalmSummaryRow({ summary }: CalmSummaryRowProps) {
  return (
    <div className="rounded-xl px-4 py-2.5 text-sm text-muted hover:bg-surface-hover transition-colors">
      <div className="grid grid-cols-[auto_1fr] sm:grid-cols-[auto_auto_1fr] gap-x-4 gap-y-1 items-baseline">
        <span className="flex items-center gap-2 font-mono shrink-0">
          <WeatherIcon
            cloudCover={summary.avgCloudCover}
            precipitation={summary.maxPrecipitation}
            className="w-5 h-5 shrink-0"
          />
          {summary.timeRange}
        </span>
        <span className="text-xs text-muted/60">
          {summary.count}h calm
        </span>
        <div className="col-span-2 sm:col-span-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
          <span>Wind {trend(summary.windStart, summary.windEnd, "kn")}</span>
          <span>Gusts {trend(summary.gustStart, summary.gustEnd, "kn")}</span>
          <span>{trend(summary.tempStart, summary.tempEnd, "°F", 0)}</span>
          {summary.precipTotal > 0 && (
            <span>{summary.precipTotal.toFixed(2)} in</span>
          )}
          {summary.precipProbMax > 0 && (
            <span>≤{summary.precipProbMax.toFixed(0)}% rain</span>
          )}
        </div>
      </div>
    </div>
  );
}
