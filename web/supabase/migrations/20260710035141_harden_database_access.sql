create or replace view public.profile_daily_token_totals
with (security_invoker = true) as
select
  user_id,
  (created_at at time zone 'utc')::date as day,
  sum(tokens)::bigint as tokens
from public.burns
group by user_id, (created_at at time zone 'utc')::date;

create or replace view public.profile_best_days
with (security_invoker = true) as
select distinct on (user_id)
  user_id,
  day,
  tokens
from public.profile_daily_token_totals
order by user_id, tokens desc, day desc;

create or replace function public.record_ai_model(model_name text)
returns text
language plpgsql
security invoker
set search_path = public
as $$
declare
  clean_name text;
begin
  clean_name := left(trim(coalesce(model_name, '')), 120);
  if clean_name = '' then
    clean_name := 'Other';
  end if;

  insert into public.ai_models (name, uses_count, first_seen_at, last_seen_at)
  values (clean_name, 1, now(), now())
  on conflict (name) do update
  set
    uses_count = public.ai_models.uses_count + 1,
    last_seen_at = excluded.last_seen_at;

  return clean_name;
end;
$$;

grant select on public.profile_daily_token_totals to anon, authenticated;
grant select on public.profile_best_days to anon, authenticated;
grant execute on function public.record_ai_model(text) to authenticated;

revoke execute on function public.random_join_code() from public, anon, authenticated;
revoke execute on function public.touch_updated_at() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.record_ai_model(text) from public, anon;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'burns',
  'burns',
  true,
  12582912,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif']::text[]
)
on conflict (id) do update
set public = true,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Burn screenshots are public" on storage.objects;
create policy "Burn screenshots are public"
on storage.objects
for select
using (bucket_id = 'burns');

drop policy if exists "Users can upload their own burn screenshots" on storage.objects;
create policy "Users can upload their own burn screenshots"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'burns'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

drop policy if exists "Users can delete their own burn screenshots" on storage.objects;
create policy "Users can delete their own burn screenshots"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'burns'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);
