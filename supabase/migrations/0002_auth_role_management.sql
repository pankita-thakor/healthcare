begin;

-- Status enums
create type public.account_status as enum ('active', 'pending_approval', 'rejected');

-- Users table additions
alter table public.users
  add column if not exists status public.account_status not null default 'active';

-- Patient onboarding fields
alter table public.patients
  add column if not exists gender text,
  add column if not exists insurance text,
  add column if not exists medical_history text,
  add column if not exists onboarding_completed boolean not null default false;

-- Provider onboarding and approval fields
alter table public.providers
  add column if not exists specialization text,
  add column if not exists availability jsonb,
  add column if not exists status public.account_status not null default 'pending_approval',
  add column if not exists onboarding_completed boolean not null default false,
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by uuid references public.users(id) on delete set null;

-- Backfill existing providers from previous schema
update public.providers
set specialization = coalesce(specialization, specialty)
where specialization is null;

-- Keep one role lookup helper
create or replace function public.current_user_role()
returns public.user_role
language sql
stable
as $$
  select role from public.users where id = auth.uid()
$$;

-- Auto-provision app profile records after auth signup.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  incoming_role public.user_role;
begin
  incoming_role := coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'patient');

  insert into public.users (id, email, full_name, role, status)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', null),
    incoming_role,
    case when incoming_role = 'provider' then 'pending_approval'::public.account_status else 'active'::public.account_status end
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = excluded.full_name,
        role = excluded.role;

  if incoming_role = 'patient' then
    insert into public.patients (user_id)
    values (new.id)
    on conflict (user_id) do nothing;
  elseif incoming_role = 'provider' then
    insert into public.providers (user_id, status)
    values (new.id, 'pending_approval')
    on conflict (user_id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_auth_user();

-- Replace users policies with full CRUD constraints for role model

drop policy if exists "users self read" on public.users;
drop policy if exists "users self update" on public.users;

create policy "users read self or admin" on public.users
for select using (
  id = auth.uid()
  or public.current_user_role() = 'admin'
  or exists (
    select 1
    from public.appointments a
    where (a.patient_id = users.id and a.provider_id = auth.uid())
       or (a.provider_id = users.id and a.patient_id = auth.uid())
  )
);

create policy "users update self or admin" on public.users
for update using (id = auth.uid() or public.current_user_role() = 'admin');

create policy "users insert self or admin" on public.users
for insert with check (id = auth.uid() or public.current_user_role() = 'admin');

-- Patients: patient self, assigned providers, admins

drop policy if exists "patients read by self provider admin" on public.patients;

create policy "patients read self assigned provider admin" on public.patients
for select using (
  user_id = auth.uid()
  or public.current_user_role() = 'admin'
  or exists (
    select 1
    from public.appointments a
    where a.patient_id = patients.user_id
      and a.provider_id = auth.uid()
      and a.status in ('confirmed', 'completed', 'pending')
  )
);

create policy "patients insert self or admin" on public.patients
for insert with check (user_id = auth.uid() or public.current_user_role() = 'admin');

create policy "patients update self or admin" on public.patients
for update using (user_id = auth.uid() or public.current_user_role() = 'admin');

-- Providers: provider self profile, admins can review all

drop policy if exists "providers read by all auth users" on public.providers;

create policy "providers read self or admin or linked patient" on public.providers
for select using (
  user_id = auth.uid()
  or public.current_user_role() = 'admin'
  or exists (
    select 1
    from public.appointments a
    where a.provider_id = providers.user_id
      and a.patient_id = auth.uid()
  )
);

create policy "providers insert self or admin" on public.providers
for insert with check (user_id = auth.uid() or public.current_user_role() = 'admin');

create policy "providers update self or admin" on public.providers
for update using (user_id = auth.uid() or public.current_user_role() = 'admin');

-- Medical records: only patient, assigned provider, admin.
drop policy if exists "medical records read participant" on public.medical_records;
create policy "medical records read scoped" on public.medical_records
for select using (
  patient_id = auth.uid()
  or public.current_user_role() = 'admin'
  or exists (
    select 1
    from public.appointments a
    where a.patient_id = medical_records.patient_id
      and a.provider_id = auth.uid()
  )
);

commit;
