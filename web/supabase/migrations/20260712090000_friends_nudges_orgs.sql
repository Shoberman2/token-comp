-- Friends via invite links (mutual), nudges, and organizations with
-- public/private visibility.

-- ---------------------------------------------------------------------------
-- 1) Invite links create a mutual friendship at signup: the inviter follows
--    the new user back (previously only invitee -> inviter).
-- ---------------------------------------------------------------------------

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
    values
      (new.id, inviter_id),
      (inviter_id, new.id)
    on conflict do nothing;
  end if;

  return new;
end;
$$;

-- Signed-in users can also claim an invite link: creates the mutual follow.
create or replace function public.befriend_with_code(invite_code text)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  inviter public.profiles;
begin
  if auth.uid() is null then
    raise exception 'Sign in first.';
  end if;

  select * into inviter
  from public.profiles
  where join_code = nullif(trim(invite_code), '')
  limit 1;

  if inviter.id is null then
    raise exception 'Invalid invite code.';
  end if;

  if inviter.id = auth.uid() then
    raise exception 'That is your own invite link.';
  end if;

  insert into public.follows (follower_id, following_id)
  values
    (auth.uid(), inviter.id),
    (inviter.id, auth.uid())
  on conflict do nothing;

  return inviter;
end;
$$;

revoke execute on function public.befriend_with_code(text) from public, anon;
grant execute on function public.befriend_with_code(text) to authenticated;

-- ---------------------------------------------------------------------------
-- 2) Nudges: poke a friend to post today's usage. One per sender/recipient/day.
-- ---------------------------------------------------------------------------

create table if not exists public.nudges (
  id uuid primary key default gen_random_uuid(),
  from_id uuid not null references public.profiles(id) on delete cascade,
  to_id uuid not null references public.profiles(id) on delete cascade,
  day date not null default (now() at time zone 'utc')::date,
  created_at timestamptz not null default now(),
  unique (from_id, to_id, day),
  check (from_id <> to_id)
);

create index if not exists nudges_to_day_idx on public.nudges (to_id, day);

alter table public.nudges enable row level security;

drop policy if exists "Nudges visible to sender and recipient" on public.nudges;
create policy "Nudges visible to sender and recipient"
on public.nudges for select
to authenticated
using (auth.uid() = from_id or auth.uid() = to_id);

drop policy if exists "Nudge people you follow" on public.nudges;
create policy "Nudge people you follow"
on public.nudges for insert
to authenticated
with check (
  auth.uid() = from_id
  and exists (
    select 1 from public.follows f
    where f.follower_id = auth.uid() and f.following_id = to_id
  )
);

grant select, insert on public.nudges to authenticated;

-- ---------------------------------------------------------------------------
-- 3) Organizations: groups with public or private visibility. Private orgs
--    (page, members, group feed) are only visible to members.
-- ---------------------------------------------------------------------------

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  visibility text not null default 'public' check (visibility in ('public', 'private')),
  join_code text not null unique default public.random_join_code(),
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.organization_members (
  org_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  primary key (org_id, user_id)
);

create index if not exists organization_members_user_idx on public.organization_members (user_id);

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;

-- Security-definer membership check avoids recursive RLS between the two tables.
create or replace function public.is_org_member(org uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.organization_members m
    where m.org_id = org and m.user_id = auth.uid()
  );
$$;

revoke execute on function public.is_org_member(uuid) from public;
grant execute on function public.is_org_member(uuid) to anon, authenticated;

drop policy if exists "Public orgs are visible, private to members" on public.organizations;
create policy "Public orgs are visible, private to members"
on public.organizations for select
to anon, authenticated
using (visibility = 'public' or public.is_org_member(id));

drop policy if exists "Org owners can update" on public.organizations;
create policy "Org owners can update"
on public.organizations for update
to authenticated
using (
  exists (
    select 1 from public.organization_members m
    where m.org_id = id and m.user_id = auth.uid() and m.role = 'owner'
  )
)
with check (visibility in ('public', 'private'));

drop policy if exists "Org members visible with the org" on public.organization_members;
create policy "Org members visible with the org"
on public.organization_members for select
to anon, authenticated
using (
  exists (
    select 1 from public.organizations o
    where o.id = org_id and (o.visibility = 'public' or public.is_org_member(o.id))
  )
);

drop policy if exists "Members can leave" on public.organization_members;
create policy "Members can leave"
on public.organization_members for delete
to authenticated
using (user_id = auth.uid());

grant select on public.organizations to anon, authenticated;
grant update (visibility) on public.organizations to authenticated;
grant select, delete on public.organization_members to anon, authenticated;

-- Creation and joining go through security-definer functions so join codes
-- of private orgs never need to be readable.

create or replace function public.create_organization(org_name text, org_visibility text default 'public')
returns public.organizations
language plpgsql
security definer
set search_path = public
as $$
declare
  clean_name text;
  base_slug text;
  final_slug text;
  created public.organizations;
begin
  if auth.uid() is null then
    raise exception 'Sign in first.';
  end if;

  clean_name := left(nullif(trim(org_name), ''), 80);
  if clean_name is null then
    raise exception 'Organization name is required.';
  end if;

  if org_visibility not in ('public', 'private') then
    raise exception 'Visibility must be public or private.';
  end if;

  base_slug := left(regexp_replace(lower(clean_name), '[^a-z0-9]+', '-', 'g'), 40);
  base_slug := trim(both '-' from base_slug);
  if base_slug = '' then
    base_slug := 'org';
  end if;

  final_slug := base_slug;
  while exists (select 1 from public.organizations where slug = final_slug) loop
    final_slug := base_slug || '-' || substr(md5(random()::text), 1, 4);
  end loop;

  insert into public.organizations (name, slug, visibility, created_by)
  values (clean_name, final_slug, org_visibility, auth.uid())
  returning * into created;

  insert into public.organization_members (org_id, user_id, role)
  values (created.id, auth.uid(), 'owner');

  return created;
end;
$$;

create or replace function public.join_organization(invite_code text)
returns public.organizations
language plpgsql
security definer
set search_path = public
as $$
declare
  org public.organizations;
begin
  if auth.uid() is null then
    raise exception 'Sign in first.';
  end if;

  select * into org
  from public.organizations
  where join_code = nullif(trim(invite_code), '')
  limit 1;

  if org.id is null then
    raise exception 'Invalid organization invite code.';
  end if;

  insert into public.organization_members (org_id, user_id, role)
  values (org.id, auth.uid(), 'member')
  on conflict do nothing;

  return org;
end;
$$;

revoke execute on function public.create_organization(text, text) from public, anon;
revoke execute on function public.join_organization(text) from public, anon;
grant execute on function public.create_organization(text, text) to authenticated;
grant execute on function public.join_organization(text) to authenticated;
