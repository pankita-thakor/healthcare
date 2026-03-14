begin;

-- Provider category catalog
create table if not exists public.provider_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamptz not null default now()
);

insert into public.provider_categories (name, description)
values
  ('Cardiology', 'Heart and cardiovascular care'),
  ('Dermatology', 'Skin, hair, and nail care'),
  ('Endocrinology', 'Hormonal and metabolic disorders'),
  ('General Medicine', 'Primary and preventive care'),
  ('Neurology', 'Brain and nervous system care'),
  ('Pediatrics', 'Infant, child, and adolescent care'),
  ('Psychiatry', 'Mental health and behavioral care')
on conflict (name) do nothing;

-- Expand provider profile to support signup requirements
alter table public.providers
  add column if not exists phone text,
  add column if not exists category_id uuid references public.provider_categories(id) on delete set null,
  add column if not exists experience integer,
  add column if not exists hospital text;

-- Patient list metadata for provider dashboard view
alter table public.patients
  add column if not exists condition_summary text,
  add column if not exists priority text not null default 'normal';

-- Conversation model for direct provider-patient messaging
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.users(id) on delete cascade,
  provider_id uuid not null references public.users(id) on delete cascade,
  appointment_id uuid references public.appointments(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (patient_id, provider_id, appointment_id)
);

alter table public.messages
  add column if not exists conversation_id uuid references public.conversations(id) on delete set null;

-- Vitals timeline for charting
create table if not exists public.vital_signs (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.users(id) on delete cascade,
  provider_id uuid references public.users(id) on delete set null,
  heart_rate integer,
  systolic_bp integer,
  diastolic_bp integer,
  weight numeric(6,2),
  glucose numeric(6,2),
  recorded_at timestamptz not null default now(),
  notes text
);

-- Documents uploaded for patients
create table if not exists public.medical_documents (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.users(id) on delete cascade,
  provider_id uuid references public.users(id) on delete set null,
  title text not null,
  file_path text not null,
  mime_type text,
  uploaded_at timestamptz not null default now()
);

-- Provider availability slots
create table if not exists public.provider_availability (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.users(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_conversations_provider on public.conversations(provider_id, created_at desc);
create index if not exists idx_conversations_patient on public.conversations(patient_id, created_at desc);
create index if not exists idx_messages_conversation on public.messages(conversation_id, created_at desc);
create index if not exists idx_vitals_patient_time on public.vital_signs(patient_id, recorded_at desc);
create index if not exists idx_documents_patient_time on public.medical_documents(patient_id, uploaded_at desc);
create index if not exists idx_provider_availability_provider on public.provider_availability(provider_id, day_of_week);

alter table public.provider_categories enable row level security;
alter table public.conversations enable row level security;
alter table public.vital_signs enable row level security;
alter table public.medical_documents enable row level security;
alter table public.provider_availability enable row level security;

-- Replace trigger function to map extended provider signup metadata
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  incoming_role public.user_role;
  provider_category uuid;
  provider_experience int;
begin
  incoming_role := coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'patient');
  provider_category := nullif(new.raw_user_meta_data ->> 'category_id', '')::uuid;
  provider_experience := nullif(new.raw_user_meta_data ->> 'experience', '')::int;

  insert into public.users (id, email, full_name, role, status, phone)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', null),
    incoming_role,
    case when incoming_role = 'provider' then 'pending_approval'::public.account_status else 'active'::public.account_status end,
    nullif(new.raw_user_meta_data ->> 'phone', '')
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = excluded.full_name,
        role = excluded.role,
        phone = coalesce(excluded.phone, users.phone);

  if incoming_role = 'patient' then
    insert into public.patients (user_id)
    values (new.id)
    on conflict (user_id) do nothing;
  elseif incoming_role = 'provider' then
    insert into public.providers (
      user_id,
      phone,
      license_number,
      category_id,
      experience,
      hospital,
      bio,
      status
    )
    values (
      new.id,
      nullif(new.raw_user_meta_data ->> 'phone', ''),
      nullif(new.raw_user_meta_data ->> 'license_number', ''),
      provider_category,
      provider_experience,
      nullif(new.raw_user_meta_data ->> 'hospital', ''),
      nullif(new.raw_user_meta_data ->> 'bio', ''),
      'pending_approval'
    )
    on conflict (user_id) do update
      set phone = coalesce(excluded.phone, providers.phone),
          license_number = coalesce(excluded.license_number, providers.license_number),
          category_id = coalesce(excluded.category_id, providers.category_id),
          experience = coalesce(excluded.experience, providers.experience),
          hospital = coalesce(excluded.hospital, providers.hospital),
          bio = coalesce(excluded.bio, providers.bio);
  end if;

  return new;
end;
$$;

-- RLS policies
create policy "provider categories read public" on public.provider_categories
for select using (true);

create policy "provider categories admin manage" on public.provider_categories
for all using (public.current_user_role() = 'admin') with check (public.current_user_role() = 'admin');

create policy "conversations participant read" on public.conversations
for select using (
  patient_id = auth.uid() or provider_id = auth.uid() or public.current_user_role() = 'admin'
);

create policy "conversations provider create" on public.conversations
for insert with check (provider_id = auth.uid() or public.current_user_role() = 'admin');

create policy "vital signs participant read" on public.vital_signs
for select using (
  patient_id = auth.uid() or public.current_user_role() = 'admin' or
  exists (
    select 1 from public.appointments a
    where a.patient_id = vital_signs.patient_id and a.provider_id = auth.uid()
  )
);

create policy "vital signs provider write" on public.vital_signs
for insert with check (
  provider_id = auth.uid() or public.current_user_role() = 'admin'
);

create policy "medical documents participant read" on public.medical_documents
for select using (
  patient_id = auth.uid() or public.current_user_role() = 'admin' or
  exists (
    select 1 from public.appointments a
    where a.patient_id = medical_documents.patient_id and a.provider_id = auth.uid()
  )
);

create policy "medical documents provider write" on public.medical_documents
for insert with check (provider_id = auth.uid() or public.current_user_role() = 'admin');

create policy "provider availability self read" on public.provider_availability
for select using (provider_id = auth.uid() or public.current_user_role() = 'admin');

create policy "provider availability self write" on public.provider_availability
for all using (provider_id = auth.uid() or public.current_user_role() = 'admin')
with check (provider_id = auth.uid() or public.current_user_role() = 'admin');

commit;
