create type public.user_role as enum ('patient', 'provider', 'admin');
create type public.appointment_status as enum ('pending', 'confirmed', 'completed', 'cancelled');
create type public.payment_status as enum ('initiated', 'paid', 'failed', 'refunded');

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  role public.user_role not null default 'patient',
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  date_of_birth date,
  blood_group text,
  allergies text,
  emergency_contact text,
  created_at timestamptz not null default now()
);

create table if not exists public.providers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  specialty text,
  license_number text,
  years_of_experience int,
  bio text,
  is_verified boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.users(id) on delete cascade,
  provider_id uuid not null references public.users(id) on delete cascade,
  start_time timestamptz not null,
  end_time timestamptz not null,
  status public.appointment_status not null default 'pending',
  reason text,
  meeting_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.medical_records (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.users(id) on delete cascade,
  provider_id uuid references public.users(id) on delete set null,
  diagnosis text,
  treatment_plan text,
  record_date timestamptz not null default now(),
  attachments jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.clinical_notes (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid references public.appointments(id) on delete set null,
  patient_id uuid not null references public.users(id) on delete cascade,
  provider_id uuid not null references public.users(id) on delete cascade,
  subjective text,
  objective text,
  assessment text,
  plan text,
  ai_summary text,
  created_at timestamptz not null default now()
);

create table if not exists public.prescriptions (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.users(id) on delete cascade,
  provider_id uuid not null references public.users(id) on delete cascade,
  medication_name text not null,
  dosage text not null,
  frequency text not null,
  duration text,
  instructions text,
  created_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.users(id) on delete cascade,
  recipient_id uuid not null references public.users(id) on delete cascade,
  appointment_id uuid references public.appointments(id) on delete set null,
  content text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  body text not null,
  channel text not null,
  status text not null default 'queued',
  metadata jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.lab_orders (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.users(id) on delete cascade,
  provider_id uuid not null references public.users(id) on delete cascade,
  test_name text not null,
  instructions text,
  status text not null default 'ordered',
  created_at timestamptz not null default now()
);

create table if not exists public.lab_results (
  id uuid primary key default gen_random_uuid(),
  lab_order_id uuid not null references public.lab_orders(id) on delete cascade,
  patient_id uuid not null references public.users(id) on delete cascade,
  result_summary text,
  result_data jsonb,
  reviewed_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid references public.appointments(id) on delete set null,
  patient_id uuid not null references public.users(id) on delete cascade,
  amount_cents integer not null check (amount_cents > 0),
  currency text not null default 'usd',
  status public.payment_status not null default 'initiated',
  stripe_payment_intent_id text,
  created_at timestamptz not null default now()
);

create index if not exists idx_appointments_patient on public.appointments(patient_id, start_time desc);
create index if not exists idx_appointments_provider on public.appointments(provider_id, start_time desc);
create index if not exists idx_messages_participants on public.messages(sender_id, recipient_id, created_at desc);
create index if not exists idx_medical_records_patient on public.medical_records(patient_id, record_date desc);

create or replace function public.current_user_role()
returns public.user_role
language sql
stable
as $$
  select role from public.users where id = auth.uid()
$$;

alter table public.users enable row level security;
alter table public.patients enable row level security;
alter table public.providers enable row level security;
alter table public.appointments enable row level security;
alter table public.medical_records enable row level security;
alter table public.clinical_notes enable row level security;
alter table public.prescriptions enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;
alter table public.lab_orders enable row level security;
alter table public.lab_results enable row level security;
alter table public.payments enable row level security;

-- Users
create policy "users self read" on public.users
for select using (id = auth.uid() or public.current_user_role() = 'admin');

create policy "users self update" on public.users
for update using (id = auth.uid() or public.current_user_role() = 'admin');

-- Patients and providers
create policy "patients read by self provider admin" on public.patients
for select using (
  user_id = auth.uid() or public.current_user_role() = 'admin' or
  exists (select 1 from public.appointments a where a.patient_id = patients.user_id and a.provider_id = auth.uid())
);

create policy "providers read by all auth users" on public.providers
for select using (auth.uid() is not null);

-- Appointments
create policy "appointments participant read" on public.appointments
for select using (patient_id = auth.uid() or provider_id = auth.uid() or public.current_user_role() = 'admin');

create policy "appointments patient create" on public.appointments
for insert with check (patient_id = auth.uid() or public.current_user_role() = 'admin');

create policy "appointments provider update" on public.appointments
for update using (provider_id = auth.uid() or public.current_user_role() = 'admin');

-- Medical data
create policy "medical records read participant" on public.medical_records
for select using (patient_id = auth.uid() or provider_id = auth.uid() or public.current_user_role() = 'admin');

create policy "medical records provider write" on public.medical_records
for insert with check (provider_id = auth.uid() or public.current_user_role() = 'admin');

create policy "clinical notes participant read" on public.clinical_notes
for select using (patient_id = auth.uid() or provider_id = auth.uid() or public.current_user_role() = 'admin');

create policy "clinical notes provider write" on public.clinical_notes
for all using (provider_id = auth.uid() or public.current_user_role() = 'admin') with check (provider_id = auth.uid() or public.current_user_role() = 'admin');

create policy "prescriptions participant read" on public.prescriptions
for select using (patient_id = auth.uid() or provider_id = auth.uid() or public.current_user_role() = 'admin');

create policy "prescriptions provider write" on public.prescriptions
for insert with check (provider_id = auth.uid() or public.current_user_role() = 'admin');

-- Messaging and notifications
create policy "messages participants read" on public.messages
for select using (sender_id = auth.uid() or recipient_id = auth.uid() or public.current_user_role() = 'admin');

create policy "messages sender insert" on public.messages
for insert with check (sender_id = auth.uid() or public.current_user_role() = 'admin');

create policy "notifications owner read" on public.notifications
for select using (user_id = auth.uid() or public.current_user_role() = 'admin');

create policy "notifications service insert" on public.notifications
for insert with check (public.current_user_role() = 'admin' or user_id = auth.uid());

-- Labs
create policy "lab orders participant read" on public.lab_orders
for select using (patient_id = auth.uid() or provider_id = auth.uid() or public.current_user_role() = 'admin');

create policy "lab orders provider write" on public.lab_orders
for all using (provider_id = auth.uid() or public.current_user_role() = 'admin') with check (provider_id = auth.uid() or public.current_user_role() = 'admin');

create policy "lab results participant read" on public.lab_results
for select using (patient_id = auth.uid() or public.current_user_role() = 'admin');

create policy "lab results provider write" on public.lab_results
for all using (
  public.current_user_role() = 'admin' or exists (
    select 1 from public.lab_orders lo where lo.id = lab_results.lab_order_id and lo.provider_id = auth.uid()
  )
) with check (
  public.current_user_role() = 'admin' or exists (
    select 1 from public.lab_orders lo where lo.id = lab_results.lab_order_id and lo.provider_id = auth.uid()
  )
);

-- Payments
create policy "payments patient read" on public.payments
for select using (patient_id = auth.uid() or public.current_user_role() = 'admin');

create policy "payments patient create" on public.payments
for insert with check (patient_id = auth.uid() or public.current_user_role() = 'admin');

create policy "payments admin update" on public.payments
for update using (public.current_user_role() = 'admin');


