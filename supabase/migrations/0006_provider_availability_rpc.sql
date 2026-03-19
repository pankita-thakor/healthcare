

create or replace function public.fetch_provider_availability()
returns table (
  id uuid,
  day_of_week smallint,
  start_time time,
  end_time time,
  is_active boolean
)
language sql
security definer
set search_path = public
as $$
  select
    pa.id,
    pa.day_of_week,
    pa.start_time,
    pa.end_time,
    pa.is_active
  from public.provider_availability pa
  where pa.provider_id = auth.uid()
  order by pa.day_of_week asc, pa.start_time asc
$$;

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
  returning id into inserted_id;

  return inserted_id;
end;
$$;

grant execute on function public.fetch_provider_availability() to authenticated;
grant execute on function public.save_provider_availability(smallint, time, time) to authenticated;


