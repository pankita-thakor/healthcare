begin;

-- 1. Ensure patients can update their own data.
drop policy if exists "patients self update" on public.patients;
create policy "patients self update" on public.patients
for update using (user_id = auth.uid())
with check (user_id = auth.uid());

-- 2. Ensure providers can update their own data.
drop policy if exists "providers self update" on public.providers;
create policy "providers self update" on public.providers
for update using (user_id = auth.uid())
with check (user_id = auth.uid());

-- 3. Ensure users table has update policy (should already be there from 0001, but just in case)
drop policy if exists "users self update" on public.users;
create policy "users self update" on public.users
for update using (id = auth.uid())
with check (id = auth.uid());

commit;
