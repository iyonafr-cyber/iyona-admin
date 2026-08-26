# iyona-admin
Platform **admin/operator SPA** for **Iyona AI** — separate from the user-facing app. Used by Iyona operators to manage users, projects, credits, models, AI provider keys, subscriptions, settings, and audit logs.
## Stack
React 19 · Vite 7 · TypeScript 6 (Node 24, see `.nvmrc`) · Tailwind CSS v4 (CSS-first, no `tailwind.config.js`) · Redux Toolkit · react-router v7 · react-i18next · `recharts` for dashboards. Shared API types come from the vendored `@iyona/api-client` package (`packages/iyona-api-client`, mirrored from `iyona-front` and vendored so Vercel builds resolve it without the sibling repo).
## Quick start
```bash
nvm use            # Node 24 from .nvmrc
npm install
npm run dev        # Vite dev server (http://localhost:5174)
npm run build      # builds @iyona/api-client, then tsc -b && vite build
npm run lint
```
Copy `.env.example` → `.env`; every screen requires an **admin-role** JWT from `iyona-backend`.
## Surfaces (`src/pages/` + routes)
| Route | Purpose |
|-------|---------|
| `/` | Dashboard |
| `/users`, `/users/:id` | Users — manual subscription grant/revoke on detail page |
| `/projects`, `/projects/:id` | Projects — Supabase schema, scaffold metadata on detail |
| `/credits` | Credits administration |
| `/models` | Model catalog |
| `/provider-keys` | AI provider keys + Health-badge probe |
| `/settings` | Platform settings |
| `/audit` | Audit log |
## Conventions
- API calls go through typed services in `src/services/features/admin/*` — no ad-hoc axios in components.
- Confirm destructive actions in the UI (this panel affects billing, credits, access).
- Mutating actions must hit endpoints the backend `AuditModule` records.
## Orientation
Read [`AGENTS.md`](./AGENTS.md), [`.cursor/APP_CONTEXT.md`](./.cursor/APP_CONTEXT.md), and [`.cursor/rules/about-iyona.mdc`](./.cursor/rules/about-iyona.mdc) before making changes. Sibling repos: `../iyona-backend` (NestJS API; admin endpoints under `src/admin/*`), `../iyona-front` (user SPA).
