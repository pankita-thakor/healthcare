begin;

-- 1. Add updated_at column to clinical_notes
alter table public.clinical_notes 
  add column if not exists updated_at timestamptz not null default now();

-- 2. Create or replace the function to handle updated_at
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 3. Create the trigger for clinical_notes
drop trigger if exists on_clinical_notes_update on public.clinical_notes;
create trigger on_clinical_notes_update
  before update on public.clinical_notes
  for each row execute procedure public.handle_updated_at();

-- 4. RPC to update own user profile (avoids CORS PATCH preflight issues)
create or replace function public.update_my_profile(
  p_full_name text,
  p_phone text,
  p_insurance text default null,
  p_medical_history text default null
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

  update public.users
  set full_name = coalesce(p_full_name, full_name),
      phone = coalesce(p_phone, phone),
      updated_at = now()
  where id = auth.uid();

  if p_insurance is not null or p_medical_history is not null then
    update public.patients
    set insurance = coalesce(p_insurance, insurance),
        medical_history = coalesce(p_medical_history, medical_history)
    where user_id = auth.uid();
  end if;
end;
$$;

grant execute on function public.update_my_profile(text, text, text, text) to authenticated;

commit;
