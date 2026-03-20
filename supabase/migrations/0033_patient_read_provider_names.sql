-- Allow patients to read provider user profiles (full_name, email) when they have an appointment together.
-- Required for Next Visit and Older Consultations to show doctor names.

drop policy if exists "users read directory for providers" on public.users;
create policy "users read directory for providers" on public.users
for select using (
  id = auth.uid()
  or public.current_user_role() = 'admin'
  or public.current_user_role() = 'provider'
  or exists (
    select 1 from public.appointments a
    where a.patient_id = auth.uid() and a.provider_id = users.id
  )
);
