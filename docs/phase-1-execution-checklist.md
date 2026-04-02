# Phase 1 Execution Checklist

This checklist operationalizes Phase 1 from the migration plan.

## A. Workspace And Blueprint Baseline

- [x] Parent root exists: C:\Users\ACER\source\repos\SMKC-ERP
- [x] Existing projects placed under parent root:
  - [x] apismkc
  - [x] SMKC Oracle Project
- [x] Blueprint repo exists: smkc-erp
- [x] Blueprint repo folder rename planned and approved: smkc-erp-blueprint -> smkc-erp
- [x] Blueprint folders exist:
  - [x] apps/
  - [x] packages/
  - [x] infra/
  - [x] docs/

## A1. Blueprint Repository Rename (This Workspace)

- [x] Create/confirm rename branch.
- [x] Rename folder: smkc-erp-blueprint -> smkc-erp.
- [ ] Re-open workspace root to new path.
- [x] Update any hardcoded references that still point to smkc-erp-blueprint.
- [x] Verify docs paths remain valid after rename.

## B. Frontend Rename Readiness

- [ ] Identify source frontend repository/folder currently named duplicate-voter-verification.
- [ ] Confirm rename target is smkc-erp.
- [ ] Prepare branch and rollback notes for rename execution.

## C. Rename Impact Checklist (Execution Phase)

- [ ] Rename frontend app folder to smkc-erp.
- [ ] Update package.json "name" field.
- [ ] Update deployment config references:
  - [ ] ecosystem.config.js
  - [ ] Deployment scripts
  - [ ] IIS/web config paths where applicable
- [ ] Update docs and CI/CD labels referencing old app name.
- [ ] Validate:
  - [ ] Install dependencies
  - [ ] Build succeeds
  - [ ] Tests pass
  - [ ] Local run scripts succeed

## D. Tenancy Direction Validation

- [x] Route-first direction documented under infra/domains.
- [x] Subdomain promotion criteria documented.
- [ ] Department routing abstraction draft prepared for Phase 2 handoff.

## Exit Gate

Phase 1 is complete when all sections above are checked and status is marked "Done" in docs/phase-1-status.md.
