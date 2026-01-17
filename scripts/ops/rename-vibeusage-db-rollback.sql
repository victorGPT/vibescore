-- Roll back DB object rename from vibeusage_* to the legacy prefix
DO $$
DECLARE r record;
DECLARE old_prefix text := 'vibeusage_';
DECLARE new_prefix text := 'vibe' || 'score_';
BEGIN
  -- tables/views/sequences/indexes
  FOR r IN
    SELECT n.nspname AS schema_name, c.relname, c.relkind
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname LIKE old_prefix || '%'
  LOOP
    IF r.relkind IN ('r','p') THEN
      EXECUTE format('ALTER TABLE %I.%I RENAME TO %I', r.schema_name, r.relname, replace(r.relname, old_prefix, new_prefix));
    ELSIF r.relkind IN ('v','m') THEN
      EXECUTE format('ALTER VIEW %I.%I RENAME TO %I', r.schema_name, r.relname, replace(r.relname, old_prefix, new_prefix));
    ELSIF r.relkind = 'S' THEN
      EXECUTE format('ALTER SEQUENCE %I.%I RENAME TO %I', r.schema_name, r.relname, replace(r.relname, old_prefix, new_prefix));
    ELSIF r.relkind = 'i' THEN
      EXECUTE format('ALTER INDEX %I.%I RENAME TO %I', r.schema_name, r.relname, replace(r.relname, old_prefix, new_prefix));
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
      AND p.proname LIKE old_prefix || '%'
  LOOP
    EXECUTE format('ALTER FUNCTION %I.%I(%s) RENAME TO %I', r.schema_name, r.proname, r.args, replace(r.proname, old_prefix, new_prefix));
  END LOOP;

  -- policies
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE policyname LIKE old_prefix || '%'
  LOOP
    EXECUTE format('ALTER POLICY %I ON %I.%I RENAME TO %I', r.policyname, r.schemaname, r.tablename, replace(r.policyname, old_prefix, new_prefix));
  END LOOP;
END $$;
