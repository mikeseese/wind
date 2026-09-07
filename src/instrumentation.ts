export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { isDiscordConfigured, registerCommands } = await import("@/lib/discord");
  const { startScheduler } = await import("@/lib/scheduler");

  if (!isDiscordConfigured()) {
    console.warn(
      "[wind] Discord env vars not configured; skipping bot startup. Set DISCORD_BOT_TOKEN, DISCORD_PUBLIC_KEY, DISCORD_APPLICATION_ID, DISCORD_USER_ID.",
    );
    return;
  }

  try {
    await registerCommands([
      { name: "report", description: "Get the latest wind report" },
    ]);
    console.log("[wind] Registered Discord slash commands");
  } catch (err) {
    console.error("[wind] Failed to register Discord slash commands:", err);
  }

  startScheduler();
}
