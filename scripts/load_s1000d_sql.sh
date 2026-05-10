#!/usr/bin/env bash
set -euo pipefail

for f in /sql/001_schema.sql /sql/002_tables.sql /sql/003_views.sql; do
  echo "Loading $f"
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$f"
done
