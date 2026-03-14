import { NextResponse } from "next/server";
import { generateClinicalSummary } from "@/integrations/openrouter/client";

export async function POST(req: Request) {
  const body = await req.json();
  const data = await generateClinicalSummary(body.prompt);
  return NextResponse.json(data);
}
