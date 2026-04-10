import { fetchWeatherApi } from "openmeteo";

export interface HourlyData {
  time: Date;
  temperature: number | null;
  windSpeed: number | null;
  windGusts: number | null;
  precipitation: number | null;
  precipitationProbability: number | null;
  visibility: number | null;
  cloudCover: number | null;
}

export interface DayData {
  date: Date;
  sunrise: Date;
  sunset: Date;
  hourly: HourlyData[];
  hasAlerts: boolean;
}

export interface WeatherReport {
  days: DayData[];
  textSummary: string;
}

export async function fetchWeatherReport(): Promise<WeatherReport> {
  const params = {
    latitude: 45.678475,
    longitude: -122.697475,
    daily: ["sunrise", "sunset"],
    hourly: [
      "temperature_2m",
      "wind_speed_10m",
      "wind_gusts_10m",
      "precipitation",
      "precipitation_probability",
      "visibility",
      "cloud_cover",
    ],
    forecast_days: 14,
    past_days: 1,
    wind_speed_unit: "kn",
    temperature_unit: "fahrenheit",
    precipitation_unit: "inch",
    timezone: "America/Los_Angeles",
  };

  const url = "https://api.open-meteo.com/v1/forecast";
  const responses = await fetchWeatherApi(url, params);
  const response = responses[0];

  const utcOffsetSeconds = response.utcOffsetSeconds();
  const hourly = response.hourly()!;
  const daily = response.daily()!;
  const sunrise = daily.variables(0);
  const sunset = daily.variables(1);

  const hourlyTimes = [
    ...Array(
      (Number(hourly.timeEnd()) - Number(hourly.time())) / hourly.interval(),
    ),
  ].map(
    (_, i) =>
      new Date(
        (Number(hourly.time()) + i * hourly.interval() + utcOffsetSeconds) *
          1000,
      ),
  );

  const hourlyDataArray: HourlyData[] = hourlyTimes.map((time, index) => ({
    time,
    temperature: hourly.variables(0)!.valuesArray()?.[index] ?? null,
    windSpeed: hourly.variables(1)!.valuesArray()?.[index] ?? null,
    windGusts: hourly.variables(2)!.valuesArray()?.[index] ?? null,
    precipitation: hourly.variables(3)!.valuesArray()?.[index] ?? null,
    precipitationProbability: hourly.variables(4)!.valuesArray()?.[index] ?? null,
    visibility: hourly.variables(5)!.valuesArray()?.[index] ?? null,
    cloudCover: hourly.variables(6)!.valuesArray()?.[index] ?? null,
  }));

  const dailyTimes = [
    ...Array(
      (Number(daily.timeEnd()) - Number(daily.time())) / daily.interval(),
    ),
  ].map(
    (_, i) =>
      new Date(
        (Number(daily.time()) + i * daily.interval() + utcOffsetSeconds) *
          1000,
      ),
  );

  const sunrises = [...Array(sunrise!.valuesInt64Length())].map(
    (_, i) =>
      new Date((Number(sunrise!.valuesInt64(i)) + utcOffsetSeconds) * 1000),
  );

  const sunsets = [...Array(sunset!.valuesInt64Length())].map(
    (_, i) =>
      new Date((Number(sunset!.valuesInt64(i)) + utcOffsetSeconds) * 1000),
  );

  let textSummary = "";

  const days: DayData[] = dailyTimes.map((date, index) => {
    const daySunrise = sunrises[index];
    const daySunset = sunsets[index];
    const dayHourly = hourlyDataArray.filter(
      (h) => h.time.getUTCDate() === date.getUTCDate() &&
             h.time.getUTCMonth() === date.getUTCMonth(),
    );

    const hasAlerts = dayHourly.some(
      (h) =>
        h.time.getUTCHours() >= 9 &&
        h.time.getTime() < daySunset.getTime() - 60 * 60 * 1000 &&
        h.windSpeed !== null &&
        h.windSpeed >= 7,
    );

    if (hasAlerts) {
      textSummary +=
        date.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" }) + " ";
      textSummary += (date.getUTCMonth() + 1) + "/";
      textSummary += date.getUTCDate() + "\n";
    }

    return {
      date,
      sunrise: daySunrise,
      sunset: daySunset,
      hourly: dayHourly,
      hasAlerts,
    };
  });

  return { days, textSummary };
}

export function getWindLevel(
  windSpeed: number | null,
  windGusts: number | null,
): "calm" | "moderate" | "strong" {
  const windHigh = windSpeed !== null && windSpeed >= 8;
  const gustHigh = windGusts !== null && windGusts >= 15;
  if (windHigh && gustHigh) return "strong";
  if (windHigh) return "moderate";
  return "calm";
}

/**
 * Check if an hour has marginal wind (7-7.99 kn) that could be
 * promoted to moderate when part of a 2+ hour consecutive run.
 */
function isMarginalWind(hour: HourlyData): boolean {
  return hour.windSpeed !== null && hour.windSpeed >= 7 && hour.windSpeed < 8;
}

export function isDisplayHour(hour: HourlyData, sunset: Date): boolean {
  return (
    hour.time.getUTCHours() >= 9 &&
    hour.time.getTime() < sunset.getTime() + 60 * 60 * 1000
  );
}

export function formatHour(date: Date): string {
  let h = date.getUTCHours();
  const ampm = h >= 12 ? "PM" : "AM";
  h = h > 12 ? h - 12 : h;
  if (h === 0) h = 12;
  return `${h} ${ampm}`;
}

export type WindLevel = "calm" | "moderate" | "strong";

export interface HourlyGroup {
  level: WindLevel;
  hours: HourlyData[];
}

export function groupByWindLevel(hours: HourlyData[]): HourlyGroup[] {
  // First pass: assign per-hour levels
  const groups: HourlyGroup[] = [];
  for (const hour of hours) {
    const level = getWindLevel(hour.windSpeed, hour.windGusts);
    const last = groups[groups.length - 1];
    if (last && last.level === level) {
      last.hours.push(hour);
    } else {
      groups.push({ level, hours: [hour] });
    }
  }

  // Second pass: promote calm groups that have 2+ consecutive 7kn+ hours to moderate.
  // A calm group may contain a mix of truly calm (<7) and marginal (7-7.99) hours.
  // Split out runs of 2+ marginal hours as moderate sub-groups.
  const result: HourlyGroup[] = [];
  for (const group of groups) {
    if (group.level !== "calm") {
      result.push(group);
      continue;
    }

    let run: HourlyData[] = [];
    let nonRun: HourlyData[] = [];

    const flushRun = () => {
      if (run.length >= 2) {
        if (nonRun.length > 0) {
          result.push({ level: "calm", hours: nonRun });
          nonRun = [];
        }
        result.push({ level: "moderate", hours: run });
      } else {
        nonRun.push(...run);
      }
      run = [];
    };

    for (const hour of group.hours) {
      if (isMarginalWind(hour)) {
        run.push(hour);
      } else {
        flushRun();
        nonRun.push(hour);
      }
    }
    flushRun();
    if (nonRun.length > 0) {
      result.push({ level: "calm", hours: nonRun });
    }
  }

  // Third pass: merge adjacent groups with the same level
  const merged: HourlyGroup[] = [];
  for (const group of result) {
    const last = merged[merged.length - 1];
    if (last && last.level === group.level) {
      last.hours.push(...group.hours);
    } else {
      merged.push({ level: group.level, hours: [...group.hours] });
    }
  }

  return merged;
}

/**
 * Trim groups that extend past sunset.
 * - Calm groups: remove any hours past sunset entirely.
 * - Alert groups (moderate/strong): keep hours up to sunset+1hr,
 *   but only if the group had >= 2 hours of >= 8kn wind before sunset.
 *   Otherwise trim to sunset.
 */
export function trimPostSunsetGroups(
  groups: HourlyGroup[],
  sunset: Date,
): HourlyGroup[] {
  const sunsetMs = sunset.getTime();
  const sunsetPlus1Ms = sunsetMs + 60 * 60 * 1000;

  const result: HourlyGroup[] = [];

  for (const group of groups) {
    const preSunset = group.hours.filter((h) => h.time.getTime() < sunsetMs);
    const postSunset = group.hours.filter((h) => h.time.getTime() >= sunsetMs);

    if (postSunset.length === 0) {
      // Entirely before sunset — keep as-is
      result.push(group);
      continue;
    }

    if (group.level === "calm") {
      // Calm: only keep pre-sunset hours
      if (preSunset.length > 0) {
        result.push({ level: group.level, hours: preSunset });
      }
      continue;
    }

    // Alert group: extend past sunset only if >= 2 pre-sunset hours with >= 7kn
    const goodWindHours = preSunset.filter(
      (h) => h.windSpeed !== null && h.windSpeed >= 7,
    );

    if (goodWindHours.length >= 2) {
      // Keep pre-sunset + post-sunset up to sunset+1hr
      const extendedPost = postSunset.filter(
        (h) => h.time.getTime() < sunsetPlus1Ms,
      );
      result.push({ level: group.level, hours: [...preSunset, ...extendedPost] });
    } else {
      // Not enough prior wind — trim to sunset
      if (preSunset.length > 0) {
        result.push({ level: group.level, hours: preSunset });
      }
    }
  }

  return result.filter((g) => g.hours.length > 0);
}

export interface GroupSummary {
  timeRange: string;
  count: number;
  windStart: number;
  windEnd: number;
  gustStart: number;
  gustEnd: number;
  tempStart: number;
  tempEnd: number;
  precipTotal: number;
  precipProbMax: number;
  avgCloudCover: number;
  maxPrecipitation: number;
}

export function summarizeGroup(hours: HourlyData[]): GroupSummary {
  const first = hours[0];
  const last = hours[hours.length - 1];
  const timeRange = `${formatHour(first.time)} – ${formatHour(last.time)}`;

  let precipTotal = 0;
  let precipProbMax = 0;
  let cloudSum = 0;
  let cloudCount = 0;
  let maxPrecipitation = 0;

  for (const h of hours) {
    if (h.precipitation !== null) {
      precipTotal += h.precipitation;
      maxPrecipitation = Math.max(maxPrecipitation, h.precipitation);
    }
    if (h.precipitationProbability !== null) {
      precipProbMax = Math.max(precipProbMax, h.precipitationProbability);
    }
    if (h.cloudCover !== null) {
      cloudSum += h.cloudCover;
      cloudCount++;
    }
  }

  return {
    timeRange,
    count: hours.length,
    windStart: first.windSpeed ?? 0,
    windEnd: last.windSpeed ?? 0,
    gustStart: first.windGusts ?? 0,
    gustEnd: last.windGusts ?? 0,
    tempStart: first.temperature ?? 0,
    tempEnd: last.temperature ?? 0,
    precipTotal,
    precipProbMax,
    avgCloudCover: cloudCount > 0 ? cloudSum / cloudCount : 0,
    maxPrecipitation,
  };
}
