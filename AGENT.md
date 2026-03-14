# AGENT.md

## Purpose
This repository powers HealthFlow, a production-oriented virtual healthcare SaaS platform.

## Engineering Principles
- Keep architecture modular, testable, and easy to extend.
- Prefer clear boundaries: `services/` for business logic, `integrations/` for third-party APIs.
- Use strict TypeScript and avoid `any` unless justified and documented.
- Build reusable UI in `components/` and shared behavior in `hooks/`.
- Enforce least-privilege access with Supabase RLS.

## Project Structure Contract
- `app/`: Next.js routes, layouts, API routes
- `components/`: UI + feature components
- `lib/`: shared helpers, env, auth, Supabase clients
- `hooks/`: reusable React hooks
- `types/`: shared domain types
- `services/`: domain/business logic
- `integrations/`: external providers (Daily, Stripe, Twilio, etc.)
- `supabase/migrations/`: SQL schema + RLS policies

## Frontend Instructions
- Keep pages thin; move logic to hooks/services.
- Use reusable UI primitives first before creating new components.
- Always provide loading, empty, success, and error states.
- Ensure responsive behavior at `sm`, `md`, `lg`, `xl` breakpoints.
- Prefer semantic HTML (`main`, `section`, `nav`, `button`, `form`, `label`).
- Accessibility baseline:
  - Keyboard navigation works for all interactive controls.
  - Inputs have labels and errors are announced/readable.
  - Color contrast should pass WCAG AA.
- UX quality:
  - Minimize clicks for critical tasks (book, message, pay).
  - Keep copy clear and action-oriented.
  - Show progress/feedback for long operations.
- Keep visual consistency in spacing, typography, and component behavior.

## Backend Instructions
- API routes should orchestrate only; business logic belongs in `services/`.
- Validate request payloads at route boundaries.
- Return consistent JSON shapes with actionable error messages.
- Use idempotency for payment and notification flows where possible.
- Add timeouts/retries for external API calls and handle partial failures gracefully.

## Database Instructions
- Every schema change must be a migration under `supabase/migrations/`.
- New tables must include:
  - Primary key
  - Foreign keys
  - Required indexes
  - Audit timestamps
  - RLS enabled + explicit policies
- Optimize common read paths using composite indexes.
- Prefer additive migrations over destructive changes.

## Security & Compliance Instructions
- Never expose secret keys to client bundles.
- Sanitize and validate all external input.
- Apply principle of least privilege in policies and service operations.
- Log security-relevant actions (auth changes, payment status changes, role updates).
- Treat medical data as sensitive; avoid verbose logs with PHI.

## DevOps & Operations Instructions
- Deploy on Vercel with environment parity across preview/production.
- Keep `.env.example` updated whenever env vars change.
- Add health and error observability for API routes and integrations.
- Monitor:
  - API failures
  - Notification delivery failures
  - Payment failures
  - Realtime disconnect rates

## Testing Instructions
- Add unit tests for pure service logic.
- Add integration tests for API routes and DB interactions.
- Add end-to-end flows for:
  - signup/login/logout
  - forgot/reset password
  - appointment booking
  - provider note flow
  - payment checkout
- Any bug fix should include at least one regression test.

## Performance Instructions
- Avoid unnecessary client-side rendering for static content.
- Use server components by default unless client state is required.
- Paginate or window long lists (messages, records, appointments).
- Track web vitals and optimize slow routes before release.

## Documentation Instructions
- Update `README.md` for setup, env changes, and deployment changes.
- Update `PRD.md` when feature scope or behavior changes materially.
- Add inline comments only where logic is non-obvious.

## Definition of Done (for feature work)
- Feature implemented end-to-end and role behavior verified.
- UX states covered: loading, empty, success, error.
- Security and RLS checks completed.
- Tests added/updated and passing locally.
- Docs updated (`README.md`, and `PRD.md` if scope changed).
