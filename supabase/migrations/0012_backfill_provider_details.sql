begin;

-- Update the providers table by pulling metadata from auth.users
-- This handles users who registered before the trigger was fully active or fixed.
insert into public.providers (
  user_id, 
  phone, 
  license_number, 
  category_id, 
  experience, 
  hospital, 
  bio, 
  status,
  onboarding_completed
)
select 
  au.id,
  nullif(au.raw_user_meta_data ->> 'phone', ''),
  nullif(au.raw_user_meta_data ->> 'license_number', ''),
  nullif(au.raw_user_meta_data ->> 'category_id', '')::uuid,
  nullif(au.raw_user_meta_data ->> 'experience', '')::int,
  nullif(au.raw_user_meta_data ->> 'hospital', ''),
  nullif(au.raw_user_meta_data ->> 'bio', ''),
  'active',
  true
from auth.users au
where (au.raw_user_meta_data ->> 'role') = 'provider'
on conflict (user_id) do update set 
  phone = coalesce(excluded.phone, public.providers.phone),
  license_number = coalesce(excluded.license_number, public.providers.license_number),
  category_id = coalesce(excluded.category_id, public.providers.category_id),
  experience = coalesce(excluded.experience, public.providers.experience),
  hospital = coalesce(excluded.hospital, public.providers.hospital),
  bio = coalesce(excluded.bio, public.providers.bio),
  status = 'active',
  onboarding_completed = true;

-- Also ensure the users table has the correct status and phone
update public.users u
set 
  status = 'active',
  phone = coalesce(u.phone, (select nullif(raw_user_meta_data ->> 'phone', '') from auth.users where id = u.id))
where u.role = 'provider';

commit;
