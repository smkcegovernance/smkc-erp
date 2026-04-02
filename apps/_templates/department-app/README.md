# Department App Template

Template blueprint for a department-specific SMKC-ERP application.

## Intended Use

- Copy this structure when a department grows beyond a simple route module.
- Keep business logic inside the department app.
- Reuse shared packages for UI, auth, config, API access, types, and utilities.

## Suggested Contents

- Department layout and navigation
- Department-specific pages and workflows
- Department API integration layer
- Department access control rules

## Naming Convention

- App folder: `apps/{department-name}`
- Package scope: `@smkc/{package-name}`
- Route prefix: `/{department-name}` or `{department-name}.smkc.in`

## Promotion Trigger

Use this template when a department needs independent deployment, ownership, or scaling.

