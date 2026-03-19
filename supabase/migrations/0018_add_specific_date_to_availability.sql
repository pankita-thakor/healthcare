begin;

-- 1. Add specific_date column to handle one-off availability
alter table public.provider_availability 
  add column if not exists specific_date date;

-- 2. Update the unique constraint to include specific_date
-- First drop existing
drop index if exists public.idx_provider_availability_unique_slot;

-- Create new unique index that handles NULLs correctly (Postgres 15+ supports NULLS NOT DISTINCT, but for compatibility we use a workaround if needed)
-- Since we want either day_of_week OR specific_date to be the defining factor
create unique index idx_provider_availability_unique_recurring 
  on public.provider_availability(provider_id, day_of_week, start_time, end_time) 
  where specific_date is null;

create unique index idx_provider_availability_unique_specific 
  on public.provider_availability(provider_id, specific_date, start_time, end_time) 
  where specific_date is not null;

-- 3. Update save_provider_availability to handle specific_date
create or replace function public.save_provider_availability(
  p_day_of_week smallint,
  p_start_time time,
  p_end_time time,
  p_specific_date date default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.provider_availability (
    provider_id,
    day_of_week,
    start_time,
    end_time,
    specific_date,
    is_active
  )
  values (
    auth.uid(),
    p_day_of_week,
    p_start_time,
    p_end_time,
    p_specific_date,
    true
  )
  on conflict (provider_id, day_of_week, start_time, end_time) where specific_date is null
    do update set is_active = true
  returning id into inserted_id;

  return inserted_id;
exception when unique_violation then
  -- Handle the other conflict case (specific_date)
  update public.provider_availability
  set is_active = true
  where provider_id = auth.uid() 
    and specific_date = p_specific_date
    and start_time = p_start_time
    and end_time = p_end_time
  returning id into inserted_id;
  
  return inserted_id;
end;
$$;

-- 4. Update fetch_bookable_provider_slots to respect specific_date
create or replace function public.fetch_bookable_provider_slots(
  p_days_ahead integer default 14
)
returns table (
  slot_id uuid,
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
  with upcoming_days as (
    select generate_series(current_date, current_date + greatest(p_days_ahead - 1, 0), interval '1 day')::date as day_date
  ),
  slot_occurrences as (
    select
      pa.id as slot_id,
      pa.provider_id,
      u.full_name as provider_name,
      pc.name as category_name,
      pa.day_of_week,
      (day.day_date + pa.start_time)::timestamptz as slot_start,
      (day.day_date + pa.end_time)::timestamptz as slot_end
    from public.provider_availability pa
    join upcoming_days day
      on (
        -- If specific_date is set, it must match exactly
        (pa.specific_date is not null and pa.specific_date = day.day_date)
        OR
        -- If specific_date is null, use recurring day_of_week
        (pa.specific_date is null and extract(dow from day.day_date)::smallint = pa.day_of_week)
      )
    join public.users u
      on u.id = pa.provider_id
    left join public.providers p
      on p.user_id = pa.provider_id
    left join public.provider_categories pc
      on pc.id = p.category_id
    where pa.is_active = true
      and (day.day_date + pa.start_time)::timestamptz >= now()
  )
  select
    so.slot_id,
    so.provider_id,
    so.provider_name,
    coalesce(so.category_name, 'General Medicine') as category_name,
    so.slot_start,
    so.slot_end,
    so.day_of_week
  from slot_occurrences so
  where not exists (
    select 1
    from public.appointments a
    where a.provider_id = so.provider_id
      and a.start_time = so.slot_start
      and a.status in ('pending', 'confirmed', 'completed')
  )
  order by so.slot_start asc, so.provider_name asc;
$$;

commit;
