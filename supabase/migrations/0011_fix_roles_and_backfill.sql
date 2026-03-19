begin;

-- 1. Improve current_user_role to be security definer.
-- This prevents RLS recursion when the function is used within policies on the 'users' table.
create or replace function public.current_user_role()
returns public.user_role
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  user_role public.user_role;
begin
  select role into user_role from public.users where id = auth.uid();
  return user_role;
end;
$$;

-- 2. Backfill existing users from auth.users to public.users.
-- This ensures that users registered before migrations were applied are correctly provisioned.
insert into public.users (id, email, full_name, role, status)
select 
  id, 
  email, 
  coalesce(raw_user_meta_data ->> 'full_name', 'Patient ' || substr(id::text, 1, 5)),
  coalesce((raw_user_meta_data ->> 'role')::public.user_role, 'patient'),
  'active'
from auth.users
on conflict (id) do nothing;

-- 3. Backfill patients table.
insert into public.patients (user_id)
select id 
from public.users 
where role = 'patient'
on conflict (user_id) do nothing;

-- 4. Backfill providers table and ensure status is active for all.
insert into public.providers (user_id, status)
select id, 'active'
from public.users 
where role = 'provider'
on conflict (user_id) do update set status = 'active';

update public.users set status = 'active' where role = 'provider';


-- 5. Ensure doctors can see all users who are patients (for the directory).
drop policy if exists "users read self or admin or provider" on public.users;
create policy "users read directory for providers" on public.users
for select using (
  id = auth.uid()
  or public.current_user_role() = 'admin'
  or public.current_user_role() = 'provider'
);

-- 6. Ensure doctors can see all patient records.
drop policy if exists "patients read self provider admin" on public.patients;
create policy "patients read directory for providers" on public.patients
for select using (
  user_id = auth.uid()
  or public.current_user_role() = 'admin'
  or public.current_user_role() = 'provider'
);

commit;
