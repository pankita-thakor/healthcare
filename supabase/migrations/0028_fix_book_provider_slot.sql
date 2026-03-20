-- Fix book_provider_slot to use available_date schema (provider_availability has available_date, not day_of_week)
-- Matches slots using Asia/Kolkata timezone to align with fetch_bookable_provider_slots
create or replace function public.book_provider_slot(
  p_provider_id uuid,
  p_slot_start timestamptz,
  p_slot_end timestamptz,
  p_reason text default 'Scheduled from patient dashboard'
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
      and ((pa.available_date + pa.start_time) at time zone 'Asia/Kolkata') <= p_slot_start
      and ((pa.available_date + pa.end_time) at time zone 'Asia/Kolkata') > p_slot_start
  ) then
    raise exception 'Selected slot is not available';
  end if;

  if exists (
    select 1
    from public.appointments a
    where a.provider_id = p_provider_id
      and a.start_time = p_slot_start
      and a.status in ('pending', 'confirmed')
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

grant execute on function public.book_provider_slot(uuid, timestamptz, timestamptz, text) to authenticated;
