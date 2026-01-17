-- Roll back DB object rename from vibeusage_* to vibescore_*
DO $$
DECLARE r record;
BEGIN
  -- tables/views/sequences/indexes
  FOR r IN
    SELECT n.nspname AS schema_name, c.relname, c.relkind
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname LIKE 'vibeusage_%'
  LOOP
    IF r.relkind IN ('r','p') THEN
      EXECUTE format('ALTER TABLE %I.%I RENAME TO %I', r.schema_name, r.relname, replace(r.relname, 'vibeusage_', 'vibescore_'));
    ELSIF r.relkind IN ('v','m') THEN
      EXECUTE format('ALTER VIEW %I.%I RENAME TO %I', r.schema_name, r.relname, replace(r.relname, 'vibeusage_', 'vibescore_'));
    ELSIF r.relkind = 'S' THEN
      EXECUTE format('ALTER SEQUENCE %I.%I RENAME TO %I', r.schema_name, r.relname, replace(r.relname, 'vibeusage_', 'vibescore_'));
    ELSIF r.relkind = 'i' THEN
      EXECUTE format('ALTER INDEX %I.%I RENAME TO %I', r.schema_name, r.relname, replace(r.relname, 'vibeusage_', 'vibescore_'));
    END IF;
  END LOOP;

  -- functions
  FOR r IN
    SELECT n.nspname AS schema_name,
           p.proname,
           pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname LIKE 'vibeusage_%'
  LOOP
    EXECUTE format('ALTER FUNCTION %I.%I(%s) RENAME TO %I', r.schema_name, r.proname, r.args, replace(r.proname, 'vibeusage_', 'vibescore_'));
  END LOOP;

  -- policies
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE policyname LIKE 'vibeusage_%'
  LOOP
    EXECUTE format('ALTER POLICY %I ON %I.%I RENAME TO %I', r.policyname, r.schemaname, r.tablename, replace(r.policyname, 'vibeusage_', 'vibescore_'));
  END LOOP;
END $$;
