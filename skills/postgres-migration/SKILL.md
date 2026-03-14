# postgres-migration

## Purpose
Create and apply safe, reversible Postgres/Supabase schema changes for HealthFlow.

## When to use
- Adding/changing tables, columns, indexes, constraints, enums
- Creating or updating RLS policies
- Backfilling or transforming existing data

## Repository conventions
- Store migrations in: `supabase/migrations/`
- Use numeric prefixes: `0002_*.sql`, `0003_*.sql`, ...
- Keep each migration focused on one logical change

## Workflow
1. Review current schema and dependent app code.
2. Draft migration SQL with explicit `up` operations.
3. Add/adjust indexes for query paths.
4. Enable RLS on new tables and add explicit policies.
5. Backfill data in deterministic, idempotent SQL when needed.
6. Validate with representative queries.
7. Document behavior changes in `README.md` if externally visible.

## Safety checklist
- Use `if exists` / `if not exists` where possible.
- Avoid destructive operations in same migration as feature release.
- For renames, prefer additive migration + backfill + later cleanup.
- Never drop columns/tables without a rollback plan.
- Validate enum changes against app-level TypeScript unions.

## RLS checklist
- `alter table ... enable row level security;`
- Add `select`, `insert`, `update`, `delete` policies as needed.
- Ensure policies map to role model: `patient | provider | admin`.
- Test both allowed and denied access paths.

## Template
```sql
-- 000X_feature_name.sql
begin;

-- schema changes

-- indexes

-- rls

commit;
```

## HealthFlow role helpers
- Use `auth.uid()` for caller identity.
- Reuse `public.current_user_role()` where applicable.
- Keep policy predicates simple and auditable.
