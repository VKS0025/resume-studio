-- Resume Studio: per-user resume documents.
--
-- The whole document lives in one jsonb column. Templates and the editor share
-- a single TypeScript shape (src/lib/resume.ts), and normalizeResume() tolerates
-- rows written before a field existed — so the schema does not need a column
-- per resume field, and adding one never needs a migration.

create extension if not exists "pgcrypto";

create table if not exists public.resumes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  title       text not null default 'Untitled resume',
  data        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists resumes_user_id_updated_at_idx
  on public.resumes (user_id, updated_at desc);

alter table public.resumes enable row level security;

-- Owner-only, all four verbs. A resume is never public.
drop policy if exists "resumes_select_own" on public.resumes;
create policy "resumes_select_own"
  on public.resumes for select
  using (auth.uid() = user_id);

drop policy if exists "resumes_insert_own" on public.resumes;
create policy "resumes_insert_own"
  on public.resumes for insert
  with check (auth.uid() = user_id);

drop policy if exists "resumes_update_own" on public.resumes;
create policy "resumes_update_own"
  on public.resumes for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "resumes_delete_own" on public.resumes;
create policy "resumes_delete_own"
  on public.resumes for delete
  using (auth.uid() = user_id);

-- updated_at is also written by the client on save; this guarantees it even
-- when a row is touched from the SQL editor or a future server route.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists resumes_touch_updated_at on public.resumes;
create trigger resumes_touch_updated_at
  before update on public.resumes
  for each row execute function public.touch_updated_at();
