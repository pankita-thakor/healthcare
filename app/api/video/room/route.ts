import { NextResponse } from "next/server";
import { createDailyRoom } from "@/integrations/daily/client";

export async function POST(req: Request) {
  const body = await req.json();
  const room = await createDailyRoom(body.meetingName);
  return NextResponse.json({ url: room.url, name: room.name });
}
