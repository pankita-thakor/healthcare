-- Extend complete_patient_onboarding to collect all fields shown on doctor's patient detail page:
-- phone (users), blood_group, condition_summary, allergies, emergency_contact (patients)

create or replace function public.complete_patient_onboarding(
  p_date_of_birth date,
  p_gender text,
  p_insurance text,
  p_medical_history text,
  p_phone text default null,
  p_blood_group text default null,
  p_condition_summary text default null,
  p_allergies text default null,
  p_emergency_contact text default null
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

  -- Update users.phone when provided
  if p_phone is not null and trim(p_phone) != '' then
    update public.users
    set phone = trim(p_phone), updated_at = now()
    where id = auth.uid();
  end if;

  insert into public.patients (
    user_id,
    date_of_birth,
    gender,
    insurance,
    medical_history,
    blood_group,
    condition_summary,
    allergies,
    emergency_contact,
    onboarding_completed
  )
  values (
    auth.uid(),
    p_date_of_birth,
    p_gender,
    p_insurance,
    p_medical_history,
    nullif(trim(p_blood_group), ''),
    nullif(trim(p_condition_summary), ''),
    nullif(trim(p_allergies), ''),
    nullif(trim(p_emergency_contact), ''),
    true
  )
  on conflict (user_id) do update
    set date_of_birth = excluded.date_of_birth,
        gender = excluded.gender,
        insurance = excluded.insurance,
        medical_history = excluded.medical_history,
        blood_group = excluded.blood_group,
        condition_summary = excluded.condition_summary,
        allergies = excluded.allergies,
        emergency_contact = excluded.emergency_contact,
        onboarding_completed = true;
end;
$$;

grant execute on function public.complete_patient_onboarding(date, text, text, text, text, text, text, text, text) to authenticated;
