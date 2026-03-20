-- Notify doctor when a patient books an appointment
-- Uses SECURITY DEFINER so we can insert for the provider (who is not auth.uid())
create or replace function public.notify_on_new_appointment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  patient_name text;
  slot_time text;
begin
  select coalesce(full_name, email, 'A patient') into patient_name
  from public.users where id = new.patient_id;

  slot_time := to_char(new.start_time at time zone 'Asia/Kolkata', 'Dy, Mon DD, YYYY HH24:MI');

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

  return new;
end;
$$;

drop trigger if exists on_appointment_insert_notify_doctor on public.appointments;
create trigger on_appointment_insert_notify_doctor
  after insert on public.appointments
  for each row execute procedure public.notify_on_new_appointment();
