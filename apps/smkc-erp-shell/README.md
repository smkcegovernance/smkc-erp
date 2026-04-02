# smkc-erp-shell

Primary Next.js host application for the SMKC-ERP platform.

## Responsibility

- Provide the shared entry point for ERP users.
- Host department routes in the initial route-based model.
- Consume shared packages from `packages/*`.

## Initial Route Strategy

- `/water`
- `/tax`
- `/health`
- `/accounts`

## Migration Note

This app starts as the common shell. Departments that later need stronger isolation can be promoted to dedicated apps and mapped to subdomains.