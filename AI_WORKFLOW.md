# OSLAR AI Development Rules

## Purpose

AI agents may assist with development, testing, debugging and inspection
of the OSLAR DEVELOPMENT environment.

## Allowed environment

Repository:

    /home/oslar/oslar-dev

Development web application:

    http://localhost:3002

Development containers:

    oslar-dev-web
    oslar-dev-postgres
    oslar-dev-metabase
    oslar-dev-importer
    oslar-dev-playwright

Development PostgreSQL host port:

    5433

## Production is READ-PROTECTED

The AI must NOT modify, restart, stop, rebuild or reconfigure:

    oslar-web
    oslar-postgres
    oslar-metabase
    oslar-importer

Production ports include:

    3000
    3001
    5432

The AI must not write to the production database.

## Source-code rules

Before modifying source code:

1. Run:

       git status --short

2. Preserve all existing uncommitted user changes.

3. Inspect the relevant implementation before editing it.

4. Make the smallest practical change.

The AI must NEVER run:

    git reset --hard
    git clean -f
    git clean -fd
    git checkout .
    git restore .
    git push --force

The AI must not discard user changes.

## Database rules

Database changes may only target:

    oslar-dev-postgres

Before destructive development-database changes, explain the change
and obtain approval.

Never execute destructive SQL against production.

## Testing

After source-code changes run:

    ./scripts/dev-test

A change is not considered successful unless the relevant tests pass.

When changing UI behaviour, inspect the resulting page using Playwright.

Browser tests run inside:

    oslar-dev-playwright

Playwright accesses OSLAR DEV internally at:

    http://web:3000

## Failure handling

If a test fails:

1. Inspect the failure.
2. Inspect browser/page errors.
3. Inspect relevant development container logs.
4. Correct only the development implementation.
5. Run the test again.

Do not weaken or remove a valid regression test merely to make a
change pass.

## Git

AI may inspect:

    git status
    git diff
    git log

AI may prepare changes.

Do not commit, merge, push, rebase or delete branches without explicit
user approval.

## General principle

Development may be automated.

Production changes require explicit human approval.
