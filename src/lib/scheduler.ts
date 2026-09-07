import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { isDiscordConfigured, sendDm } from "@/lib/discord";
import { buildView } from "@/lib/report";

const STATE_DIR = process.env.WIND_STATE_DIR || "/data";
const STATE_FILE = path.join(STATE_DIR, "scheduler.json");
const TICK_MS = 60_000;

interface SchedulerState {
  lastSentLaDate: string | null;
}

function laDateString(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function laHour(now: Date = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    hour: "2-digit",
    hour12: false,
  }).formatToParts(now);
  return Number(parts.find((p) => p.type === "hour")!.value);
}

async function readState(): Promise<SchedulerState> {
  try {
    const raw = await readFile(STATE_FILE, "utf8");
    return JSON.parse(raw) as SchedulerState;
  } catch {
    return { lastSentLaDate: null };
  }
}

async function writeState(state: SchedulerState): Promise<void> {
  await mkdir(STATE_DIR, { recursive: true });
  await writeFile(STATE_FILE, JSON.stringify(state, null, 2), "utf8");
}

async function sendDailyReport(): Promise<void> {
  const view = await buildView("summary");
  await sendDm(view);
}

let sending = false;

async function tick(): Promise<void> {
  if (sending) return;
  if (!isDiscordConfigured()) return;

  const reportHour = Number(process.env.REPORT_HOUR_LOCAL ?? "8");
  const today = laDateString();
  const hour = laHour();
  if (hour < reportHour) return;

  const state = await readState();
  if (state.lastSentLaDate === today) return;

  sending = true;
  try {
    await sendDailyReport();
    await writeState({ lastSentLaDate: today });
    console.log(`[wind/scheduler] Sent daily report for ${today}`);
  } catch (err) {
    console.error("[wind/scheduler] Failed to send daily report:", err);
  } finally {
    sending = false;
  }
}

const GLOBAL_KEY = Symbol.for("wind.scheduler.started");

interface SchedulerGlobal {
  [GLOBAL_KEY]?: NodeJS.Timeout;
}

export function startScheduler(): void {
  const g = globalThis as unknown as SchedulerGlobal;
  if (g[GLOBAL_KEY]) return;
  console.log(
    `[wind/scheduler] Starting (report hour: ${process.env.REPORT_HOUR_LOCAL ?? "8"} America/Los_Angeles)`,
  );
  g[GLOBAL_KEY] = setInterval(() => {
    void tick();
  }, TICK_MS);
  void tick();
}
