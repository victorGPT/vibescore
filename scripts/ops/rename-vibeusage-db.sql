-- Rename all DB objects from vibescore_* to vibeusage_* (tables, views, sequences, indexes, functions, policies)
DO $$
DECLARE r record;
BEGIN
  -- tables/views/sequences/indexes
  FOR r IN
    SELECT n.nspname AS schema_name, c.relname, c.relkind
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname LIKE 'vibescore_%'
  LOOP
    IF r.relkind IN ('r','p') THEN
      EXECUTE format('ALTER TABLE %I.%I RENAME TO %I', r.schema_name, r.relname, replace(r.relname, 'vibescore_', 'vibeusage_'));
    ELSIF r.relkind IN ('v','m') THEN
      EXECUTE format('ALTER VIEW %I.%I RENAME TO %I', r.schema_name, r.relname, replace(r.relname, 'vibescore_', 'vibeusage_'));
    ELSIF r.relkind = 'S' THEN
      EXECUTE format('ALTER SEQUENCE %I.%I RENAME TO %I', r.schema_name, r.relname, replace(r.relname, 'vibescore_', 'vibeusage_'));
    ELSIF r.relkind = 'i' THEN
      EXECUTE format('ALTER INDEX %I.%I RENAME TO %I', r.schema_name, r.relname, replace(r.relname, 'vibescore_', 'vibeusage_'));
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
      AND p.proname LIKE 'vibescore_%'
  LOOP
    EXECUTE format('ALTER FUNCTION %I.%I(%s) RENAME TO %I', r.schema_name, r.proname, r.args, replace(r.proname, 'vibescore_', 'vibeusage_'));
  END LOOP;

  -- policies
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE policyname LIKE 'vibescore_%'
  LOOP
    EXECUTE format('ALTER POLICY %I ON %I.%I RENAME TO %I', r.policyname, r.schemaname, r.tablename, replace(r.policyname, 'vibescore_', 'vibeusage_'));
  END LOOP;
END $$;
