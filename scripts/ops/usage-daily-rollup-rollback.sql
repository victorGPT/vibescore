drop trigger if exists vibeusage_tracker_hourly_daily_rollup_trg on public.vibeusage_tracker_hourly;
drop function if exists public.vibeusage_apply_daily_rollup_delta();
drop function if exists public.vibeusage_rebuild_daily_rollup(date, date);
drop table if exists public.vibeusage_tracker_daily_rollup;
