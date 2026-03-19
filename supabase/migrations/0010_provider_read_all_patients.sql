

-- Allow providers to read all registered patients (not just those with appointments)
drop policy if exists "patients read self assigned provider admin" on public.patients;
create policy "patients read self provider admin" on public.patients
for select using (
  user_id = auth.uid()
  or public.current_user_role() = 'admin'
  or public.current_user_role() = 'provider'
);

-- Allow providers to read patient user profiles (for patient directory)
drop policy if exists "users read self or admin" on public.users;
create policy "users read self or admin or provider" on public.users
for select using (
  id = auth.uid()
  or public.current_user_role() = 'admin'
  or public.current_user_role() = 'provider'
  or exists (
    select 1
    from public.appointments a
    where (a.patient_id = users.id and a.provider_id = auth.uid())
       or (a.provider_id = users.id and a.patient_id = auth.uid())
  )
);


