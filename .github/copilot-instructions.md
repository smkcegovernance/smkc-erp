# SMKC ERP — Architecture & UI/UX Reference Document

> **Purpose**: Technical reference for the existing SMKC ERP system.  
> Use this document when building any new website that must later integrate with or visually match this ERP.  
> **Do not modify ERP code** — this file describes the system as-is.

---

## 1. Project Technology Stack

### Frontend (ERP Shell)
| Concern | Technology |
|---|---|
| Framework | **Next.js 15** (App Router) |
| UI Library | **React 19** |
| Language | **TypeScript 5** |
| CSS Framework | **Bootstrap 5.3** + custom CSS variables |
| Icons | **Bootstrap Icons 1.13** (`bi-*` classes) |
| Charting / QR | `qrcode.react` |
| Excel export | `xlsx` |
| Monorepo | **npm workspaces** (root `package.json`) |
| Node requirement | ≥ 20.0.0 |

**Workspace apps**
- `apps/smkc-erp-shell` — main ERP shell (port 3000, default)
- `apps/deposit-manager` — standalone micro-app (port 3002, Tailwind CSS 4)
- `SMKC_Disabilities_Registration/nextjs-app` — disability registration micro-app

**Workspace packages** (shared, consumed by all apps)
- `@smkc/auth` — session management, login/logout helpers
- `@smkc/types` — shared TypeScript interfaces (`Session`, `User`, `UserRole`, `Department`, etc.)
- `@smkc/api-client` — client-side and server-side API fetch wrappers
- `@smkc/config` — shared configuration constants
- `@smkc/ui` — shared UI utilities and theme token documentation
- `@smkc/utils` — shared utility functions

### Backend
| Concern | Technology |
|---|---|
| Framework | **.NET Framework 4.5 Web API** |
| Language | **C#** |
| Project name | `SmkcApi` / `apismkc` |
| Security | **HMAC-SHA256** request signing (`X-API-Key`, `X-Timestamp`, `X-Signature` headers) |
| DI Container | Custom `SimpleDependencyResolver` (in `App_Start/`) |

### Database
| Schema / Connection | Purpose |
|---|---|
| `OracleDbUlberp` | ERP users (`ULBERP.USERDET`), permissions |
| `OracleDbAbas` | Core municipal finance / billing |
| `OracleDb` (WS) | Water supply / citizen data |
| `OracleDbWebsite` | Public-facing website data |
| `OracleDbGad` | General Administration Department data |

Database driver: `Oracle.ManagedDataAccess.Client` (ODP.NET Managed)  
Connection factory: `apismkc/Repositories/OracleConnectionFactory.cs`

### Authentication & Session
| Layer | Method |
|---|---|
| Frontend session | **`localStorage`** key `smkc_session` (JSON: `{ user, token, expiresAt }`) |
| Session lifetime | 8 hours from login |
| Login API | `POST /api/erp-auth/login` → validated against `ULBERP.USERDET` |
| Password storage | BASE64-encoded in Oracle |
| Account lockout | 3 consecutive failures locks the account |
| Backend auth | HMAC-SHA256 on every request from Next.js → .NET (`buildAuthHeaders()` in `@smkc/api-client`) |
| Permission cache | **`sessionStorage`** key `smkc_permissions` — fetched once per session from `/api/user-rights/for-user` |

---

## 2. ERP UI/UX Shell Structure

### 2.1 Login Flow

```
User visits any URL
  └─ AuthShell checks localStorage for valid, non-expired session
       ├─ No session → renders <LoginScreen> (auth-card UI)
       │     • SMKC logo, corp name, "SMKC ERP" title
       │     • Language toggle (EN / मराठी)
       │     • Gold accent bar below header
       │     • userId (max 8 chars, uppercased) + password fields
       │     • Show/hide password toggle (bi-eye / bi-eye-slash)
       │     • "Forgot password?" link → modal (submits to admin manually)
       │     • POST /api/erp-auth/login → save session → redirect
       └─ Valid session → renders <ERPShell> with children
```

**Key file**: `apps/smkc-erp-shell/app/components/AuthShell.tsx`

### 2.2 Authenticated Shell Layout

```
<div class="erp-shell">           ← full-height flex column, bg: #F2F3F4
  <header class="erp-shell-header">   ← sticky, white, 64px height, z-index 100
    <div class="erp-shell-header-inner">  ← max-width 1440px, horizontal flex
      ├─ .erp-brand (logo + text, links to /)
      └─ .profile-card
           ├─ language toggle (EN / मराठी)
           ├─ profile avatar icon → /profile
           ├─ Admin settings gear (ADMIN001 / PTTEST01 only)
           └─ logout button (bi-box-arrow-right)
    </div>
    <div class="erp-header-divider" />   ← 3px gradient: Red → Gold → transparent
  </header>
  {children}                        ← page content rendered here
</div>
```

### 2.3 Header / Top Bar

- **Height**: 64px, `position: sticky; top: 0; z-index: 100`
- **Background**: `#FDFEFE` (white surface)
- **Bottom accent**: 3px gradient `linear-gradient(90deg, #C0392B 0%, #D4AF37 55%, transparent 100%)`
- **Brand area**: SMKC logo (34×34px circle) + "SMKC ERP" bold + corporation name small text
- **Right side**: Language toggle buttons → profile icon link → admin gear (conditional) → logout icon

### 2.4 Home / Dashboard Grid

Route: `/`  
File: `apps/smkc-erp-shell/app/page.tsx`

```
<main class="erp-main">
  <div class="erp-page-header">
    ├─ kicker text (e.g. "Municipal Governance Portal")
    ├─ H1 title
    ├─ subtitle
    └─ department count badge
  </div>
  <nav class="dept-grid">           ← CSS grid of department cards
    {departments.map(dept => <Link>)}  ← filtered by user permissions
  </nav>
</main>
```

Department cards are driven by `DEPARTMENTS` constant in `@smkc/types` (or from DB via `/api/departments/active`).  
Each card has: icon, colored background, label, description, and navigates to `/{dept.key}`.

### 2.5 Department Sidebar

File: `apps/smkc-erp-shell/app/components/DeptSidebar.tsx`

```
<aside class="dept-sidebar [open]">
  ├─ dept icon + dept name header + close button
  ├─ Dashboard link (bi-speedometer2) → /{deptKey}/dashboard
  └─ <nav class="dept-sidebar-nav">
       {groups.map(group =>
         <div class="dept-sidebar-group">
           ├─ toggle button (group header with chevron)
           └─ <ul class="dept-sidebar-group-items">
                {items.map(item => <Link href="/{deptKey}/{item.key}">)}
              </ul>
         </div>
       )}
     </nav>
</aside>
```

**Menu groups** (ordered): `transactions` → `departmental-samaj` → `departmental-workorders` → `applications` → `reports` → `masters`

**Sidebar is rendered per-department inside `DashboardPage.tsx`** — it wraps every dept page via the reusable `DashboardPage` component.

**Mobile**: backdrop overlay shown when `isOpen`, tap to close.

### 2.6 Department Page Layout

Each department follows this pattern:

```
/[dept-key]/layout.tsx         ← imports bootstrap.min.css for the dept
/[dept-key]/page.tsx           ← redirect('/[dept-key]/dashboard')
/[dept-key]/dashboard/page.tsx ← <DashboardPage departmentKey="..." />
/[dept-key]/[module]/page.tsx  ← individual module page
```

`DashboardPage` renders:
- Role-based view tabs (Commissioner / HOD / Accounts / Operations) — controlled by `ROLE_VIEWS`
- Stats grid with `StatItem` cards (value, label, icon, color, trend)
- Data table with role-specific column configs
- Integrated `DeptSidebar` with open/close toggle button

### 2.7 Footer

**No global footer component exists** in the shell.  
Each module page may include its own footer-like print/action bar.

### 2.8 Common Page Layout Pattern

```typescript
// Every department module page follows this shell:
'use client'
// 1. Sidebar toggle state
// 2. API calls via apiClient (from @smkc/api-client)
// 3. <div class="dept-page"> or <div class="erp-main">
//      ├─ DeptSidebar
//      ├─ <main>
//      │    ├─ page header (breadcrumb + title)
//      │    ├─ filter bar (date range, search)
//      │    ├─ data table / form / report
//      │    └─ action buttons
//      └─ ErpPopup (for confirmations/alerts)
```

---

## 3. Application / Module Placement

### 3.1 Routing Pattern

```
/                              ← Home (department grid)
/{dept-key}/                   ← redirects to /{dept-key}/dashboard
/{dept-key}/dashboard          ← DashboardPage component
/{dept-key}/{module-key}       ← individual module page
/admin/user-rights             ← admin-only
/admin/user-locks              ← admin-only
/profile                       ← user profile
/public/*                      ← unauthenticated public routes (bypasses AuthShell)
/verify                        ← document verification
/depositmanager (proxied)      ← deposit-manager micro-app on port 3002
```

**Router**: Next.js App Router (file-system based)  
**Navigation**: Next.js `<Link>` component throughout; `useRouter().push()` for programmatic navigation.

### 3.2 Department Keys (registered)

| Route Key | Department |
|---|---|
| `water-tax` | Water Tax |
| `accounts` | Accounts & Finance |
| `property-tax` | Property Tax |
| `general-administration` | General Administration |
| `marriage` | Marriage Registration |
| `audit-department` | Audit Department |
| `women-child-welfare` | Women & Child Welfare |
| `health` | Health |
| `fire` | Fire Department |
| `estate` | Estate |
| `market-licenses` | Market & Licenses |
| `pms` | PMS |
| `pwd` | PWD |

### 3.3 Master Layout / Shared Components

| File | Role |
|---|---|
| `app/layout.tsx` | Root layout — wraps all pages in `LanguageProvider`, `DeptProvider`, `AuthShell` |
| `app/components/AuthShell.tsx` | Auth gate + sticky header + shell wrapper |
| `app/components/DeptSidebar.tsx` | Left navigation for every department |
| `app/components/DashboardPage.tsx` | Reusable department dashboard with tabs, stats, table |
| `app/components/ErpPopup.tsx` | Universal modal/popup |
| `app/components/AdminSettingsMenu.tsx` | Admin gear dropdown (user rights, locks) |
| `app/globals.css` | All global styles (brand tokens, auth, shell, sidebar, forms, popups) |
| `app/lib/dept-menus.ts` | Central registry of all department menu definitions |
| `app/lib/permissions.ts` | Permission fetch, cache, and access-check helpers |
| `app/lib/DeptContext.tsx` | React context providing live dept config from DB |
| `app/lib/i18n/LanguageContext.tsx` | Bilingual (EN/MR) translation context |
| `app/lib/i18n/translations.ts` | All UI string translations |

---

## 4. Reusable Components

### 4.1 Buttons

Defined in `globals.css`. Use these CSS classes:

| Class | Purpose |
|---|---|
| `auth-form button[type="submit"]` | Primary submit — red gradient, full width |
| `.erp-popup-action-primary` | Primary action in popups — `var(--brand-primary)` red |
| `.erp-popup-action-secondary` | Secondary/cancel action — transparent gray |
| `.erp-popup-action-danger` | Destructive action — `#b42318` dark red |
| `.header-icon-btn` | Header icon buttons (profile, logout) |
| `.lang-toggle-btn` / `.lang-toggle-btn.active` | Language toggle buttons |
| `.admin-settings-trigger` | Admin gear button — blue tinted |

### 4.2 Forms

All form inputs styled in `globals.css` under `.auth-form`:
- `label`: uppercase, small font, `var(--color-heading)`
- `input`: `border-radius: 10px`, focus ring in `var(--brand-primary)` red
- Password wrapper: `.auth-password-wrap` with `.auth-password-toggle` (eye icon)
- Error display: `.auth-error` — red left-border alert box

### 4.3 Tables / Grids

- **Department grid**: `.dept-grid` — CSS grid, responsive columns
- **Dashboard data table**: defined in `DashboardPage.tsx` with `VIEW_TABLE_COLUMNS` config per role
- No third-party table library — all plain HTML `<table>` with Bootstrap classes

### 4.4 Alerts / Messages

- **Inline error**: `.auth-error` (red left-border box, role="alert")
- **ErpPopup** tones: `success` | `error` | `info` | `warning` | `confirm`
  - Each tone has an icon, badge label, and colored title icon
  - Keyboard: Escape closes; click backdrop closes (configurable)

### 4.5 Modal / Popup

**`ErpPopup`** (`app/components/ErpPopup.tsx`):
```typescript
<ErpPopup
  open={boolean}
  tone="success" | "error" | "info" | "warning" | "confirm"
  title="Modal title"
  description="Optional subtitle"
  actions={[
    { label: 'Confirm', onClick: fn, variant: 'primary' },
    { label: 'Cancel',  onClick: fn, variant: 'secondary' },
  ]}
  onClose={fn}
  closeOnBackdrop={true}
>
  {/* optional body content */}
</ErpPopup>
```
z-index: 10000, backdrop blur, keyboard-trapped.

**Forgot-password modal** in `AuthShell.tsx` also serves as a pattern for simple 1-action modals.

### 4.6 Admin Settings Menu

**`AdminSettingsMenu`** (`app/components/AdminSettingsMenu.tsx`):
- Gear icon trigger button
- Dropdown panel with icon + label + description links
- Closes on outside click and Escape key
- Only rendered for `ADMIN001` / `PTTEST01`

### 4.7 Sidebar Group Toggle

Inside `DeptSidebar` — accordion-style group expand/collapse:
- All groups open by default (`Set(GROUP_ORDER)` initial state)
- Chevron rotates on expand/collapse
- Active route highlighted with `.dept-sidebar-item.active`

---

## 5. Integration Points

### 5.1 API Architecture

```
Browser (React client components)
  │  calls
  ▼
Next.js API Routes  (/api/*)          ← server-side, never exposed to browser
  │  calls with HMAC headers
  ▼
.NET 4.5 Web API (apismkc)            ← http://localhost:57031 (dev)
  │  queries
  ▼
Oracle Database (multiple schemas)
```

**Security boundary**: HMAC keys (`SMKC_API_KEY`, `SMKC_SECRET_KEY`) live only in `.env.local` on the Next.js server. The browser never touches the .NET API directly.

### 5.2 Key .NET API Endpoints

| Endpoint | Purpose |
|---|---|
| `POST /api/erp-auth/login` | ERP login (public, no HMAC required) |
| `GET /api/erp-auth/profile/{userId}` | User profile |
| `GET /api/departments/active` | Active dept list for home tiles |
| `GET /api/user-rights/for-user?userId=X` | User menu permissions |
| `GET /api/accounts/budget-book/*` | Budget book operations |
| `GET /api/gad/work-proposals/*` | Work proposal management |
| `GET /api/gad/samaj/*` | Samaj work orders |
| `GET /api/water/*` | Water tax data |
| `GET /api/women-child-welfare/*` | WCW welfare data |

All responses use standard envelope: `{ success: boolean, message: string, data: T | null }`.

### 5.3 Next.js API Routes (`app/api/`)

| Route | Purpose |
|---|---|
| `app/api/erp-auth/` | Proxy ERP login/profile to .NET |
| `app/api/departments/active/` | Proxy departments list |
| `app/api/user-rights/` | Proxy user rights |
| `app/api/accounts/` | Proxy accounts operations |
| `app/api/general-administration/` | Proxy GAD operations |
| `app/api/gad/` | Proxy GAD work orders |
| `app/api/water/` | Proxy water tax |
| `app/api/women-child-welfare/` | Proxy WCW |
| `app/api/admin/` | Admin management |
| `app/api/public/` | Unauthenticated public routes |

### 5.4 Backend Authentication Handler

File: `apismkc/Security/ApiKeyAuthenticationHandler.cs`

HMAC verification: `METHOD + pathWithQuery + body + timestamp + apiKey` → HMAC-SHA256(secretKey)  
Headers validated: `X-API-Key`, `X-Timestamp` (within ±300s), `X-Signature`

Public endpoints are whitelisted — no HMAC required (login, ERP auth, public forms).

### 5.5 Oracle Connection Strings (Web.config)

| Key | Schema | Used for |
|---|---|---|
| `OracleDb` (WS) | General WS schema | Water supply, citizens |
| `OracleDbAbas` | ABAS schema | Core billing/finance |
| `OracleDbUlberp` | ULBERP schema | ERP users, roles, rights |
| `OracleDbWebsite` | Website schema | Public website data |
| `OracleDbGad` | GAD schema | General Admin workflows |

### 5.6 Permission / Role System

**Roles** (derived from User ID prefix in mock; set in DB for production):

| Role | Access |
|---|---|
| `commissioner` | All 4 dashboard views + all departments |
| `hod` | HOD + Accounts + Operations views |
| `account` | Accounts + Operations views |
| `operator` | Operations view only |
| `bank` | Accounts view only |

**Permission flow**:
1. Login → session saved to `localStorage`
2. `usePermissions()` hook → checks `sessionStorage` cache
3. If no cache → `GET /api/user-rights/for-user?userId=X`
4. Admin users (`ADMIN001`, `PTTEST01`) → `isAdmin: true` → all departments/menus visible
5. Rights stored as: `{ deptKey: string, menuItems: string[] }[]`

Key files: `app/lib/permissions.ts`, `apismkc/Controllers/UserRightsController.cs`, `apismkc/Repositories/UserRights/`

### 5.7 Internationalisation (i18n)

- Bilingual: **English** and **Marathi (मराठी)**
- `LanguageContext.tsx` provides `lang`, `setLang`, `T` (translations object), `tMenu()` (menu key → translated label)
- All UI strings defined in `app/lib/i18n/translations.ts`
- Language persisted in `localStorage` (key: `smkc_lang`)

---

## 6. Theme — Colors, Fonts, CSS Variables

### Brand Token System (`globals.css`)

```css
:root {
  /* Brand Colors */
  --brand-primary:       #C0392B;   /* Sangli Red       (primary buttons, accents) */
  --brand-primary-dark:  #962d22;   /* Deep Red         (hover states) */
  --brand-secondary:     #D4AF37;   /* Miraj Gold       (decorative accents, gold bar) */
  --brand-cta:           #E74C3C;   /* Kupwad Coral     (CTA gradient start) */
  --brand-cta-hover:     #C0392B;

  /* Neutrals */
  --color-white:         #FDFEFE;
  --color-gray-50:       #F2F3F4;   /* page background */
  --color-gray-100:      #E8EAEB;
  --color-gray-200:      #CCD1D1;   /* borders */
  --color-text-muted:    #7B7D7D;
  --color-text-body:     #4a5568;
  --color-heading:       #2C3E50;   /* Midnight blue — all headings */
  --color-dark:          #1a252f;

  /* Surfaces */
  --surface:             #FDFEFE;   /* card/modal backgrounds */
  --surface-soft:        #F2F3F4;
  --surface-border:      #E8EAEB;
}
```

### Typography

- **Font**: `'Segoe UI', system-ui, -apple-system, sans-serif`
- **Heading weight**: 700–800
- **Body**: 400–600
- **Small labels**: uppercase, `letter-spacing: 0.07em`, `font-size: 0.78rem`

### Icons

All icons use **Bootstrap Icons** (`bi-*` classes):
```html
<i class="bi bi-speedometer2" aria-hidden="true" />
```
Loaded via `bootstrap-icons/font/bootstrap-icons.css` in root `layout.tsx`.

---

## 7. Recommendations for Your New Website

### 7.1 Which UI/UX Patterns to Reuse

| Pattern | How to Reuse |
|---|---|
| **Brand token system** | Copy the `:root` CSS variables block from `globals.css` into your own CSS. Use the same color names (`--brand-primary`, `--brand-secondary`, etc.) so future integration is drop-in. |
| **Header structure** | Use the same 64px sticky white header with a 3px Red→Gold gradient bottom border. Include SMKC logo + brand text on the left, user actions on the right. |
| **Auth card pattern** | Use the same `.auth-card` layout (red-gradient header block, gold bar, white body) for any login screen. |
| **Popup / modal** | Copy or reuse `ErpPopup.tsx` — it is fully self-contained and tone-aware. |
| **Language toggle** | Use the `.lang-toggle-btn` pattern for EN/MR bilingual toggle. |
| **Button styles** | Use `--brand-primary` gradient for primary CTAs and secondary/danger variants as defined. |

### 7.2 Which Libraries to Reuse

| Library | Notes |
|---|---|
| **Next.js 15** (App Router) | Same framework → same mental model, same API route pattern, same deployment model (IIS + node). |
| **Bootstrap 5.3** | Already present in all ERP pages. Use Bootstrap grid, form controls, utilities. |
| **Bootstrap Icons** | All icons are already `bi-*`. Reuse the same icon set — do not introduce a different library. |
| **`@smkc/types`** | Import `Session`, `User`, `UserRole`, `Department` types directly — zero duplication. |
| **`@smkc/auth`** | `loginWithServer`, `getSession`, `saveSession`, `clearSession`, `isAuthenticated` — reuse as-is. |
| **`@smkc/api-client`** | `apiClient` (client-side) and `apiServer` (server Route Handlers) — reuse the same HMAC-aware fetch wrappers. |

### 7.3 Files / Components to Study First

Study these files in order:

1. **`apps/smkc-erp-shell/app/globals.css`** — master CSS file; understand all CSS classes and brand tokens before writing any styles.
2. **`apps/smkc-erp-shell/app/components/AuthShell.tsx`** — complete auth gate + header pattern; the largest single component.
3. **`packages/types/src/index.ts`** — all shared types; understand data shapes before writing any API code.
4. **`packages/auth/src/index.ts`** — full auth flow from login to session expiry.
5. **`packages/api-client/src/server.ts`** + **`hmac.ts`** — how every Next.js route handler talks to the .NET backend.
6. **`apps/smkc-erp-shell/app/lib/permissions.ts`** — permission model and access-check helpers.
7. **`apps/smkc-erp-shell/app/components/DeptSidebar.tsx`** — sidebar pattern for any multi-module section.
8. **`apps/smkc-erp-shell/app/components/ErpPopup.tsx`** — the universal modal; copy this component directly.

### 7.4 How to Keep Your New Website Separate Now but ERP-Ready

**Project setup**:
```
smkc-erp/               ← existing monorepo root
  apps/
    smkc-erp-shell/     ← existing
    deposit-manager/    ← existing
    your-new-app/       ← ADD HERE as a new workspace app
  packages/
    auth/               ← already available, import directly
    types/              ← already available, import directly
    api-client/         ← already available, import directly
```

Adding your app to `smkc-erp/package.json` workspaces is optional — you can also keep it as a fully separate repo and install the `@smkc/*` packages via a local registry or path alias when the time comes for integration.

**Recommended approach for keeping it separate**:

1. **Own repository, same libraries**: Use Next.js 15 + Bootstrap 5.3 + Bootstrap Icons. Do NOT use Tailwind — the ERP uses Bootstrap exclusively in the shell.

2. **Copy the CSS token system**: Paste the `:root` CSS variables block from `globals.css` into your app. Do not change the variable names. This ensures zero visual rework on integration.

3. **Use the same auth shape**: Even if you implement a different login backend now, use the same `Session` / `User` / `UserRole` interface shapes from `@smkc/types`. This makes future JWT/session unification trivial.

4. **Adopt the same API envelope**: All .NET responses use `{ success, message, data }`. Use the same shape in any new API routes you create.

5. **Plan for the header**: Build your app's top nav to be swappable — a single `<AppShell>` component wrapping children, mirroring `AuthShell.tsx`. When integrating, this becomes the ERP's `erp-shell-header`.

6. **Use the same icon library**: Bootstrap Icons only — `bi-*` classes. Avoid adding Heroicons, Font Awesome, etc.

7. **Routing convention**: Follow `/{section}/{module}` path convention so future merger into the ERP shell requires only adding a new dept-menu entry in `dept-menus.ts`.

8. **Integration point**: When ready to integrate, you will:
   - Add a new `key` entry in `DEPARTMENTS` array (`packages/types/src/index.ts`)
   - Add menu entries in `DEPT_MENUS` (`app/lib/dept-menus.ts`)
   - Register your app's route in the ERP shell's `next.config.ts` rewrites (like `depositmanager`)
   - Your new app runs on a separate port and is proxied by the shell — same as `deposit-manager`

---

## 8. Key Architectural Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                    SMKC ERP Shell (port 3000)                 │
│  Next.js 15 · React 19 · TypeScript · Bootstrap 5 · bi-icons │
│                                                               │
│  layout.tsx                                                   │
│    └─ LanguageProvider (EN/MR i18n)                           │
│         └─ DeptProvider (active depts from DB)                │
│              └─ AuthShell                                     │
│                   ├─ Login Screen  (unauthenticated)          │
│                   └─ ERP Shell     (authenticated)            │
│                        ├─ Sticky Header (64px)                │
│                        └─ {children}                          │
│                             ├─ / → department grid            │
│                             ├─ /[dept]/dashboard              │
│                             │    └─ DashboardPage             │
│                             │         ├─ DeptSidebar          │
│                             │         ├─ Role view tabs        │
│                             │         └─ Stats + Table        │
│                             ├─ /[dept]/[module] → page.tsx    │
│                             └─ /admin/* /profile /verify      │
│                                                               │
│  API Routes (/api/*)  ← server-side Next.js route handlers    │
│    │  attach HMAC headers (X-API-Key, X-Timestamp, X-Sig)     │
│    ▼                                                          │
│  .NET 4.5 Web API (port 57031)                                │
│    ├─ ErpAuthController   (ULBERP.USERDET)                    │
│    ├─ DepartmentsController                                   │
│    ├─ UserRightsController                                    │
│    ├─ AccountsController / GAD / Water / WCW ...              │
│    └─ OracleConnectionFactory → 5 Oracle schemas              │
│                                                               │
│  Micro-apps (separate processes, proxied by shell rewrites)   │
│    ├─ deposit-manager (port 3002) → /depositmanager           │
│    └─ disabilities-registration                               │
└──────────────────────────────────────────────────────────────┘
```

---

*Document generated from source analysis of commit-as-is. Update this file when major architectural changes are made.*
