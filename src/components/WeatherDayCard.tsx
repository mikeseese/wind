import { DayData, isDisplayHour, groupByWindLevel, trimPostSunsetGroups, summarizeGroup } from "@/lib/weather";
import HourlyRow from "./HourlyRow";
import CalmSummaryRow from "./CalmSummaryRow";

interface WeatherDayCardProps {
  day: DayData;
}

const groupStyles = {
  calm: "",
  moderate: "glass-warning",
  strong: "glass-danger",
};

export default function WeatherDayCard({ day }: WeatherDayCardProps) {
  const displayHours = day.hourly.filter((h) =>
    isDisplayHour(h, day.sunset),
  );
  const groups = trimPostSunsetGroups(groupByWindLevel(displayHours), day.sunset);

  if (displayHours.length === 0) return null;

  const dateStr = day.date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

  const now = new Date();
  const todayUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const dayUtc = Date.UTC(day.date.getUTCFullYear(), day.date.getUTCMonth(), day.date.getUTCDate());
  const diffDays = Math.round((dayUtc - todayUtc) / (1000 * 60 * 60 * 24));
  const relativeLabel =
    diffDays === 0 ? "Today" :
    diffDays === 1 ? "Tomorrow" :
    diffDays === -1 ? "Yesterday" :
    diffDays > 0 ? `+${diffDays}d` :
    `${diffDays}d`;

  const sunsetStr = day.sunset.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  });

  return (
    <div
      className={`glass rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.01] ${
        day.hasAlerts ? "glow-primary" : ""
      }`}
    >
      {/* Day header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          {day.hasAlerts && (
            <span className="h-2.5 w-2.5 rounded-full bg-wind-moderate animate-pulse" />
          )}
          <h3 className="text-lg font-semibold">
            {dateStr}
            <span className="ml-2 text-sm font-normal text-muted">{relativeLabel}</span>
          </h3>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted">
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5-13.5L16.5 7.5m0 0L12 3m4.5 4.5V21"
            />
          </svg>
          Sunset {sunsetStr}
        </div>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-[auto_1fr_1fr_1fr_1fr] sm:grid-cols-[auto_1fr_1fr_1fr_1fr_1fr] gap-2 sm:gap-4 px-4 py-2 text-xs font-medium uppercase tracking-wider text-muted border-b border-border/50">
        <div className="flex items-center gap-2">
          <span className="w-5 shrink-0" />
          Time
        </div>
        <div>Wind</div>
        <div>Gusts</div>
        <div>Temp</div>
        <div className="hidden sm:block">Precip</div>
        <div>Prob</div>
      </div>

      {/* Hourly rows grouped by wind level */}
      <div className="p-2 space-y-1">
        {groups.map((group) => {
          if (group.level === "calm") {
            const summary = summarizeGroup(group.hours);
            return (
              <CalmSummaryRow
                key={group.hours[0].time.toISOString()}
                summary={summary}
              />
            );
          }
          return (
            <div
              key={group.hours[0].time.toISOString()}
              className={`rounded-xl overflow-hidden ${groupStyles[group.level]}`}
            >
              {group.hours.map((hour) => {
                return (
                  <HourlyRow
                    key={hour.time.toISOString()}
                    hour={hour}
                    level={group.level}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
