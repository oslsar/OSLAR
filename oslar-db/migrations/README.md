# OSLAR Database Migrations

This directory contains ordered, forward-only database migrations.

## Naming

Use:

YYYYMMDD_NNN_description.sql

Example:

20260713_001_metadata_identity_and_standards.sql

Rollback scripts belong in:

oslar-db/rollback/

with the same filename followed by `_down.sql`.

## Rules

1. Every migration must begin with `BEGIN;`.
2. Every migration must end with `COMMIT;`.
3. Use `psql -v ON_ERROR_STOP=1` when applying migrations.
4. Do not remove existing metadata columns during Phase 2 compatibility work.
5. Preserve existing business keys and foreign keys unless a reviewed migration
   explicitly replaces them.
6. Structural migrations require a development backup first.
7. Test every migration against the development database before production.
8. Prefer additive changes.
9. Document irreversible or destructive operations explicitly.
10. Compiler procedures must support preview or dry-run behaviour before they
    are permitted to modify production structures.

## Applying a migration

```bash
docker exec -i oslar-dev-postgres \
  psql -v ON_ERROR_STOP=1 \
  -U postgres \
  -d open_lsar \
  < oslar-db/migrations/<migration-file>.sql
```
