import { NextRequest, NextResponse } from "next/server";
import {
  editInteractionResponse,
  verifyInteractionSignature,
} from "@/lib/discord";
import { ViewId, buildView } from "@/lib/report";

export const dynamic = "force-dynamic";

const VALID_VIEWS: ViewId[] = ["summary", "today", "tomorrow", "next3", "full"];

interface Interaction {
  type: number;
  token: string;
  data?: {
    name?: string;
    custom_id?: string;
  };
}

function parseViewFromCustomId(customId: string | undefined): ViewId {
  if (!customId?.startsWith("view:")) return "summary";
  const id = customId.slice("view:".length) as ViewId;
  return VALID_VIEWS.includes(id) ? id : "summary";
}

async function respondWithView(token: string, view: ViewId): Promise<void> {
  try {
    const payload = await buildView(view);
    await editInteractionResponse(token, payload);
  } catch (err) {
    console.error(`[wind/interactions] Failed to render view ${view}:`, err);
    await editInteractionResponse(token, {
      content: `Failed to load wind report: ${(err as Error).message}`,
    }).catch(() => {});
  }
}

export async function POST(req: NextRequest) {
  const signature = req.headers.get("x-signature-ed25519");
  const timestamp = req.headers.get("x-signature-timestamp");
  const body = await req.text();

  if (
    !signature ||
    !timestamp ||
    !verifyInteractionSignature(body, signature, timestamp)
  ) {
    return new NextResponse("invalid request signature", { status: 401 });
  }

  const interaction = JSON.parse(body) as Interaction;

  // PING
  if (interaction.type === 1) {
    return NextResponse.json({ type: 1 });
  }

  // APPLICATION_COMMAND (slash command)
  if (interaction.type === 2) {
    if (interaction.data?.name === "report") {
      void respondWithView(interaction.token, "summary");
      return NextResponse.json({ type: 5 }); // DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE
    }
    return NextResponse.json({ type: 4, data: { content: "Unknown command." } });
  }

  // MESSAGE_COMPONENT (button click)
  if (interaction.type === 3) {
    const view = parseViewFromCustomId(interaction.data?.custom_id);
    void respondWithView(interaction.token, view);
    return NextResponse.json({ type: 6 }); // DEFERRED_UPDATE_MESSAGE
  }

  return new NextResponse("unsupported interaction", { status: 400 });
}
