# OSLAR Phase 2 Metadata Compiler

## Purpose

OSLAR compiles metadata into usable logistics-engineering structures.

The compiler will eventually produce:

- PostgreSQL tables
- Columns and data types
- Primary and foreign keys
- Constraints and indexes
- Database comments
- Generic graphical lists
- Add and edit forms
- Search and filter definitions
- Standards mappings
- Safe query permissions

## Existing compiler

The existing procedure:

`lsar_meta.build_entities_from_dbinfo`

already compiles `lsar_meta.v_dbinfo` metadata into PostgreSQL tables.

It currently generates:

- Schemas
- Tables
- Columns
- PostgreSQL data types
- NOT NULL constraints
- Primary keys

The existing part-number procedures compile detected source-table structures
into analysis views.

## Phase 2 compiler direction

The compiler will be expanded incrementally rather than replaced.

Proposed stages:

1. Validate metadata.
2. Produce a proposed compilation plan.
3. Report dependencies and risks.
4. Require confirmation for structural changes.
5. Apply approved database changes.
6. Register GUI metadata.
7. Register query permissions.
8. Record an audit and release entry.

## Safety requirements

The existing `build_entities_from_dbinfo` procedure defaults
`p_drop_existing` to true. It must not be used directly by a normal GUI or AI
request.

Before structural compilation is exposed through OSLAR, it must support:

- Dry-run or preview mode
- Explicit confirmation
- Dependency detection
- Existing-data checks
- Transactional execution
- Audit history
- Role restrictions
- Development-first promotion

AI may propose metadata or a compilation plan, but must not execute unrestricted
DDL directly.

## Phase 2 target

An authorized user should be able to define a compliant table and expose it
through the generic OSLAR GUI in under five minutes, without writing React code
or unrestricted SQL.
