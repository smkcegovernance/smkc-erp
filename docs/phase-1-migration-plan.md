# Phase 1 Migration Plan (Rename + Folder Blueprint)

## Objective

Prepare the foundation for SMKC-ERP scaling without breaking current projects.

## Constraints

- Keep current projects runnable.
- Do not change backend framework targets.
- Apply changes in small, reversible steps.

## Step-by-Step

1. Create parent workspace root: `C:\Users\ACER\source\repos\SMKC-ERP`.
2. Place existing projects under parent root:
   - `apismkc`
   - `SMKC Oracle Project`
3. Define target frontend identity: `smkc-erp`.
4. Align blueprint repository naming (`smkc-erp-blueprint` -> `smkc-erp`) before runtime migration execution.
5. Create blueprint folders for apps, packages, and infrastructure docs.
6. Prepare a rename checklist for Next.js project artifacts.
7. Approve Phase 2 before changing runtime frontend code.

## Rename Checklist (for execution phase)

- Update app folder name to `smkc-erp`.
- Update `package.json` name.
- Update deployment scripts (`ecosystem.config.js`, deployment scripts, IIS/web config paths if needed).
- Update docs references and CI/CD labels.
- Validate build, tests, and local run scripts.

## Tenancy Direction

Recommended sequence:

1. Start with single domain and department routes (`/water`, `/tax`, ...).
2. Keep routing/domain mapping abstraction in infra docs.
3. Promote heavy departments to subdomains when required.

## Deliverables

- Parent workspace created.
- Project placement completed.
- Blueprint structure and docs completed.

## Current Status (April 2, 2026)

- Parent workspace and project placement are complete.
- Blueprint structure under apps, packages, infra, and docs is complete.
- Blueprint repository folder has been renamed to `smkc-erp`.
- Rename execution for runtime frontend artifacts is pending and tracked in:
   - `docs/phase-1-execution-checklist.md`
   - `docs/phase-1-status.md`

## Phase 1 Exit Criteria

- Blueprint repository naming is aligned to `smkc-erp` or explicitly approved to remain `smkc-erp-blueprint`.
- Rename checklist is fully validated against the live frontend app repository.
- Deployment and CI/CD references are updated where rename impacts paths/labels.
- Local build and run validation for the renamed frontend is documented.

