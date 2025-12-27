-- Link codes for one-time CLI bootstrap
-- Change: 2025-12-27-add-link-code-init

create table if not exists public.vibescore_tracker_link_codes (
  id uuid primary key,
  user_id uuid not null,
  code_hash text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_at timestamptz null,
  device_id uuid null references public.vibescore_tracker_devices (id) on delete set null
);

create unique index if not exists vibescore_tracker_link_codes_hash_uniq
  on public.vibescore_tracker_link_codes (code_hash);

create index if not exists vibescore_tracker_link_codes_user_id_idx
  on public.vibescore_tracker_link_codes (user_id);

create index if not exists vibescore_tracker_link_codes_expires_at_idx
  on public.vibescore_tracker_link_codes (expires_at);

alter table public.vibescore_tracker_link_codes enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'vibescore_tracker_link_codes' and policyname = 'project_admin_policy'
  ) then
    create policy project_admin_policy on public.vibescore_tracker_link_codes
      for all to project_admin
      using (true)
      with check (true);
  end if;
end$$;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'vibescore_tracker_link_codes' and policyname = 'vibescore_tracker_link_codes_insert'
  ) then
    create policy vibescore_tracker_link_codes_insert on public.vibescore_tracker_link_codes
      for insert to public
      with check (auth.uid() = user_id);
  end if;
end$$;
