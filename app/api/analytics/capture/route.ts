import { NextResponse } from "next/server";
import { captureEvent } from "@/integrations/posthog/client";

export async function POST(req: Request) {
  const body = await req.json();
  await captureEvent(body.distinctId, body.event, body.properties ?? {});
  return NextResponse.json({ success: true });
}
