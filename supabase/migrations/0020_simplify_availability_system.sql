begin;

-- Step 1: Drop the old, complex availability table and related functions to start fresh.
drop function if exists public.save_provider_availability(smallint, time, time, date);
drop function if exists public.fetch_bookable_provider_slots(integer); -- Drop the old function
drop table if exists public.provider_availability;

-- Step 2: Create a new, simpler table where each provider can only have ONE availability entry.
create table public.provider_availability (
  provider_id uuid primary key references public.users(id) on delete cascade,
  available_date date not null,
  start_time time not null,
  end_time time not null,
  updated_at timestamptz not null default now()
);

-- Step 3: Enable RLS on the new table.
alter table public.provider_availability enable row level security;

-- Step 4: Create policies for the new table.
create policy "providers_manage_own_availability" on public.provider_availability
  for all using (provider_id = auth.uid()) with check (provider_id = auth.uid());
create policy "authenticated_read_availability" on public.provider_availability
  for select using (true);

-- Step 5: Create the NEW RPC for fetching slots.
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
    pa.provider_id::text as slot_id,
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
