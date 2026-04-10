import { NextResponse } from "next/server";
import { fetchWeatherReport } from "@/lib/weather";
import { NTFY_TOPIC, SITE_URL } from "@/config";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const report = await fetchWeatherReport();

    if (report.textSummary) {
      await fetch(`https://ntfy.sh/${encodeURIComponent(NTFY_TOPIC)}`, {
        method: "POST",
        headers: {
          Title: "Wind Alert",
          Tags: "boat",
          Click: SITE_URL,
        },
        body: report.textSummary,
      });

      return NextResponse.json({
        sent: true,
        summary: report.textSummary,
      });
    }

    return NextResponse.json({
      sent: false,
      message: "No wind alerts to send",
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to send alert" },
      { status: 500 },
    );
  }
}
