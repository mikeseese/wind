import { SITE_URL } from "@/config";
import {
  DayData,
  HourlyGroup,
  WeatherReport,
  fetchWeatherReport,
  formatHour,
  groupByWindLevel,
  isDisplayHour,
  summarizeGroup,
  trimPostSunsetGroups,
} from "@/lib/weather";

export type ViewId = "summary" | "today" | "tomorrow" | "next3" | "full";

const COLOR_STRONG = 0xef4444;
const COLOR_MODERATE = 0xf59e0b;
const COLOR_CALM = 0x10b981;

const VIEW_LABELS: Record<ViewId, string> = {
  summary: "Summary",
  today: "Today",
  tomorrow: "Tomorrow",
  next3: "Next 3 Days",
  full: "14-Day",
};

function laDateParts(now: Date = new Date()): { y: number; m: number; d: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const y = Number(parts.find((p) => p.type === "year")!.value);
  const m = Number(parts.find((p) => p.type === "month")!.value);
  const d = Number(parts.find((p) => p.type === "day")!.value);
  return { y, m, d };
}

function findTodayIndex(days: DayData[]): number {
  const { y, m, d } = laDateParts();
  const idx = days.findIndex(
    (day) =>
      day.date.getUTCFullYear() === y &&
      day.date.getUTCMonth() + 1 === m &&
      day.date.getUTCDate() === d,
  );
  // Fall back to first day if not found (e.g., if past_days changes)
  return idx === -1 ? 0 : idx;
}

function dayLabel(date: Date, todayIndex: number, dayIndex: number): string {
  if (dayIndex === todayIndex) return "Today";
  if (dayIndex === todayIndex + 1) return "Tomorrow";
  const weekday = date.toLocaleDateString("en-US", {
    weekday: "short",
    timeZone: "UTC",
  });
  return `${weekday} ${date.getUTCMonth() + 1}/${date.getUTCDate()}`;
}

function alertColor(groups: HourlyGroup[]): number {
  if (groups.some((g) => g.level === "strong")) return COLOR_STRONG;
  if (groups.some((g) => g.level === "moderate")) return COLOR_MODERATE;
  return COLOR_CALM;
}

function formatRange(start: number, end: number, unit: string): string {
  const a = Math.round(start);
  const b = Math.round(end);
  if (a === b) return `${a}${unit}`;
  return `${a}–${b}${unit}`;
}

function getDayGroups(day: DayData): HourlyGroup[] {
  const displayHours = day.hourly.filter((h) => isDisplayHour(h, day.sunset));
  const grouped = groupByWindLevel(displayHours);
  return trimPostSunsetGroups(grouped, day.sunset);
}

function buildAlertGroupSummary(group: HourlyGroup): string {
  const s = summarizeGroup(group.hours);
  return `${s.timeRange} · ${formatRange(s.windStart, s.windEnd, " kn")} (G ${formatRange(s.gustStart, s.gustEnd, "")})`;
}

function buildDaySummaryLine(day: DayData): string {
  const groups = getDayGroups(day);
  const alerts = groups.filter((g) => g.level !== "calm");
  if (alerts.length === 0) return "No alerts";
  return alerts
    .map((g) => `**${g.level}** ${buildAlertGroupSummary(g)}`)
    .join("\n");
}

interface Embed {
  title: string;
  description?: string;
  color: number;
  fields?: { name: string; value: string; inline?: boolean }[];
  url?: string;
  footer?: { text: string };
  timestamp?: string;
}

function buildSummaryEmbed(report: WeatherReport): Embed {
  const todayIdx = findTodayIndex(report.days);
  const upcoming = report.days.slice(todayIdx);
  const alertDays = upcoming.filter((d) => d.hasAlerts);

  const allGroups = upcoming.flatMap((d) => getDayGroups(d));
  const color = alertColor(allGroups);

  const upcomingWithIdx = upcoming.map((d, i) => ({ d, dayIdx: todayIdx + i }));
  const alertEntries = upcomingWithIdx.filter(({ d }) => d.hasAlerts).slice(0, 10);

  const fields = alertEntries.length
    ? alertEntries.map(({ d, dayIdx }) => ({
        name: dayLabel(d.date, todayIdx, dayIdx),
        value: buildDaySummaryLine(d),
      }))
    : [{ name: "Forecast", value: "No wind alerts in next 14 days." }];

  const description = alertEntries.length
    ? `**${alertDays.length}** alert day${alertDays.length === 1 ? "" : "s"} in the next ${upcoming.length}. Tap a button for details.`
    : "Calm conditions ahead.";

  return {
    title: "Wind Report",
    url: SITE_URL,
    description,
    color,
    fields,
    footer: { text: "wind.smial.org" },
    timestamp: new Date().toISOString(),
  };
}

function buildDayDetailFields(day: DayData): { name: string; value: string }[] {
  const groups = getDayGroups(day);
  if (groups.length === 0) {
    return [{ name: "No data", value: "Forecast unavailable for this day." }];
  }
  return groups.map((g) => {
    const s = summarizeGroup(g.hours);
    const wind = formatRange(s.windStart, s.windEnd, " kn");
    const gust = formatRange(s.gustStart, s.gustEnd, " kn");
    const temp = formatRange(s.tempStart, s.tempEnd, "°F");
    const precip =
      s.precipProbMax > 0
        ? `\nPrecip: ${Math.round(s.precipProbMax)}% (${s.precipTotal.toFixed(2)}″)`
        : "";
    const cloud = `\nCloud: ${Math.round(s.avgCloudCover)}%`;
    return {
      name: `${s.timeRange} · ${g.level}`,
      value: `Wind ${wind} / Gust ${gust}\nTemp ${temp}${precip}${cloud}`,
    };
  });
}

function buildSingleDayEmbed(day: DayData, label: string): Embed {
  const groups = getDayGroups(day);
  const sunriseStr = formatHour(day.sunrise);
  const sunsetStr = formatHour(day.sunset);
  return {
    title: `${label} — ${day.date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    })}`,
    url: SITE_URL,
    description: `Sunrise ${sunriseStr} · Sunset ${sunsetStr}`,
    color: alertColor(groups),
    fields: buildDayDetailFields(day),
    footer: { text: "wind.smial.org" },
    timestamp: new Date().toISOString(),
  };
}

function buildMultiDayEmbed(
  report: WeatherReport,
  fromIdx: number,
  count: number,
  title: string,
): Embed {
  const todayIdx = findTodayIndex(report.days);
  const slice = report.days.slice(fromIdx, fromIdx + count);
  const allGroups = slice.flatMap((d) => getDayGroups(d));

  const fields = slice.map((d, i) => ({
    name: dayLabel(d.date, todayIdx, fromIdx + i),
    value: buildDaySummaryLine(d),
  }));

  return {
    title,
    url: SITE_URL,
    color: alertColor(allGroups),
    fields,
    footer: { text: "wind.smial.org" },
    timestamp: new Date().toISOString(),
  };
}

function buildButtons(active: ViewId): unknown[] {
  const buttons = (["summary", "today", "tomorrow", "next3", "full"] as ViewId[]).map(
    (id) => ({
      type: 2,
      style: id === active ? 1 : 2,
      label: VIEW_LABELS[id],
      custom_id: `view:${id}`,
      disabled: id === active,
    }),
  );
  return [{ type: 1, components: buttons }];
}

export async function buildView(view: ViewId): Promise<{
  embeds: Embed[];
  components: unknown[];
}> {
  const report = await fetchWeatherReport();
  const todayIdx = findTodayIndex(report.days);

  let embed: Embed;
  switch (view) {
    case "summary":
      embed = buildSummaryEmbed(report);
      break;
    case "today":
      embed = buildSingleDayEmbed(report.days[todayIdx], "Today");
      break;
    case "tomorrow": {
      const day = report.days[todayIdx + 1];
      embed = day
        ? buildSingleDayEmbed(day, "Tomorrow")
        : buildSummaryEmbed(report);
      break;
    }
    case "next3":
      embed = buildMultiDayEmbed(report, todayIdx, 3, "Next 3 Days");
      break;
    case "full":
      embed = buildMultiDayEmbed(
        report,
        todayIdx,
        report.days.length - todayIdx,
        "14-Day Forecast",
      );
      break;
  }

  return { embeds: [embed], components: buildButtons(view) };
}
