begin;

-- Drop old triggers on auth.users if any
drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists trg_sync_users_on_auth_insert on auth.users;

-- Drop backup tables if they exist
drop table if exists public._backup_profiles cascade;
drop table if exists public._backup_settings cascade;
drop table if exists public._backup_documents cascade;

-- Drop legacy tables (any order with CASCADE to remove policies/fks)
drop table if exists public.profiles cascade;
drop table if exists public.settings cascade;
drop table if exists public.preferences cascade;
drop table if exists public.documents cascade;
drop table if exists public.users cascade;

commit;

-- =========================================
-- CLEAN SCHEMA (MVP)
-- =========================================
begin;

-- 1) USERS: app-level user table (no passwords here)
create table public.users (
  id                bigserial primary key,
  auth_user_id      uuid not null unique references auth.users(id) on delete cascade,
  full_name         text,
  email             text not null unique,
  registration_date timestamptz not null default now()
);

-- Auto-insert a users row whenever a new auth.users row is created
create or replace function public.handle_new_auth_user_to_users()
returns trigger
language plpgsql
security definer set search_path = public as $$
begin
  insert into public.users (auth_user_id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', null), new.email)
  on conflict (auth_user_id) do nothing;
  return new;
end $$;

create trigger trg_sync_users_on_auth_insert
after insert on auth.users
for each row execute function public.handle_new_auth_user_to_users();

-- RLS: each account user can read/update ONLY his own row
alter table public.users enable row level security;

create policy users_self_select
on public.users for select
to authenticated
using (auth_user_id = auth.uid());

create policy users_self_update
on public.users for update
to authenticated
using (auth_user_id = auth.uid())
with check (auth_user_id = auth.uid());

-- 2) PREFERENCES: (renamed from settings) — no timestamps
create table public.preferences (
  user_id        bigint primary key references public.users(id) on delete cascade, -- one row per user
  font_family    text not null default 'Lexend',
  font_size      int  not null default 18,
  line_spacing   double precision not null default 1.6,
  letter_spacing double precision not null default 0.05,
  theme          text not null default 'light-yellow',
  lead_bold      text not null default 'medium',
  group_size     int  not null default 3,
  lang_hint      text not null default 'auto'
);

alter table public.preferences enable row level security;

create policy preferences_self_select
on public.preferences for select
to authenticated
using (
  exists (
    select 1 from public.users u
    where u.id = public.preferences.user_id
      and u.auth_user_id = auth.uid()
  )
);

create policy preferences_self_insert
on public.preferences for insert
to authenticated
with check (
  exists (
    select 1 from public.users u
    where u.id = public.preferences.user_id
      and u.auth_user_id = auth.uid()
  )
);

create policy preferences_self_update
on public.preferences for update
to authenticated
using (
  exists (
    select 1 from public.users u
    where u.id = public.preferences.user_id
      and u.auth_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.users u
    where u.id = public.preferences.user_id
      and u.auth_user_id = auth.uid()
  )
);

create index idx_preferences_user_id on public.preferences(user_id);

-- 3) DOCUMENTS: metadata only (file in Storage), no content/timestamps
create table public.documents (
  id        bigserial primary key,
  user_id   bigint not null references public.users(id) on delete cascade,
  title     text   not null,
  file_path text   -- e.g. documents/<auth_user_id>/<uuid>.pdf
);

alter table public.documents enable row level security;

create index idx_documents_user_id on public.documents(user_id);

create policy docs_self_select
on public.documents for select
to authenticated
using (
  exists (
    select 1 from public.users u
    where u.id = public.documents.user_id
      and u.auth_user_id = auth.uid()
  )
);

create policy docs_self_crud
on public.documents for all
to authenticated
using (
  exists (
    select 1 from public.users u
    where u.id = public.documents.user_id
      and u.auth_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.users u
    where u.id = public.documents.user_id
      and u.auth_user_id = auth.uid()
  )
);

commit;