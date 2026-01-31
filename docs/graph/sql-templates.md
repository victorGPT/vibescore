# Graph SQLite SQL Templates

Use these templates to query `data/graph.sqlite` without hand-writing SQL.

## Quick start

```bash
sqlite3 data/graph.sqlite ".tables"
```

## 1) List documents by path prefix

```sql
SELECT relative_path
FROM documents
WHERE relative_path LIKE 'src/%'
ORDER BY relative_path
LIMIT 50;
```

## 2) List symbols in a file (definitions + references)

```sql
SELECT s.symbol, o.role, o.start_line, o.start_character
FROM occurrences o
JOIN symbols s ON o.symbol_id = s.id
JOIN documents d ON o.document_id = d.id
WHERE d.relative_path = 'scripts/graph/auto-index.cjs'
ORDER BY o.start_line, o.start_character
LIMIT 200;
```

## 3) Find definitions for a symbol name pattern

```sql
SELECT s.symbol, d.relative_path, o.start_line, o.start_character
FROM occurrences o
JOIN symbols s ON o.symbol_id = s.id
JOIN documents d ON o.document_id = d.id
WHERE o.role = 'definition'
  AND s.symbol LIKE '%importScip%'
ORDER BY d.relative_path, o.start_line
LIMIT 50;
```

## 4) Find references for a symbol name pattern

```sql
SELECT s.symbol, d.relative_path, o.start_line, o.start_character
FROM occurrences o
JOIN symbols s ON o.symbol_id = s.id
JOIN documents d ON o.document_id = d.id
WHERE o.role = 'reference'
  AND s.symbol LIKE '%importScip%'
ORDER BY d.relative_path, o.start_line
LIMIT 50;
```

## 5) Count occurrences per file (top N)

```sql
SELECT d.relative_path, COUNT(*) AS occurrence_count
FROM occurrences o
JOIN documents d ON o.document_id = d.id
GROUP BY d.relative_path
ORDER BY occurrence_count DESC
LIMIT 50;
```

## 6) Find all files that mention a symbol (distinct)

```sql
SELECT DISTINCT d.relative_path
FROM occurrences o
JOIN symbols s ON o.symbol_id = s.id
JOIN documents d ON o.document_id = d.id
WHERE s.symbol LIKE '%importScip%'
ORDER BY d.relative_path
LIMIT 200;
```

## 7) Find occurrences inside a folder, filtered by role

```sql
SELECT d.relative_path, s.symbol, o.role, o.start_line
FROM occurrences o
JOIN symbols s ON o.symbol_id = s.id
JOIN documents d ON o.document_id = d.id
WHERE d.relative_path LIKE 'scripts/%'
  AND o.role = 'definition'
ORDER BY d.relative_path, o.start_line
LIMIT 200;
```

## 8) Verify core tables exist

```sql
SELECT name FROM sqlite_master
WHERE type = 'table'
ORDER BY name;
```
