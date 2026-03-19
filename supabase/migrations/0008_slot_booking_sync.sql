

-- Remove duplicate recurring slots before enforcing uniqueness.
with ranked_slots as (
  select
    id,
    row_number() over (
      partition by provider_id, day_of_week, start_time, end_time
      order by created_at asc, id asc
    ) as slot_rank
  from public.provider_availability
)
delete from public.provider_availability pa
using ranked_slots rs
where pa.id = rs.id
  and rs.slot_rank > 1;

create unique index if not exists idx_provider_availability_unique_slot
  on public.provider_availability(provider_id, day_of_week, start_time, end_time);

create or replace function public.save_provider_availability(
  p_day_of_week smallint,
  p_start_time time,
  p_end_time time
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
    is_active
  )
  values (
    auth.uid(),
    p_day_of_week,
    p_start_time,
    p_end_time,
    true
  )
  on conflict (provider_id, day_of_week, start_time, end_time) do update
    set is_active = true
  returning id into inserted_id;

  return inserted_id;
end;
$$;

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
      -- Combine date and time, then cast to timestamptz (uses server/session timezone)
      (day.day_date + pa.start_time)::timestamptz as slot_start,
      (day.day_date + pa.end_time)::timestamptz as slot_end
    from public.provider_availability pa
    join upcoming_days day
      on extract(dow from day.day_date)::smallint = pa.day_of_week
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

create or replace function public.book_provider_slot(
  p_provider_id uuid,
  p_slot_start timestamptz,
  p_slot_end timestamptz,
  p_reason text default 'Scheduled from provider availability'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_appointment_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if not exists (
    select 1
    from public.provider_availability pa
    where pa.provider_id = p_provider_id
      and pa.is_active = true
      and pa.day_of_week = extract(dow from p_slot_start)::smallint
      -- Compare the time portion regardless of timezone offset
      and pa.start_time = p_slot_start::time
      and pa.end_time = p_slot_end::time
  ) then
    raise exception 'Selected slot is not available';
  end if;

  if exists (
    select 1
    from public.appointments a
    where a.provider_id = p_provider_id
      and a.start_time = p_slot_start
      and a.status in ('pending', 'confirmed', 'completed')
  ) then
    raise exception 'Selected slot has already been booked';
  end if;

  insert into public.appointments (
    patient_id,
    provider_id,
    start_time,
    end_time,
    status,
    reason,
    meeting_url
  )
  values (
    auth.uid(),
    p_provider_id,
    p_slot_start,
    p_slot_end,
    'pending',
    p_reason,
    null
  )
  returning id into new_appointment_id;

  return new_appointment_id;
end;
$$;

grant execute on function public.save_provider_availability(smallint, time, time) to authenticated;
grant execute on function public.fetch_bookable_provider_slots(integer) to authenticated;
grant execute on function public.book_provider_slot(uuid, timestamptz, timestamptz, text) to authenticated;


