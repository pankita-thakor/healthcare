begin;

-- 1. Ensure RLS is enabled
alter table public.provider_availability enable row level security;

-- 2. Allow all authenticated users to read provider availability
-- (Patients need this to see bookable slots)
drop policy if exists "availability read for all" on public.provider_availability;
create policy "availability read for all" on public.provider_availability
for select to authenticated
using (true);

-- 3. Allow providers to manage their own availability
drop policy if exists "availability manage for providers" on public.provider_availability;
create policy "availability manage for providers" on public.provider_availability
for all to authenticated
using (provider_id = auth.uid())
with check (provider_id = auth.uid());

commit;
