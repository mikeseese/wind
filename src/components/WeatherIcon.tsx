interface WeatherIconProps {
  cloudCover: number | null;
  precipitation: number | null;
  className?: string;
}

export default function WeatherIcon({
  cloudCover,
  precipitation,
  className = "w-5 h-5",
}: WeatherIconProps) {
  const cloud = cloudCover ?? 0;
  const precip = precipitation ?? 0;

  // Heavy rain
  if (precip >= 0.1) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <path
          d="M6 19a4 4 0 01-.88-7.9A5.5 5.5 0 0115.9 6.1 4.5 4.5 0 0119 14h-1"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          className="text-muted"
        />
        <path d="M8 19v3M12 19v3M16 19v3" stroke="#60A5FA" strokeWidth={2} strokeLinecap="round" />
      </svg>
    );
  }

  // Light rain / drizzle
  if (precip > 0) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <path
          d="M6 19a4 4 0 01-.88-7.9A5.5 5.5 0 0115.9 6.1 4.5 4.5 0 0119 14h-1"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          className="text-muted"
        />
        <path d="M10 19v2M14 19v2" stroke="#60A5FA" strokeWidth={1.5} strokeLinecap="round" />
      </svg>
    );
  }

  // Overcast (80-100%)
  if (cloud >= 80) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <path
          d="M6 19a4 4 0 01-.88-7.9A5.5 5.5 0 0115.9 6.1 4.5 4.5 0 0119 14h-1"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          className="text-muted"
        />
      </svg>
    );
  }

  // Mostly cloudy (50-79%)
  if (cloud >= 50) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <path
          d="M4 19a3.5 3.5 0 01-.77-6.9A4.5 4.5 0 0113.4 8.6 3.5 3.5 0 0115.5 15h-1"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          className="text-muted"
        />
      </svg>
    );
  }

  // Partly cloudy (20-49%)
  if (cloud >= 20) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="7" r="3.5" className="fill-amber-400/30" stroke="currentColor" strokeWidth={0.5} />
        <path
          d="M5 21a3 3 0 01-.66-5.93A4 4 0 0112.3 12 3 3 0 0114 18h-1"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          className="text-muted/60"
        />
      </svg>
    );
  }

  // Clear sky
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="4" className="fill-amber-400/40" stroke="currentColor" strokeWidth={0.5} />
      <line x1="12" y1="5" x2="12" y2="7" stroke="currentColor" strokeWidth={1} strokeLinecap="round" />
      <line x1="12" y1="17" x2="12" y2="19" stroke="currentColor" strokeWidth={1} strokeLinecap="round" />
      <line x1="5" y1="12" x2="7" y2="12" stroke="currentColor" strokeWidth={1} strokeLinecap="round" />
      <line x1="17" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth={1} strokeLinecap="round" />
    </svg>
  );
}
