-- Fix 409 Conflict on patient onboarding: use UPDATE-first then INSERT to avoid conflict issues

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
declare
  v_updated int;
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

  -- Update existing row first (patient row created by auth trigger on signup)
  update public.patients
  set
    date_of_birth = p_date_of_birth,
    gender = p_gender,
    insurance = p_insurance,
    medical_history = p_medical_history,
    blood_group = nullif(trim(p_blood_group), ''),
    condition_summary = nullif(trim(p_condition_summary), ''),
    allergies = nullif(trim(p_allergies), ''),
    emergency_contact = nullif(trim(p_emergency_contact), ''),
    onboarding_completed = true
  where user_id = auth.uid();

  get diagnostics v_updated = row_count;

  -- Insert only if no row existed
  if v_updated = 0 then
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
    );
  end if;
end;
$$;
