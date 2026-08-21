# jarvis-admin

Platform **admin/operator SPA** for **Jarvis AI** — separate from the user-facing app. Used by Jarvis operators to manage users, projects, credits, models, AI provider keys, subscriptions, settings, and audit logs.

## Stack

React 19 · Vite 7 · TypeScript 6 (Node 24, see `.nvmrc`) · Tailwind CSS v4 (CSS-first, no `tailwind.config.js`) · Redux Toolkit · react-router v7 · react-i18next · `recharts` for dashboards. Shared API types come from the vendored `@jarvis/api-client` package (`packages/jarvis-api-client`, mirrored from `jarvis-front` and vendored so Vercel builds resolve it without the sibling repo).

## Quick start

```bash
nvm use            # Node 24 from .nvmrc
npm install
npm run dev        # Vite dev server (http://localhost:5174)
npm run build      # builds @jarvis/api-client, then tsc -b && vite build
npm run lint
```

Copy `.env.example` → `.env`; every screen requires an **admin-role** JWT from `jarvis-backend`.

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

Read [`AGENTS.md`](./AGENTS.md), [`.cursor/APP_CONTEXT.md`](./.cursor/APP_CONTEXT.md), and [`.cursor/rules/about-jarvis.mdc`](./.cursor/rules/about-jarvis.mdc) before making changes. Sibling repos: `../jarvis-backend` (NestJS API; admin endpoints under `src/admin/*`), `../jarvis-front` (user SPA).
