# HealthFlow

API-first virtual healthcare SaaS platform built with Next.js 14, Supabase, and Vercel.

## Stack

- Next.js 14 (App Router) + TypeScript strict mode
- TailwindCSS + reusable UI components
- Supabase (Postgres, Auth, Realtime, Storage)
- Integrations: Daily, OpenRouter, Resend, Twilio, Stripe, PostHog, Firebase

## Project Structure

- `app/` routes (marketing, auth, dashboards, API)
- `components/` reusable UI and feature components
- `lib/` shared utilities (env, auth, supabase clients)
- `hooks/` reusable hooks
- `types/` domain types
- `services/` business logic layer
- `integrations/` third-party SDK wrappers
- `supabase/migrations/` SQL schema and RLS

## Local Setup

1. Install dependencies:
   - `npm install`
2. Configure environment variables:
   - `cp .env.example .env.local` (Windows PowerShell: `Copy-Item .env.example .env.local`)
   - Fill in all required keys.
3. Run Next.js app:
   - `npm run dev`
4. Apply database schema in Supabase SQL Editor:
   - Run `supabase/migrations/0001_healthflow_schema.sql`

## Authentication & Roles

- Supabase Auth is used for signup/login/forgot-password.
- Roles supported:
  - `patient`
  - `provider`
  - `admin`
- Middleware (`middleware.ts`) protects dashboard routes and enforces role-based access.

## Feature Coverage

- Landing page (Hero, Features, How it works, Testimonials, Pricing, FAQ, Footer)
- Patient portal:
  - book appointments
  - medical records and prescriptions views
  - doctor chat and notifications
- Provider dashboard:
  - queue and appointment visibility
  - clinical note workflow with AI summarization endpoint
  - prescription and history review surfaces
- Admin dashboard:
  - user/provider management surfaces
  - analytics, payments, and system monitoring panels
- Appointment scheduling:
  - provider slot booking
  - status lifecycle
  - Daily.co room creation for video links
- Realtime messaging:
  - Supabase Realtime channel + messages table
- Notifications:
  - Email (Resend), SMS (Twilio), Push (FCM)
- Payments:
  - Stripe payment intent endpoint + payments table
- Analytics:
  - PostHog capture endpoint

## Deployment (Vercel)

1. Push repository to GitHub.
2. Import project into Vercel.
3. Add all environment variables in Vercel Project Settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `DAILY_API_KEY`
   - `RESEND_API_KEY`
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `OPENROUTER_API_KEY`
   - `STRIPE_SECRET_KEY`
   - `POSTHOG_KEY`
   - `FIREBASE_SERVER_KEY`
4. Deploy.
5. In Supabase, run the migration SQL and verify RLS is enabled.

## Production Hardening Checklist

- Replace demo sender phone in Twilio integration.
- Configure webhook signature verification for Stripe.
- Add audit logging and error tracking (Sentry).
- Add e2e and integration tests.
- Enforce HIPAA policies, BAAs, and regional compliance controls.
