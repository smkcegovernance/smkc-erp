# Phase 2 Plan — Monorepo Bootstrap

## Objective

Initialize the actual Next.js shell application and shared package scaffolds so the SMKC-ERP platform can be actively developed.

## Scope

- Monorepo root setup with npm workspaces.
- `apps/smkc-erp-shell`: Next.js 15 host app with App Router.
- `packages/*`: Typed shared libraries (types, utils, config, auth, api-client, ui).
- Initial department route stubs: `/water`, `/tax`, `/health`, `/accounts`.

## Constraints

- No changes to `apismkc` (.NET 4.5) or `SMKC Oracle Project`.
- Additive only — existing blueprint docs and READMEs remain intact.
- No forced migration of `duplicate-voter-verification` (deferred).

## Toolchain

- Node.js v24.x
- npm 11.x (workspaces)
- TypeScript 5.x
- Next.js 15.x (App Router, React 19)

## Deliverables

1. Root `package.json` with workspace config.
2. Root `tsconfig.json`.
3. Root `.gitignore`.
4. `apps/smkc-erp-shell` — runnable Next.js app scaffold.
5. `packages/types` — shared TypeScript types.
6. `packages/utils` — shared utility functions.
7. `packages/config` — env/config validation.
8. `packages/auth` — session and auth helpers.
9. `packages/api-client` — typed fetch wrapper and API client factory.
10. `packages/ui` — shared component library placeholder.

## Route Structure (Phase 2)

```
/                  → Home / department selector
/water             → Water department stub
/tax               → Tax department stub
/health            → Health department stub
/accounts          → Accounts department stub
```

## Phase 2 Exit Criteria

- `npm install` at root succeeds with no workspace resolution errors.
- `npm run dev` in `apps/smkc-erp-shell` starts without errors.
- All department route stubs render at their paths.
- Shared packages all export valid TypeScript without type errors.
