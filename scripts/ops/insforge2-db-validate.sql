-- Insforge2 DB validation for legacy prefix leaks and header helpers
-- Expected: 0 rows for legacy leaks

-- 1) Required helper functions present
select n.nspname as schema, p.proname, pg_get_function_identity_arguments(p.oid) as args
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'vibeusage_request_headers',
    'vibeusage_request_header',
    'vibeusage_device_token_hash'
  );

-- 2) Legacy prefix leak in function bodies
select n.nspname as schema, p.proname, p.prosrc
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and (p.prosrc ilike '%' || 'vibe' || 'score_request_header%'
    or p.prosrc ilike '%' || 'vibe' || 'score_request_headers%'
    or p.prosrc ilike '%' || 'vibe' || 'score_%');

-- 3) Legacy objects still exist
select c.relname, c.relkind
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname like 'vibe' || 'score_%'
order by c.relname;

-- 4) RLS policies referencing legacy names
select schemaname, tablename, policyname, qual, with_check
from pg_policies
where schemaname = 'public'
  and (qual ilike '%' || 'vibe' || 'score_%' or with_check ilike '%' || 'vibe' || 'score_%');
