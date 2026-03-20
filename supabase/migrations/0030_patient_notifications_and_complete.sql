-- 1. Notify patient when they book (confirmation) - extend existing trigger
-- 2. Notify patient when consultation is marked complete

-- Modify: also notify patient on new appointment (booking confirmation)
create or replace function public.notify_on_new_appointment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  patient_name text;
  provider_name text;
  slot_time text;
begin
  select coalesce(full_name, email, 'A patient') into patient_name
  from public.users where id = new.patient_id;

  select coalesce(full_name, 'Your doctor') into provider_name
  from public.users where id = new.provider_id;

  slot_time := to_char(new.start_time at time zone 'Asia/Kolkata', 'Dy, Mon DD, YYYY HH24:MI');

  -- Notify doctor: patient booked
  insert into public.notifications (user_id, title, body, channel, type, message, read)
  values (
    new.provider_id,
    'New Appointment Booked',
    patient_name || ' has booked an appointment for ' || slot_time,
    'in_app',
    'appointment',
    patient_name || ' booked for ' || slot_time,
    false
  );

  -- Notify patient: booking confirmation
  insert into public.notifications (user_id, title, body, channel, type, message, read)
  values (
    new.patient_id,
    'Appointment Confirmed',
    'Your consultation with ' || provider_name || ' is scheduled for ' || slot_time,
    'in_app',
    'appointment',
    'Booked for ' || slot_time,
    false
  );

  return new;
end;
$$;

-- Notify patient when consultation status changes to completed
create or replace function public.notify_on_appointment_completed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  provider_name text;
  slot_time text;
begin
  if old.status is distinct from 'completed' and new.status = 'completed' then
    select coalesce(full_name, 'Your doctor') into provider_name
    from public.users where id = new.provider_id;

    slot_time := to_char(new.start_time at time zone 'Asia/Kolkata', 'Dy, Mon DD, YYYY HH24:MI');

    insert into public.notifications (user_id, title, body, channel, type, message, read)
    values (
      new.patient_id,
      'Consultation Completed',
      'Your consultation with ' || provider_name || ' on ' || slot_time || ' has been completed.',
      'in_app',
      'appointment',
      'Consultation completed',
      false
    );
  end if;

  return new;
end;
$$;

drop trigger if exists on_appointment_update_notify_patient on public.appointments;
create trigger on_appointment_update_notify_patient
  after update on public.appointments
  for each row execute procedure public.notify_on_appointment_completed();
