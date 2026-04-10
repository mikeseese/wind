"use client";

import { useEffect, useState } from "react";
import { DayData } from "@/lib/weather";
import WeatherDayCard from "./WeatherDayCard";

type FilterMode = "alerts" | "all";

export default function ForecastSection() {
  const [days, setDays] = useState<DayData[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterMode>("alerts");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/weather");
        if (!res.ok) throw new Error("Failed to fetch weather data");
        const data = await res.json();
        // Rehydrate dates from JSON
        const hydrated: DayData[] = data.days.map((d: Record<string, unknown>) => ({
          ...d,
          date: new Date(d.date as string),
          sunrise: new Date(d.sunrise as string),
          sunset: new Date(d.sunset as string),
          hourly: (d.hourly as Record<string, unknown>[]).map((h: Record<string, unknown>) => ({
            ...h,
            time: new Date(h.time as string),
          })),
        }));
        setDays(hydrated);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const displayDays =
    days && filter === "alerts" ? days.filter((d) => d.hasAlerts) : days;

  const alertCount = days?.filter((d) => d.hasAlerts).length ?? 0;

  return (
    <section id="forecast" className="relative py-10 overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-2">
              Forecast
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              14-day wind outlook
            </h2>
            {!loading && days && (
              <p className="text-muted mt-2">
                {alertCount} day{alertCount !== 1 ? "s" : ""} with wind alerts
              </p>
            )}
          </div>

          {/* Filter toggle */}
          {!loading && days && (
            <div className="glass rounded-full p-1 flex gap-1">
              <button
                onClick={() => setFilter("alerts")}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                  filter === "alerts"
                    ? "bg-primary text-white"
                    : "text-muted hover:text-foreground"
                }`}
              >
                Alert Days
              </button>
              <button
                onClick={() => setFilter("all")}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                  filter === "all"
                    ? "bg-primary text-white"
                    : "text-muted hover:text-foreground"
                }`}
              >
                All Days
              </button>
            </div>
          )}
        </div>

        {/* Legend badges */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <span className="glass rounded-full px-4 py-1.5 text-xs font-medium text-muted">
            <span className="h-1.5 w-1.5 inline-block rounded-full bg-wind-calm mr-2" />
            &lt; 8 kn Calm
          </span>
          <span className="glass rounded-full px-4 py-1.5 text-xs font-medium text-muted">
            <span className="h-1.5 w-1.5 inline-block rounded-full bg-wind-moderate mr-2" />
            &ge; 8 kn Wind
          </span>
          <span className="glass rounded-full px-4 py-1.5 text-xs font-medium text-muted">
            <span className="h-1.5 w-1.5 inline-block rounded-full bg-wind-strong mr-2" />
            &ge; 8 kn + 15 kn Gusts
          </span>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
            <p className="text-muted">Fetching weather data...</p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="glass-danger rounded-2xl p-8 text-center">
            <p className="text-wind-strong font-medium mb-2">
              Failed to load weather data
            </p>
            <p className="text-sm text-muted">{error}</p>
          </div>
        )}

        {/* Day cards */}
        {displayDays && (
          <div className="space-y-6">
            {displayDays.length === 0 ? (
              <div className="glass rounded-2xl p-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-wind-calm/10 text-wind-calm mb-4">
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">All clear!</h3>
                <p className="text-muted">
                  No wind alerts in the 14-day forecast. Calm conditions ahead.
                </p>
              </div>
            ) : (
              displayDays.map((day) => (
                <WeatherDayCard
                  key={day.date.toISOString()}
                  day={day}
                />
              ))
            )}
          </div>
        )}
      </div>
    </section>
  );
}
