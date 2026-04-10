import { NextResponse } from "next/server";
import { fetchWeatherReport } from "@/lib/weather";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const report = await fetchWeatherReport();
    return NextResponse.json(report);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch weather data" },
      { status: 500 },
    );
  }
}
