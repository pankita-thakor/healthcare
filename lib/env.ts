import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  DAILY_API_KEY: z.string().min(1),
  RESEND_API_KEY: z.string().min(1),
  TWILIO_ACCOUNT_SID: z.string().min(1),
  TWILIO_AUTH_TOKEN: z.string().min(1),
  OPENROUTER_API_KEY: z.string().min(1),
  STRIPE_SECRET_KEY: z.string().min(1),
  POSTHOG_KEY: z.string().min(1),
  FIREBASE_SERVER_KEY: z.string().min(1)
});

export const env = envSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  DAILY_API_KEY: process.env.DAILY_API_KEY,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  POSTHOG_KEY: process.env.POSTHOG_KEY,
  FIREBASE_SERVER_KEY: process.env.FIREBASE_SERVER_KEY
});
