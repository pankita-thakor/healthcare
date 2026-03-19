begin;

-- 1. Ensure any data in the redundant columns is moved to the preferred columns if not already there.
update public.providers
set 
  specialization = coalesce(specialization, specialty),
  experience = coalesce(experience, years_of_experience);

-- 2. Drop the redundant columns.
alter table public.providers
  drop column if exists specialty,
  drop column if exists years_of_experience;

commit;
