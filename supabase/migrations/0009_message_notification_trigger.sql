

-- Create notification when a message is sent (patient <-> doctor)
-- Uses SECURITY DEFINER so we can insert for the recipient (who is not auth.uid())
create or replace function public.notify_on_new_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  sender_name text;
  notif_title text;
  notif_body text;
begin
  select coalesce(full_name, email, 'Someone') into sender_name
  from public.users where id = new.sender_id;

  notif_title := 'New message';
  notif_body := coalesce(left(new.content, 120), 'New message');
  if length(new.content) > 120 then
    notif_body := notif_body || '...';
  end if;

  insert into public.notifications (user_id, title, body, channel, type, message, read)
  values (
    new.recipient_id,
    notif_title,
    sender_name || ': ' || notif_body,
    'in_app',
    'message',
    notif_body,
    false
  );

  return new;
end;
$$;

drop trigger if exists on_message_insert_notify on public.messages;
create trigger on_message_insert_notify
  after insert on public.messages
  for each row execute procedure public.notify_on_new_message();

-- Enable Realtime for notifications so the Header can subscribe
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;


