-- Fix: Interpret provider availability date+time as local time (not UTC)
-- When provider adds "Mar 20, 10:00" they mean 10:00 in their timezone.
-- Previously (date+time)::timestamptz used session TZ (UTC), causing display shift.
-- Now we interpret as app timezone so slot times match what the provider entered.

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
    ((pa.available_date + pa.start_time) at time zone 'Asia/Kolkata') as slot_start,
    ((pa.available_date + pa.end_time) at time zone 'Asia/Kolkata') as slot_end,
    extract(dow from pa.available_date)::smallint as day_of_week
  from public.provider_availability pa
  join public.users u on u.id = pa.provider_id
  left join public.providers p on p.user_id = pa.provider_id
  left join public.provider_categories pc on pc.id = p.category_id
  where
    ((pa.available_date + pa.start_time) at time zone 'Asia/Kolkata') >= now()
    and ((pa.available_date + pa.start_time) at time zone 'Asia/Kolkata') <= now() + (p_days_ahead || ' days')::interval
    and not exists (
      select 1
      from public.appointments a
      where a.provider_id = pa.provider_id
        and a.start_time >= ((pa.available_date + pa.start_time) at time zone 'Asia/Kolkata')
        and a.start_time < ((pa.available_date + pa.end_time) at time zone 'Asia/Kolkata')
        and a.status in ('pending', 'confirmed')
    )
  order by slot_start asc;
$$;

grant execute on function public.fetch_bookable_provider_slots(integer) to authenticated;
