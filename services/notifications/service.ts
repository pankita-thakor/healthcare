import { sendEmail } from "@/integrations/resend/client";
import { sendSms } from "@/integrations/twilio/client";
import { sendPush } from "@/integrations/firebase/client";

export async function notifyAppointment(email: string, phone: string, pushToken: string, message: string) {
  await Promise.all([
    sendEmail(email, "Appointment Update", `<p>${message}</p>`),
    sendSms(phone, message),
    sendPush(pushToken, "HealthFlow Update", message)
  ]);
}
