-- Fix: Allow multiple availability slots per provider
-- Run this if you get "duplicate key value violates unique constraint provider_availability_pkey"
-- when adding a second availability slot.

begin;

drop table if exists public.provider_availability cascade;

create table public.provider_availability (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.users(id) on delete cascade,
  available_date date not null,
  start_time time not null,
  end_time time not null,
  created_at timestamptz not null default now()
);

create index idx_provider_availability_provider_date on public.provider_availability(provider_id, available_date);

alter table public.provider_availability enable row level security;

create policy "providers_manage_own_availability" on public.provider_availability
  for all using (provider_id = auth.uid()) with check (provider_id = auth.uid());
create policy "authenticated_read_availability" on public.provider_availability
  for select using (true);

create or replace function public.fetch_bookable_provider_slots(
  p_days_ahead integer default 14
)
returns table (
  slot_id text,
  provider_id uuid,
  provider_name text,
  category_name text,
  slot_start timestamptz,
  slot_end timestamptz,
  day_of_week smallint
)
language sql
security definer
set search_path = public
as $$
  select
    pa.id::text as slot_id,
    pa.provider_id,
    u.full_name as provider_name,
    pc.name as category_name,
    (pa.available_date + pa.start_time)::timestamptz as slot_start,
    (pa.available_date + pa.end_time)::timestamptz as slot_end,
    extract(dow from pa.available_date)::smallint as day_of_week
  from public.provider_availability pa
  join public.users u on u.id = pa.provider_id
  left join public.providers p on p.user_id = pa.provider_id
  left join public.provider_categories pc on pc.id = p.category_id
  where
    (pa.available_date + pa.start_time)::timestamptz >= now()
    and (pa.available_date + pa.start_time)::timestamptz <= now() + (p_days_ahead || ' days')::interval
    and not exists (
      select 1
      from public.appointments a
      where a.provider_id = pa.provider_id
        and a.start_time >= (pa.available_date + pa.start_time)::timestamptz
        and a.start_time < (pa.available_date + pa.end_time)::timestamptz
        and a.status in ('pending', 'confirmed')
    );
$$;

grant execute on function public.fetch_bookable_provider_slots(integer) to authenticated;

commit;
