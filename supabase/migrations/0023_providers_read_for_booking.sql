-- Allow patients to read provider directory for booking first-time appointments.
-- The existing policy only allows reading providers the patient already has an appointment with.

create policy "providers read by authenticated for directory" on public.providers
  for select using (auth.uid() is not null);
