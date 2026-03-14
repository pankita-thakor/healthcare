# Product Requirements Document (PRD)

## Product
HealthFlow - API-first Virtual Healthcare Platform

## Vision
Build a modern telehealth SaaS platform that enables patients, providers, and administrators to manage end-to-end virtual care with secure communication, scheduling, payments, and analytics.

## Goals
- Deliver role-based healthcare workflows on web.
- Provide reliable video consultations and secure messaging.
- Support clinical documentation with AI assistance.
- Enable operational visibility for admins.
- Be deployable and scalable on Vercel + Supabase.

## User Roles
- Patient
- Provider
- Admin

## Core Features

### Authentication
- Signup
- Login
- Forgot password
- Reset password
- Protected routes
- Role-based dashboard routing

### Landing Site (SEO)
- Hero
- Features
- How it works
- Testimonials
- Pricing
- FAQ
- Footer

### Patient Portal
- Book appointments
- View medical records
- View prescriptions
- Message providers
- Receive notifications

### Provider Dashboard
- View patient queue
- Manage appointments
- Write clinical notes
- Prescribe medications
- Review patient history

### Admin Dashboard
- Manage users
- Manage providers
- View analytics
- Manage payments
- Monitor system health

### Appointments
- Provider availability
- Calendar booking
- Appointment statuses
- Video meeting link generation

### Video Consultation
- Daily.co integration
- Auto room creation per appointment

### Messaging
- Supabase Realtime patient-provider chat

### AI Assistant
- OpenRouter integration
- Clinical note generation
- SOAP note summarization
- Patient history summary

### Notifications
- Email via Resend
- SMS via Twilio
- Push via Firebase Cloud Messaging

### Payments
- Stripe consultation payments

### Analytics
- PostHog tracking:
  - Patient engagement
  - Appointment metrics
  - Provider activity

## Non-Functional Requirements
- TypeScript strict mode
- Reusable hooks and components
- Modular service and integration layers
- Responsive and accessible UI
- Dark/light theme support
- Row Level Security (RLS) in Supabase

## Tech Stack
- Frontend: Next.js 14 App Router, TypeScript, TailwindCSS, shadcn/ui
- Backend: Supabase (Postgres, Auth, Realtime, Storage)
- Deployment: Vercel

## Data Model (Required Tables)
- users
- patients
- providers
- appointments
- medical_records
- clinical_notes
- prescriptions
- messages
- notifications
- lab_orders
- lab_results
- payments

## Environment Variables
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- DAILY_API_KEY
- RESEND_API_KEY
- TWILIO_ACCOUNT_SID
- TWILIO_AUTH_TOKEN
- OPENROUTER_API_KEY
- STRIPE_SECRET_KEY
- POSTHOG_KEY
- FIREBASE_SERVER_KEY

## Success Metrics
- Signup-to-first-appointment conversion
- Appointment completion rate
- Message response time
- Provider documentation turnaround time
- Payment success rate
- Admin-reported operational efficiency
