import { HourlyData, WindLevel, formatHour } from "@/lib/weather";
import WeatherIcon from "./WeatherIcon";

interface HourlyRowProps {
  hour: HourlyData;
  level: WindLevel;
}

const levelTextStyles = {
  calm: "text-foreground",
  moderate: "text-wind-moderate font-semibold",
  strong: "text-wind-strong font-semibold",
};

export default function HourlyRow({ hour, level }: HourlyRowProps) {
  return (
    <div
      className={`grid grid-cols-[auto_1fr_1fr_1fr_1fr] sm:grid-cols-[auto_1fr_1fr_1fr_1fr_1fr] gap-2 sm:gap-4 px-4 py-2.5 text-sm transition-colors ${level === "calm" ? "hover:bg-surface-hover" : ""}`}
    >
      <div className="flex items-center gap-2 font-mono text-muted">
        <WeatherIcon
          cloudCover={hour.cloudCover}
          precipitation={hour.precipitation}
          className="w-5 h-5 shrink-0"
        />
        {formatHour(hour.time)}
      </div>
      <div className={levelTextStyles[level]}>
        {hour.windSpeed !== null ? `${hour.windSpeed.toFixed(1)} kn` : "N/A"}
      </div>
      <div className={levelTextStyles[level]}>
        {hour.windGusts !== null ? `${hour.windGusts.toFixed(1)} kn` : "N/A"}
      </div>
      <div>
        {hour.temperature !== null ? `${hour.temperature.toFixed(0)}°F` : "N/A"}
      </div>
      <div className="hidden sm:block">
        {hour.precipitation !== null
          ? `${hour.precipitation.toFixed(2)} in`
          : "N/A"}
      </div>
      <div>
        {hour.precipitationProbability !== null
          ? `${hour.precipitationProbability.toFixed(0)}%`
          : "N/A"}
      </div>
    </div>
  );
}
