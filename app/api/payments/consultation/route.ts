import { NextResponse } from "next/server";
import { createConsultationPayment } from "@/services/payments/service";

export async function POST(req: Request) {
  const body = await req.json();
  const payment = await createConsultationPayment(body.patientId, body.appointmentId, body.amountCents);
  return NextResponse.json(payment);
}
