import { createPaymentIntent } from "@/integrations/stripe/client";
import { createServiceClient } from "@/lib/supabase";

export async function createConsultationPayment(patientId: string, appointmentId: string, amountCents: number) {
  const paymentIntent = await createPaymentIntent(amountCents);

  const supabase = createServiceClient();
  const { error } = await supabase.from("payments").insert({
    patient_id: patientId,
    appointment_id: appointmentId,
    amount_cents: amountCents,
    status: "initiated",
    stripe_payment_intent_id: paymentIntent.id
  });

  if (error) throw error;
  return paymentIntent;
}
