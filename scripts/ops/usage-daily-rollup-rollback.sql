drop trigger if exists vibescore_tracker_hourly_daily_rollup_trg on public.vibescore_tracker_hourly;
drop function if exists public.vibescore_apply_daily_rollup_delta();
drop function if exists public.vibescore_rebuild_daily_rollup(date, date);
drop table if exists public.vibescore_tracker_daily_rollup;
