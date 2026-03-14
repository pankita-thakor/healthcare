begin;

alter table public.notifications
  add column if not exists type text default 'info',
  add column if not exists message text,
  add column if not exists read boolean not null default false;

update public.notifications
set message = coalesce(message, body)
where message is null;

update public.notifications
set type = coalesce(type, channel, 'info')
where type is null;

drop policy if exists "notifications owner update" on public.notifications;
create policy "notifications owner update" on public.notifications
for update using (user_id = auth.uid() or public.current_user_role() = 'admin')
with check (user_id = auth.uid() or public.current_user_role() = 'admin');

commit;
