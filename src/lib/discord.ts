import { createPublicKey, verify as cryptoVerify } from "node:crypto";

const API = "https://discord.com/api/v10";

export interface DiscordConfig {
  botToken: string;
  publicKey: string;
  applicationId: string;
  userId: string;
  guildId: string | null;
}

let cachedConfig: DiscordConfig | null = null;

export function getDiscordConfig(): DiscordConfig {
  if (cachedConfig) return cachedConfig;

  const botToken = process.env.DISCORD_BOT_TOKEN;
  const publicKey = process.env.DISCORD_PUBLIC_KEY;
  const applicationId = process.env.DISCORD_APPLICATION_ID;
  const userId = process.env.DISCORD_USER_ID;
  const guildId = process.env.DISCORD_GUILD_ID || null;

  if (!botToken || !publicKey || !applicationId || !userId) {
    throw new Error(
      "Missing required Discord env vars: DISCORD_BOT_TOKEN, DISCORD_PUBLIC_KEY, DISCORD_APPLICATION_ID, DISCORD_USER_ID",
    );
  }

  cachedConfig = { botToken, publicKey, applicationId, userId, guildId };
  return cachedConfig;
}

export function isDiscordConfigured(): boolean {
  return Boolean(
    process.env.DISCORD_BOT_TOKEN &&
      process.env.DISCORD_PUBLIC_KEY &&
      process.env.DISCORD_APPLICATION_ID &&
      process.env.DISCORD_USER_ID,
  );
}

async function discordFetch(
  path: string,
  init: RequestInit & { body?: string } = {},
): Promise<Response> {
  const { botToken } = getDiscordConfig();
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bot ${botToken}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Discord ${init.method ?? "GET"} ${path} → ${res.status}: ${text}`);
  }
  return res;
}

let dmChannelId: string | null = null;

export async function getDmChannelId(): Promise<string> {
  if (dmChannelId) return dmChannelId;
  const { userId } = getDiscordConfig();
  const res = await discordFetch("/users/@me/channels", {
    method: "POST",
    body: JSON.stringify({ recipient_id: userId }),
  });
  const data = (await res.json()) as { id: string };
  dmChannelId = data.id;
  return dmChannelId;
}

export interface MessagePayload {
  content?: string;
  embeds?: unknown[];
  components?: unknown[];
}

export async function sendDm(payload: MessagePayload): Promise<{ id: string; channel_id: string }> {
  const channelId = await getDmChannelId();
  const res = await discordFetch(`/channels/${channelId}/messages`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return res.json() as Promise<{ id: string; channel_id: string }>;
}

export async function editInteractionResponse(
  interactionToken: string,
  payload: MessagePayload,
): Promise<void> {
  const { applicationId } = getDiscordConfig();
  const res = await fetch(
    `${API}/webhooks/${applicationId}/${interactionToken}/messages/@original`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Discord PATCH @original → ${res.status}: ${text}`);
  }
}

export interface SlashCommand {
  name: string;
  description: string;
}

export async function registerCommands(commands: SlashCommand[]): Promise<void> {
  const { applicationId, guildId } = getDiscordConfig();
  const path = guildId
    ? `/applications/${applicationId}/guilds/${guildId}/commands`
    : `/applications/${applicationId}/commands`;
  await discordFetch(path, {
    method: "PUT",
    body: JSON.stringify(commands),
  });
}

// Ed25519 SPKI DER prefix for a 32-byte raw public key
const SPKI_PREFIX = Buffer.from("302a300506032b6570032100", "hex");

export function verifyInteractionSignature(
  rawBody: string,
  signatureHex: string,
  timestamp: string,
): boolean {
  try {
    const { publicKey } = getDiscordConfig();
    const keyObject = createPublicKey({
      key: Buffer.concat([SPKI_PREFIX, Buffer.from(publicKey, "hex")]),
      format: "der",
      type: "spki",
    });
    const message = Buffer.concat([Buffer.from(timestamp), Buffer.from(rawBody)]);
    return cryptoVerify(null, message, keyObject, Buffer.from(signatureHex, "hex"));
  } catch {
    return false;
  }
}
