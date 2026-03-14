import { NextResponse } from "next/server";
import { generateClinicalSummary } from "@/integrations/openrouter/client";

export async function POST(req: Request) {
  const body = await req.json();
  const prompt = `Summarize this visit into SOAP format:\n\n${body.transcript}`;
  const result = await generateClinicalSummary(prompt);
  return NextResponse.json(result);
}
