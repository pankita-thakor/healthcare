-- Add reschedule_reason for when doctor reschedules an appointment
alter table public.appointments
  add column if not exists reschedule_reason text;

-- Enable Realtime for appointments (bookings/reschedules update everywhere instantly)
-- If this fails (e.g. table already in publication), enable via Supabase Dashboard: Database > Replication
do $$
begin
  alter publication supabase_realtime add table public.appointments;
exception when others then
  null; -- table may already be in publication
end $$;
