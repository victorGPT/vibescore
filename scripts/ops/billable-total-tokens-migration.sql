alter table public.vibeusage_tracker_hourly
  add column if not exists billable_total_tokens bigint,
  add column if not exists billable_rule_version smallint;

create index concurrently if not exists vibeusage_tracker_hourly_billable_null_idx
  on public.vibeusage_tracker_hourly (hour_start)
  where billable_total_tokens is null;
