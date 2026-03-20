-- Notify patient when doctor reschedules their appointment (RLS blocks client-side insert for other users)

create or replace function public.notify_on_appointment_rescheduled()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  provider_name text;
  slot_time text;
begin
  if new.reschedule_reason is not null
     and (old.start_time is distinct from new.start_time or old.end_time is distinct from new.end_time)
  then
    select coalesce(full_name, 'Your doctor') into provider_name
    from public.users where id = new.provider_id;

    slot_time := to_char(new.start_time at time zone 'Asia/Kolkata', 'Dy, Mon DD, YYYY HH24:MI');

    insert into public.notifications (user_id, title, body, channel, type, message, read)
    values (
      new.patient_id,
      'Appointment Rescheduled',
      provider_name || ' has rescheduled your appointment. New time: ' || slot_time || '. Reason: ' || coalesce(new.reschedule_reason, ''),
      'in_app',
      'appointment',
      'Rescheduled to ' || slot_time,
      false
    );
  end if;

  return new;
end;
$$;

drop trigger if exists on_appointment_update_notify_reschedule on public.appointments;
create trigger on_appointment_update_notify_reschedule
  after update on public.appointments
  for each row execute procedure public.notify_on_appointment_rescheduled();
