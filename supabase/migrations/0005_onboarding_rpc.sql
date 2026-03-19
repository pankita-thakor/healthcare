

create or replace function public.complete_patient_onboarding(
  p_date_of_birth date,
  p_gender text,
  p_insurance text,
  p_medical_history text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.patients (
    user_id,
    date_of_birth,
    gender,
    insurance,
    medical_history,
    onboarding_completed
  )
  values (
    auth.uid(),
    p_date_of_birth,
    p_gender,
    p_insurance,
    p_medical_history,
    true
  )
  on conflict (user_id) do update
    set date_of_birth = excluded.date_of_birth,
        gender = excluded.gender,
        insurance = excluded.insurance,
        medical_history = excluded.medical_history,
        onboarding_completed = true;
end;
$$;

create or replace function public.complete_provider_onboarding(
  p_category_id uuid,
  p_category_name text,
  p_license_number text,
  p_availability jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.providers (
    user_id,
    category_id,
    specialization,
    license_number,
    availability,
    onboarding_completed
  )
  values (
    auth.uid(),
    p_category_id,
    p_category_name,
    p_license_number,
    p_availability,
    true
  )
  on conflict (user_id) do update
    set category_id = excluded.category_id,
        specialization = excluded.specialization,
        license_number = excluded.license_number,
        availability = excluded.availability,
        onboarding_completed = true;
end;
$$;

grant execute on function public.complete_patient_onboarding(date, text, text, text) to authenticated;
grant execute on function public.complete_provider_onboarding(uuid, text, text, jsonb) to authenticated;


