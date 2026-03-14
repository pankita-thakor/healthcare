import { NextResponse } from "next/server";
import { notifyAppointment } from "@/services/notifications/service";

export async function POST(req: Request) {
  const body = await req.json();
  await notifyAppointment(body.email, body.phone, body.pushToken, body.message);
  return NextResponse.json({ success: true });
}
