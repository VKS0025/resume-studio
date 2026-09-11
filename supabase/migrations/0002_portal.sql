-- Career portal: jobs, alerts, notifications, study material and profiles.
--
-- Two access shapes run through this file:
--   * Public catalogue  (jobs, study_materials, study_categories) — readable by
--     anyone including signed-out visitors; only an admin or the ingestion job
--     may write.
--   * Personal rows     (saved_jobs, job_alerts, notifications, profiles) —
--     owner-only, same as resumes in 0001.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------- profiles --

-- Every signed-in user gets exactly one profile row, keyed by their auth id.
-- `role` is what gates admin writes below; promote someone by hand with
--   update public.profiles set role = 'admin' where id = '<uuid>';
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  role        text not null default 'student' check (role in ('student', 'admin')),
  full_name   text not null default '',
  headline    text not null default '',
  location    text not null default '',
  about       text not null default '',
  skills      text[] not null default '{}',
  links       jsonb not null default '{}'::jsonb,
  avatar_url  text not null default '',
  is_public   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- A profile must exist before the portal can read a role, so create it as part
-- of signup rather than hoping the client remembers to.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Reused by every catalogue policy below.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- -------------------------------------------------------------------- jobs --

create table if not exists public.jobs (
  id              uuid primary key default gen_random_uuid(),
  source          text not null default 'manual',
  -- Natural key from the upstream feed; lets re-ingestion update instead of
  -- duplicating. Null for hand-written posts.
  source_id       text,
  title           text not null,
  company         text not null default '',
  company_logo    text not null default '',
  location        text not null default '',
  is_remote       boolean not null default false,
  sector          text not null default 'private'
                    check (sector in ('private', 'government', 'internship')),
  employment_type text not null default 'full_time'
                    check (employment_type in ('full_time','part_time','contract','internship','temporary')),
  category        text not null default '',
  description     text not null default '',
  apply_url       text not null default '',
  salary_min      numeric,
  salary_max      numeric,
  salary_period   text not null default 'year'
                    check (salary_period in ('hour','month','year')),
  currency        text not null default 'INR',
  qualification   text not null default '',
  experience      text not null default '',
  tags            text[] not null default '{}',
  posted_at       timestamptz not null default now(),
  -- Government notifications live and die by their closing date.
  deadline        date,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  -- A stored column rather than an expression index: PostgREST can only run
  -- full-text search against a real column, which is how the browse page
  -- searches without shipping every row to the client.
  search_vector   tsvector generated always as (
    to_tsvector('english',
      coalesce(title, '') || ' ' ||
      coalesce(company, '') || ' ' ||
      coalesce(location, '') || ' ' ||
      coalesce(category, '') || ' ' ||
      coalesce(qualification, '') || ' ' ||
      coalesce(description, ''))
  ) stored
);

-- One row per upstream listing, so ingestion can upsert safely.
--
-- Deliberately NOT a partial index: ON CONFLICT (source, source_id) can only
-- use a partial index if the statement repeats its WHERE clause, which the
-- client library cannot express. A plain unique index is fine here because
-- Postgres treats NULLs as distinct, so hand-written posts (source_id null)
-- can still be inserted freely.
create unique index if not exists jobs_source_unique
  on public.jobs (source, source_id);

create index if not exists jobs_browse_idx
  on public.jobs (is_active, posted_at desc);
create index if not exists jobs_sector_idx
  on public.jobs (sector, is_active, posted_at desc);

create index if not exists jobs_search_idx on public.jobs using gin (search_vector);

-- --------------------------------------------------------------- saved jobs --

create table if not exists public.saved_jobs (
  user_id    uuid not null references auth.users (id) on delete cascade,
  job_id     uuid not null references public.jobs (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, job_id)
);

-- ------------------------------------------------------------- job alerts --

create table if not exists public.job_alerts (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users (id) on delete cascade,
  label            text not null default 'My alert',
  keywords         text not null default '',
  location         text not null default '',
  sector           text,
  employment_type  text,
  email_digest     boolean not null default true,
  is_active        boolean not null default true,
  -- Ingestion only considers jobs newer than this, so a student is never told
  -- twice about the same opening.
  last_matched_at  timestamptz not null default now(),
  created_at       timestamptz not null default now()
);

create index if not exists job_alerts_active_idx
  on public.job_alerts (is_active, user_id);

-- ----------------------------------------------------------- notifications --

create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  kind       text not null default 'job_match'
               check (kind in ('job_match','deadline','system')),
  title      text not null,
  body       text not null default '',
  link       text not null default '',
  read_at    timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_inbox_idx
  on public.notifications (user_id, read_at, created_at desc);

-- --------------------------------------------------------- study material --

create table if not exists public.study_categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  description text not null default '',
  icon        text not null default 'book',
  sort_order  integer not null default 0
);

create table if not exists public.study_materials (
  id           uuid primary key default gen_random_uuid(),
  category_id  uuid references public.study_categories (id) on delete set null,
  title        text not null,
  description  text not null default '',
  kind         text not null default 'notes'
                 check (kind in ('notes','previous_paper','syllabus','book','video','link')),
  subject      text not null default '',
  exam         text not null default '',
  year         integer,
  -- Either a file in the 'study' storage bucket or an off-site link.
  file_path    text not null default '',
  external_url text not null default '',
  file_size    bigint,
  downloads    integer not null default 0,
  uploaded_by  uuid references auth.users (id) on delete set null,
  is_published boolean not null default true,
  created_at   timestamptz not null default now()
);

create index if not exists study_materials_browse_idx
  on public.study_materials (is_published, category_id, created_at desc);

-- -------------------------------------------------------------------- RLS --

alter table public.profiles         enable row level security;
alter table public.jobs             enable row level security;
alter table public.saved_jobs       enable row level security;
alter table public.job_alerts       enable row level security;
alter table public.notifications    enable row level security;
alter table public.study_categories enable row level security;
alter table public.study_materials  enable row level security;

-- profiles: your own row always; other people's only when they opted in.
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select
  using (auth.uid() = id or is_public);

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles for update
  using (auth.uid() = id) with check (auth.uid() = id);

-- jobs + study material: a public catalogue. Anyone may read an active row;
-- only an admin may write. The ingestion job uses the service role, which
-- bypasses RLS entirely and so needs no policy of its own.
drop policy if exists jobs_public_read on public.jobs;
create policy jobs_public_read on public.jobs for select using (is_active);

drop policy if exists jobs_admin_write on public.jobs;
create policy jobs_admin_write on public.jobs for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists study_categories_public_read on public.study_categories;
create policy study_categories_public_read on public.study_categories for select using (true);

drop policy if exists study_categories_admin_write on public.study_categories;
create policy study_categories_admin_write on public.study_categories for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists study_materials_public_read on public.study_materials;
create policy study_materials_public_read on public.study_materials for select
  using (is_published);

drop policy if exists study_materials_admin_write on public.study_materials;
create policy study_materials_admin_write on public.study_materials for all
  using (public.is_admin()) with check (public.is_admin());

-- Personal rows: owner-only, all verbs.
drop policy if exists saved_jobs_own on public.saved_jobs;
create policy saved_jobs_own on public.saved_jobs for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists job_alerts_own on public.job_alerts;
create policy job_alerts_own on public.job_alerts for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Notifications are written by the ingestion job (service role) and only ever
-- read or marked read by their owner — hence no insert policy here.
drop policy if exists notifications_select_own on public.notifications;
create policy notifications_select_own on public.notifications for select
  using (auth.uid() = user_id);

drop policy if exists notifications_update_own on public.notifications;
create policy notifications_update_own on public.notifications for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists notifications_delete_own on public.notifications;
create policy notifications_delete_own on public.notifications for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------- touches --

drop trigger if exists jobs_touch_updated_at on public.jobs;
create trigger jobs_touch_updated_at
  before update on public.jobs
  for each row execute function public.touch_updated_at();

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- Students may not write to study_materials (admin-only policy above), so the
-- download counter goes through a definer function instead of an UPDATE that
-- RLS would silently discard.
create or replace function public.bump_material_download(material_id uuid)
returns void
language sql
security definer set search_path = public
as $$
  update public.study_materials
     set downloads = downloads + 1
   where id = material_id and is_published;
$$;

revoke all on function public.bump_material_download(uuid) from public;
grant execute on function public.bump_material_download(uuid) to anon, authenticated;

-- ------------------------------------------------------- starter taxonomy --

insert into public.study_categories (slug, name, description, icon, sort_order) values
  ('ssc-railway',    'SSC & Railway',        'CGL, CHSL, MTS, GD, RRB NTPC and Group D.',      'train',    10),
  ('banking',        'Banking & Insurance',  'IBPS, SBI PO/Clerk, RBI, NABARD, LIC.',          'bank',     20),
  ('upsc-state',     'UPSC & State PSC',     'Prelims, Mains, optionals and state services.',  'landmark', 30),
  ('engineering',    'Engineering & GATE',   'GATE, ESE, PSU recruitment and core subjects.',  'cog',      40),
  ('campus-tech',    'Campus & Tech',        'DSA, aptitude, system design and interviews.',   'code',     50),
  ('teaching',       'Teaching & UGC NET',   'CTET, state TETs, UGC NET and B.Ed entrance.',   'school',   60)
on conflict (slug) do nothing;
