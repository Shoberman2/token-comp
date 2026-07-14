-- Profiles are created only once the account's email is confirmed, so
-- unconfirmed (throwaway/fake) signups never get a publicly listable
-- profile row. Previously the profile was created on auth.users insert,
-- before the confirmation email was ever clicked.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  handle_input text;
  display_input text;
  company_input text;
  model_input text;
  join_input text;
  inviter_id uuid;
begin
  -- Both the insert and confirmation triggers can match a pre-confirmed
  -- user; only ever create one profile.
  if exists (select 1 from public.profiles where id = new.id) then
    return new;
  end if;

  handle_input := public.normalize_handle(new.raw_user_meta_data->>'handle');

  if char_length(handle_input) < 3 then
    handle_input := 'user_' || substr(replace(new.id::text, '-', ''), 1, 8);
  end if;

  -- The handle can be claimed by someone else between signup and email
  -- confirmation; fall back instead of failing the confirmation.
  if exists (select 1 from public.profiles where handle = handle_input) then
    handle_input := 'user_' || substr(replace(new.id::text, '-', ''), 1, 8);
  end if;

  display_input := nullif(trim(coalesce(new.raw_user_meta_data->>'display_name', '')), '');
  if display_input is null then
    display_input := handle_input;
  end if;

  company_input := nullif(trim(coalesce(new.raw_user_meta_data->>'company', '')), '');
  model_input := nullif(trim(coalesce(new.raw_user_meta_data->>'default_model', '')), '');
  join_input := nullif(trim(coalesce(new.raw_user_meta_data->>'join_code', '')), '');

  if join_input is not null then
    select id into inviter_id
    from public.profiles
    where join_code = join_input
    limit 1;
  end if;

  insert into public.profiles (
    id,
    handle,
    display_name,
    company,
    default_model,
    invited_by
  )
  values (
    new.id,
    handle_input,
    left(display_input, 80),
    left(company_input, 120),
    left(model_input, 120),
    inviter_id
  );

  if inviter_id is not null and inviter_id <> new.id then
    insert into public.follows (follower_id, following_id)
    values
      (new.id, inviter_id),
      (inviter_id, new.id)
    on conflict do nothing;
  end if;

  return new;
end;
$$;

-- Only create a profile at insert when the account arrives pre-confirmed
-- (e.g. OAuth providers).
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
when (new.email_confirmed_at is not null)
execute function public.handle_new_user();

-- Normal email signups get their profile the moment they confirm.
drop trigger if exists on_auth_user_confirmed on auth.users;
create trigger on_auth_user_confirmed
after update of email_confirmed_at on auth.users
for each row
when (old.email_confirmed_at is null and new.email_confirmed_at is not null)
execute function public.handle_new_user();
