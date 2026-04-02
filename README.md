# SMKC-ERP

This repository contains the Phase 1 blueprint and migration guidance for moving from `duplicate-voter-verification` to `smkc-erp` while keeping existing projects intact.

## Goals

- Establish a scalable parent structure for 35 departments.
- Start with route-based tenancy and remain subdomain-ready.
- Keep current production projects untouched until each migration step is approved.

## Blueprint Structure

- `apps/smkc-erp-shell`: Primary Next.js host app.
- `apps/_templates/department-app`: Template for new department modules/apps.
- `packages/*`: Shared libraries (UI, auth, API client, config, types, utils).
- `infra/domains`: Domain and routing strategy docs.
- `docs`: Migration and execution plans.

## Phase 1 Scope

- Naming normalization plan (`duplicate-voter-verification` -> `smkc-erp`).
- Folder blueprint for future departments.
- No forced code migration in this phase.

