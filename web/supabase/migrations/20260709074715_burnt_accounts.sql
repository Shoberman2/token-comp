create extension if not exists pgcrypto;

create or replace function public.normalize_handle(input text)
returns text
language sql
immutable
as $$
  select left(
    regexp_replace(lower(trim(leading '@' from coalesce(input, ''))), '[^a-z0-9_]', '', 'g'),
    24
  )
$$;

create or replace function public.random_join_code()
returns text
language sql
volatile
as $$
  select lower(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12))
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  handle text not null unique,
  display_name text not null,
  company text,
  avatar_url text,
  bio text,
  website text,
  default_model text,
  join_code text not null unique default public.random_join_code(),
  invited_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_handle_format check (
    handle = public.normalize_handle(handle)
    and char_length(handle) between 3 and 24
  )
);

create table if not exists public.ai_models (
  name text primary key,
  provider text,
  is_base boolean not null default false,
  uses_count bigint not null default 0,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  constraint ai_models_name_length check (char_length(name) between 1 and 120)
);

create table if not exists public.burns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  tokens bigint not null check (tokens > 0),
  cost double precision check (cost is null or cost >= 0),
  model text not null default 'Other',
  image_url text not null,
  caption text,
  created_at timestamptz not null default now()
);

create table if not exists public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint follows_not_self check (follower_id <> following_id)
);

create index if not exists burns_created_at_idx on public.burns (created_at desc);
create index if not exists burns_user_created_at_idx on public.burns (user_id, created_at desc);
create index if not exists follows_following_idx on public.follows (following_id);

create or replace view public.profile_daily_token_totals as
select
  user_id,
  (created_at at time zone 'utc')::date as day,
  sum(tokens)::bigint as tokens
from public.burns
group by user_id, (created_at at time zone 'utc')::date;

create or replace view public.profile_best_days as
select distinct on (user_id)
  user_id,
  day,
  tokens
from public.profile_daily_token_totals
order by user_id, tokens desc, day desc;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists touch_profiles_updated_at on public.profiles;
create trigger touch_profiles_updated_at
before update on public.profiles
for each row execute function public.touch_updated_at();

create or replace function public.record_ai_model(model_name text)
returns text
language plpgsql
security definer
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
  handle_input := public.normalize_handle(new.raw_user_meta_data->>'handle');

  if char_length(handle_input) < 3 then
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
    values (new.id, inviter_id)
    on conflict do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

insert into public.ai_models (name, provider, is_base)
values
  ('Claude Opus 4.8', 'Anthropic', true),
  ('Claude Sonnet 5', 'Anthropic', true),
  ('Claude Haiku 4.5', 'Anthropic', true),
  ('Claude Code', 'Anthropic', true),
  ('GPT-5', 'OpenAI', true),
  ('GPT-5 mini', 'OpenAI', true),
  ('GPT-5 nano', 'OpenAI', true),
  ('GPT-4.1', 'OpenAI', true),
  ('GPT-4.1 mini', 'OpenAI', true),
  ('GPT-4o', 'OpenAI', true),
  ('o3', 'OpenAI', true),
  ('o4-mini', 'OpenAI', true),
  ('Gemini 3 Pro', 'Google', true),
  ('Gemini 3 Flash', 'Google', true),
  ('Gemini 2.5 Pro', 'Google', true),
  ('Gemini 2.5 Flash', 'Google', true),
  ('Grok 4', 'xAI', true),
  ('Grok 3', 'xAI', true),
  ('Llama 4', 'Meta', true),
  ('Llama 3.3', 'Meta', true),
  ('DeepSeek V3', 'DeepSeek', true),
  ('DeepSeek R1', 'DeepSeek', true),
  ('Mistral Large', 'Mistral', true),
  ('Codestral', 'Mistral', true),
  ('Command R+', 'Cohere', true),
  ('Perplexity Sonar', 'Perplexity', true),
  ('Qwen 3', 'Alibaba', true),
  ('Kimi K2', 'Moonshot AI', true),
  ('Other', null, true)
on conflict (name) do update
set provider = excluded.provider,
    is_base = true;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
on conflict (id) do update
set public = true,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

alter table public.profiles enable row level security;
alter table public.burns enable row level security;
alter table public.follows enable row level security;
alter table public.ai_models enable row level security;

drop policy if exists "Profiles are public" on public.profiles;
create policy "Profiles are public"
on public.profiles
for select
using (true);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
on public.profiles
for insert
to authenticated
with check ((select auth.uid()) = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

drop policy if exists "Burns are public" on public.burns;
create policy "Burns are public"
on public.burns
for select
using (true);

drop policy if exists "Users can create their own burns" on public.burns;
create policy "Users can create their own burns"
on public.burns
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own burns" on public.burns;
create policy "Users can update their own burns"
on public.burns
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own burns" on public.burns;
create policy "Users can delete their own burns"
on public.burns
for delete
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Follows are public" on public.follows;
create policy "Follows are public"
on public.follows
for select
using (true);

drop policy if exists "Users can follow as themselves" on public.follows;
create policy "Users can follow as themselves"
on public.follows
for insert
to authenticated
with check ((select auth.uid()) = follower_id);

drop policy if exists "Users can unfollow as themselves" on public.follows;
create policy "Users can unfollow as themselves"
on public.follows
for delete
to authenticated
using ((select auth.uid()) = follower_id);

drop policy if exists "AI models are public" on public.ai_models;
create policy "AI models are public"
on public.ai_models
for select
using (true);

drop policy if exists "Authenticated users can add AI models" on public.ai_models;
create policy "Authenticated users can add AI models"
on public.ai_models
for insert
to authenticated
with check (true);

drop policy if exists "Authenticated users can update AI models" on public.ai_models;
create policy "Authenticated users can update AI models"
on public.ai_models
for update
to authenticated
using (true)
with check (true);

drop policy if exists "Avatar images are public" on storage.objects;
create policy "Avatar images are public"
on storage.objects
for select
using (bucket_id = 'avatars');

drop policy if exists "Users can upload their own avatar" on storage.objects;
create policy "Users can upload their own avatar"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

drop policy if exists "Users can update their own avatar" on storage.objects;
create policy "Users can update their own avatar"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

drop policy if exists "Users can delete their own avatar" on storage.objects;
create policy "Users can delete their own avatar"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

grant usage on schema public to anon, authenticated;
grant select on public.profiles to anon, authenticated;
grant insert, update on public.profiles to authenticated;
grant select on public.burns to anon, authenticated;
grant insert, update, delete on public.burns to authenticated;
grant select on public.follows to anon, authenticated;
grant insert, delete on public.follows to authenticated;
grant select on public.ai_models to anon, authenticated;
grant insert, update on public.ai_models to authenticated;
grant select on public.profile_daily_token_totals to anon, authenticated;
grant select on public.profile_best_days to anon, authenticated;
grant execute on function public.normalize_handle(text) to anon, authenticated;
grant execute on function public.record_ai_model(text) to authenticated;
