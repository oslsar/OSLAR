# Wescam OPUS Phase-1 trial

`LSAR_OPUS.egl` remains the source database/schema for the Wescam trial. One
deliberate source-data cleanup permanently removed 7,271 THA rows without a
matching HA on `EIACODXA`, `CAGECDXH` and `REFNUMHA`. The nine `open_lsar.lsar_core."WESCAM_*"`
tables are writable trial copies with distinct entity codes and the `WESCAM_OPUS`
profile/source tag. BASELINE metadata and physical tables remain unchanged. The
existing compiler needs no changes and continues to use one database.

Migration 041 preserves every source column, its order, PostgreSQL type, length,
precision and scale, including EAGLE-only fields, `USERIDZU` and mixed-case
`Filter`. Definitions come from `/tmp/wescam_egl_schema.sql`; metadata/catalog
conventions were checked against `/tmp/wescam_oslar_schema.sql` and source
discovery against `/tmp/wescam_db_discovery.txt`. Field formats use the new
physical catalog, not baseline datatypes. Exact same-table baseline field
identities may supply existing labels and standard metadata. THA/THG only reuse
HA/HG key identities. Unverified fields have labels such as `EAGLE KWORDTHA`
and NULL standards mappings; no DED numbers or semantics are invented.

## Keys

All listed keys except XF were checked against the complete source extract:
zero NULL key rows and zero duplicate key rows. THA/THG candidate keys are used
as trial primary keys. Primary keys make these columns NOT NULL in the copy.

| Entity | Primary key, in constraint order |
| --- | --- |
| WESCAM_XA | EIACODXA |
| WESCAM_XB | EIACODXA, ALTLCNXB, LSACONXB, LCNTYPXB |
| WESCAM_XC | EIACODXA, ALTLCNXB, LSACONXB, LCNTYPXB |
| WESCAM_HA | EIACODXA, CAGECDXH, REFNUMHA |
| WESCAM_HG | EIACODXA, ALTLCNXB, LSACONXB, LCNTYPXB, CAGECDXH, REFNUMHA |
| WESCAM_HO | EIACODXA, LCNTYPXB, CAGECDHO, REFNUMHO, LSACONHO, ALTLCNHO, LCNSEIHO, ALCSEIHO |
| WESCAM_THA | EIACODXA, CAGECDXH, REFNUMHA |
| WESCAM_THG | EIACODXA, ALTLCNXB, LSACONXB, LCNTYPXB, CAGECDXH, REFNUMHA |
| WESCAM_XF | EIACODXA, LSACONXF, ALTLCNXF, LCNTYPXF, LCNSEIXF, ALCSEIXF, LTYSEIXF |

XF is currently empty. Its seven-column relationship key is **structurally
derived**, not validated against existing source rows.

## Relationships and independent extensions

There are no physical inter-table foreign keys in Phase 1. COPY preserves all
source rows, including rows with missing parents. Current data uses `OPUS001`.

| Source relationship | Current matching rows |
| --- | --- |
| XB → XA | 37/37 |
| XC → XB | 2/2 |
| HG → XB | 16/16 |
| HG → HA | 14/16 (2 missing HA) |
| HO → HG | 14/35 (21 missing HG) |
| HO → XC | 35/35 |
| HA → THA | 14/14 |
| HG → THG | 16/16 |

Historical discovery found 7,285 THA rows, including 7,271 without a matching
HA on `EIACODXA`, `CAGECDXH` and `REFNUMHA`. This original condition was one
reason no THA → HA metadata relationship was created for Phase 1.
After the deliberate cleanup, current `LSAR_OPUS.egl.THA` contains 14 rows and
0 such orphans; current `open_lsar.lsar_core.WESCAM_THA` also contains 14 rows
and 0 such orphans.

THG remains unchanged: 37 rows, of which 21 lack a currently loaded HG.
Those THG orphan rows remain independently browsable. THA and THG remain independently
browsable and creatable pages, without HA/HG metadata dependencies. HA is also
independently creatable; HG has only the approved XB parent relationship.

The seven metadata relationships are XB → XA, XC → XB, HG → XB, HO → HG,
HO → XC, XF → XB and XF → XC, all using WESCAM entity codes. New compiler creates
validate these parent relationships; imported orphan rows in other tables remain
browsable. There are currently no THA orphan rows in the source or trial copy.
HG → HA is intentionally omitted.

HO uses independent HG (`EIACODXA`) and XC (`ALCSEIHO`) lookup anchors. Its XC
lookup is filtered by both `EIACODXA` and `LCNTYPXB`. XF uses independent XB
(`LSACONXF`) and XC (`LCNSEIXF`) anchors. Selecting XB supplies End Item context;
XC is filtered by `EIACODXA`. XF's `LTYSEIXF` comes from the selected XC record
and is independent of the XB endpoint's `LCNTYPXF`.

HO → XF automatic creation is intentionally deferred: deriving XF's independent
`LTYSEIXF` from HO's `LCNTYPXB` needs explicit business confirmation. XF remains
independently creatable through its generated GUI.

Migration 042 enables generated navigation, lists and General-section create
forms for all nine entities. Edit, delete and import remain disabled; export
follows the existing enabled metadata convention. Only lookup anchors receive
explicit field behavior; there is no large manual form layout.
The checkout had no `/lsar` index page. The added metadata-driven index lists
included entities with active, visible navigation behavior, using their labels
and configured order; it contains no Wescam or baseline allowlist.

## Administrator execution

These changes are prepared only. Apply nothing until separately authorized.
After a development backup, apply 041 then 042 to `open_lsar` using the existing
migration workflow with `psql -v ON_ERROR_STOP=1`. Neither migration connects to
LSAR_OPUS. The SQL files reject a different destination database.

Run from an administrator shell with access to the development Docker socket:

```bash
scripts/wescam-opus-load
# Explicitly replace previously loaded or populated Wescam trial data:
scripts/wescam-opus-load --replace
```

The loader is fixed to `oslar-dev-postgres`, source `LSAR_OPUS.egl`, destination
`open_lsar.lsar_core`, and the nine WESCAM tables. It preflights existence and
exact column/type/order signatures for every table before writing. Without
`--replace`, every destination must be empty. It rechecks emptiness under a
target lock to prevent a concurrent create from being silently replaced.

Binary PostgreSQL COPY streams directly through the container, without
application row inserts or payload transformation. Each source COUNT/COPY runs
in one repeatable-read, read-only snapshot. Each target lock, optional TRUNCATE,
COPY and count assertion runs in one transaction. Counts are reported and
compared to actual source counts, not hard-coded extract counts. Mismatches
abort that table's transaction. Earlier tables remain committed if a later
table fails; inspect the failure and retry with `--replace`. Stop trial writes
during a replacement load. There is no guarantee of one shared snapshot across
all nine source tables.

The loader deliberately copies THA using the same full-table COUNT and binary
COPY behavior as the other tables; it does not filter THA. If a future
LSAR_OPUS source refresh contains orphan THA rows again, the current loader
would copy them unless a separate data-cleanup decision is made.

Rollback 042 removes presentation only. Rollback 041 requires 042 to be removed
first and refuses to drop any populated WESCAM table. Preserve/export trial
data before any separately authorized cleanup. Rollbacks never touch source
tables or BASELINE entities.

## Verification

Database-independent tests exercise the unchanged metadata and preview compiler
with a stub SQL boundary, compare all physical definitions with a committed
source-schema contract, and check keys, permissions, lookup anchors/context,
all-field generated forms, isolation, and loader safeguards:

```bash
node --experimental-strip-types --test \
  ai-tests/compiler-validation.test.mjs ai-tests/wescam-opus.test.mjs
```

After authorized application of 041/042, run the GET-only Wescam preview/page
checks and the unchanged baseline/decimal regression tests:

```bash
OSLAR_PREVIEW_BASE_URL=http://127.0.0.1:3002 \
node --experimental-strip-types --test \
  ai-tests/wescam-opus-live.test.mjs \
  ai-tests/compiler-lookup-plan.test.mjs ai-tests/compiler-validation.test.mjs
./scripts/dev-test
```

Live Wescam tests intentionally fail when migrations are absent; they are not
included in the default pre-migration gate. The database-free Wescam tests are
included in that gate without removing existing checks. Actual migration SQL
execution, post-migration table discovery, browser interaction, and loader
execution remain administrator verification steps after authorization.
