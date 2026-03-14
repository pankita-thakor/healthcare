# backend-api

## Purpose
Implement secure, reliable, and testable backend/API behavior for HealthFlow.

## When to use
- New API routes
- Service-layer workflows
- Third-party integration changes
- Data access and authorization logic

## Core rules
- API routes orchestrate only; business logic belongs in `services/`.
- Third-party calls belong in `integrations/<vendor>/client.ts`.
- Validate request inputs at the route boundary.
- Return consistent JSON responses and actionable errors.
- Never expose server secrets in client code.

## Security checklist
- Enforce role checks on sensitive actions.
- Rely on Supabase RLS as a hard guardrail.
- Avoid logging PHI/secrets.
- Use least-privilege keys and operations.

## Reliability checklist
- Add timeouts and retries for network calls when appropriate.
- Design idempotent flows for payments/notifications.
- Handle partial failures without crashing whole workflows.
- Capture key operational events for monitoring.

## Database checklist
- Add migration in `supabase/migrations/` for schema changes.
- Include indexes for main query paths.
- Enable RLS and define explicit policies.
- Prefer additive, backward-compatible migrations.

## Implementation workflow
1. Define endpoint contract (input/output/errors).
2. Add/extend service logic.
3. Add/update integration wrappers if needed.
4. Add migration + RLS if data model changes.
5. Add tests (unit/integration) and verify role behavior.

## Done criteria
- Endpoint is secure, validated, and role-correct.
- Service/integration boundaries are clean.
- Migration + RLS present for DB changes.
- Tests cover happy path + failure path.
