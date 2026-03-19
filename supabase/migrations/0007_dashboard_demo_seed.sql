

-- Backfill basic profile fields so seeded dashboard data renders cleanly.
update public.users
set full_name = coalesce(
      full_name,
      case
        when role = 'provider' then 'Dr. Demo ' || upper(substr(replace(id::text, '-', ''), 1, 4))
        when role = 'patient' then 'Patient ' || upper(substr(replace(id::text, '-', ''), 1, 4))
        else full_name
      end
    ),
    phone = coalesce(phone, '+1-555-0100')
where role in ('patient', 'provider');

update public.patients
set gender = coalesce(gender, 'Not specified'),
    insurance = coalesce(insurance, 'Healthyfy Standard Plan'),
    medical_history = coalesce(medical_history, 'Routine preventive care and annual lab review.'),
    condition_summary = coalesce(condition_summary, 'Stable follow-up with preventive monitoring.'),
    priority = coalesce(priority, 'normal'),
    date_of_birth = coalesce(date_of_birth, (current_date - interval '32 years')::date),
    onboarding_completed = true;

with first_category as (
  select id, name
  from public.provider_categories
  order by name
  limit 1
)
update public.providers p
set phone = coalesce(p.phone, u.phone),
    category_id = coalesce(p.category_id, fc.id),
    specialization = coalesce(p.specialization, fc.name),
    license_number = coalesce(p.license_number, 'LIC-' || upper(substr(replace(p.user_id::text, '-', ''), 1, 8))),
    experience = coalesce(p.experience, 8),
    hospital = coalesce(p.hospital, 'Healthyfy General Hospital'),
    bio = coalesce(p.bio, 'Experienced clinician focused on follow-ups and preventive care.'),
    onboarding_completed = true
from public.users u
cross join first_category fc
where u.id = p.user_id;

update public.users
set status = 'active'
where role in ('patient', 'provider');

update public.providers
set status = 'active'
where status <> 'active';

-- Seed schedule slots for each provider.
insert into public.provider_availability (provider_id, day_of_week, start_time, end_time, is_active)
select
  p.user_id,
  slot.day_of_week,
  slot.start_time,
  slot.end_time,
  true
from public.providers p
cross join (
  values
    (1::smallint, '09:00'::time, '13:00'::time),
    (3::smallint, '10:00'::time, '15:00'::time),
    (5::smallint, '11:00'::time, '16:00'::time)
) as slot(day_of_week, start_time, end_time)
where not exists (
  select 1
  from public.provider_availability pa
  where pa.provider_id = p.user_id
    and pa.day_of_week = slot.day_of_week
    and pa.start_time = slot.start_time
    and pa.end_time = slot.end_time
);

-- Build deterministic provider/patient demo pairs.
with demo_pairs as (
  select
    pt.user_id as patient_id,
    pr.user_id as provider_id,
    row_number() over (order by pt.user_id, pr.user_id) as pair_no
  from public.patients pt
  cross join public.providers pr
)
insert into public.appointments (
  patient_id,
  provider_id,
  start_time,
  end_time,
  status,
  reason,
  meeting_url
)
select
  pair.patient_id,
  pair.provider_id,
  date_trunc('minute', now() - interval '7 days' + (pair.pair_no * interval '4 hours')),
  date_trunc('minute', now() - interval '7 days' + (pair.pair_no * interval '4 hours') + interval '30 minutes'),
  'completed'::public.appointment_status,
  'Follow-up consultation',
  'https://demo.daily.co/follow-up-' || substr(replace(pair.provider_id::text, '-', ''), 1, 8)
from demo_pairs pair
where not exists (
  select 1
  from public.appointments a
  where a.patient_id = pair.patient_id
    and a.provider_id = pair.provider_id
    and a.reason = 'Follow-up consultation'
);

with demo_pairs as (
  select
    pt.user_id as patient_id,
    pr.user_id as provider_id,
    row_number() over (order by pt.user_id, pr.user_id) as pair_no
  from public.patients pt
  cross join public.providers pr
)
insert into public.appointments (
  patient_id,
  provider_id,
  start_time,
  end_time,
  status,
  reason,
  meeting_url
)
select
  pair.patient_id,
  pair.provider_id,
  date_trunc('minute', now() + interval '2 days' + (pair.pair_no * interval '3 hours')),
  date_trunc('minute', now() + interval '2 days' + (pair.pair_no * interval '3 hours') + interval '30 minutes'),
  'confirmed'::public.appointment_status,
  'Blood pressure review',
  'https://demo.daily.co/review-' || substr(replace(pair.provider_id::text, '-', ''), 1, 8)
from demo_pairs pair
where not exists (
  select 1
  from public.appointments a
  where a.patient_id = pair.patient_id
    and a.provider_id = pair.provider_id
    and a.reason = 'Blood pressure review'
);

with demo_pairs as (
  select
    pt.user_id as patient_id,
    pr.user_id as provider_id,
    row_number() over (order by pt.user_id, pr.user_id) as pair_no
  from public.patients pt
  cross join public.providers pr
)
insert into public.vital_signs (
  patient_id,
  provider_id,
  heart_rate,
  systolic_bp,
  diastolic_bp,
  weight,
  glucose,
  recorded_at,
  notes
)
select
  pair.patient_id,
  pair.provider_id,
  68 + (pair.pair_no % 10),
  118 + (pair.pair_no % 7),
  76 + (pair.pair_no % 5),
  70 + (pair.pair_no % 8),
  96 + (pair.pair_no % 6),
  now() - interval '5 days' + (pair.pair_no * interval '2 hours'),
  'Routine vitals check'
from demo_pairs pair
where not exists (
  select 1
  from public.vital_signs vs
  where vs.patient_id = pair.patient_id
    and vs.provider_id = pair.provider_id
    and vs.notes = 'Routine vitals check'
);

with demo_pairs as (
  select
    pt.user_id as patient_id,
    pr.user_id as provider_id
  from public.patients pt
  cross join public.providers pr
)
insert into public.medical_records (
  patient_id,
  provider_id,
  diagnosis,
  treatment_plan,
  attachments
)
select
  pair.patient_id,
  pair.provider_id,
  'Preventive care follow-up',
  'Continue hydration, monitor blood pressure weekly, and attend next scheduled review.',
  jsonb_build_array(jsonb_build_object('type', 'summary', 'label', 'Demo dashboard seed'))
from demo_pairs pair
where not exists (
  select 1
  from public.medical_records mr
  where mr.patient_id = pair.patient_id
    and mr.provider_id = pair.provider_id
    and mr.diagnosis = 'Preventive care follow-up'
);

with demo_pairs as (
  select
    pt.user_id as patient_id,
    pr.user_id as provider_id
  from public.patients pt
  cross join public.providers pr
)
insert into public.prescriptions (
  patient_id,
  provider_id,
  medication_name,
  dosage,
  frequency,
  duration,
  instructions
)
select
  pair.patient_id,
  pair.provider_id,
  'Vitamin D',
  '1000 IU',
  'Once daily',
  '30 days',
  'Take after breakfast.'
from demo_pairs pair
where not exists (
  select 1
  from public.prescriptions prx
  where prx.patient_id = pair.patient_id
    and prx.provider_id = pair.provider_id
    and prx.medication_name = 'Vitamin D'
);

with demo_pairs as (
  select
    pt.user_id as patient_id,
    pr.user_id as provider_id
  from public.patients pt
  cross join public.providers pr
)
insert into public.medical_documents (
  patient_id,
  provider_id,
  title,
  file_path,
  mime_type
)
select
  pair.patient_id,
  pair.provider_id,
  'Care plan summary',
  'demo/care-plan-' || substr(replace(pair.patient_id::text, '-', ''), 1, 8) || '.pdf',
  'application/pdf'
from demo_pairs pair
where not exists (
  select 1
  from public.medical_documents md
  where md.patient_id = pair.patient_id
    and md.provider_id = pair.provider_id
    and md.title = 'Care plan summary'
);

with demo_pairs as (
  select
    pt.user_id as patient_id,
    pr.user_id as provider_id
  from public.patients pt
  cross join public.providers pr
)
insert into public.messages (
  sender_id,
  recipient_id,
  content,
  read_at
)
select
  pair.provider_id,
  pair.patient_id,
  'Your follow-up results look stable. See you at the next review.',
  null
from demo_pairs pair
where not exists (
  select 1
  from public.messages m
  where m.sender_id = pair.provider_id
    and m.recipient_id = pair.patient_id
    and m.content = 'Your follow-up results look stable. See you at the next review.'
);

with demo_pairs as (
  select
    pt.user_id as patient_id,
    pr.user_id as provider_id
  from public.patients pt
  cross join public.providers pr
)
insert into public.messages (
  sender_id,
  recipient_id,
  content,
  read_at
)
select
  pair.patient_id,
  pair.provider_id,
  'Thanks doctor, I will keep tracking my readings before the visit.',
  now()
from demo_pairs pair
where not exists (
  select 1
  from public.messages m
  where m.sender_id = pair.patient_id
    and m.recipient_id = pair.provider_id
    and m.content = 'Thanks doctor, I will keep tracking my readings before the visit.'
);


