-- Notify patients (who have had appointments with this provider) when doctor adds a new slot

create or replace function public.notify_patients_on_new_provider_slot()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  provider_name text;
  slot_time text;
  patient_rec record;
begin
  select coalesce(full_name, 'Your doctor') into provider_name
  from public.users where id = new.provider_id;

  slot_time := to_char(
    (new.available_date + new.start_time) at time zone 'Asia/Kolkata',
    'Dy, Mon DD, YYYY HH24:MI'
  );

  for patient_rec in
    select distinct a.patient_id
    from public.appointments a
    where a.provider_id = new.provider_id
      and a.patient_id is not null
  loop
    insert into public.notifications (user_id, title, body, channel, type, message, read)
    values (
      patient_rec.patient_id,
      'New Slot Available',
      provider_name || ' has added a new availability slot on ' || slot_time || '. Book now!',
      'in_app',
      'availability',
      'New slot on ' || slot_time,
      false
    );
  end loop;

  return new;
end;
$$;

drop trigger if exists on_provider_availability_insert_notify_patients on public.provider_availability;
create trigger on_provider_availability_insert_notify_patients
  after insert on public.provider_availability
  for each row execute procedure public.notify_patients_on_new_provider_slot();
