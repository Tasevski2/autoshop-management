# CLAUDE.md

## Project Overview

Car workshop management app. Handles customers, cars, service history, invoices, profit/expense tracking, reminders, and photo attachments.

## Tech Stack

- **Frontend:** React 18 + Vite + TypeScript
- **Backend:** Supabase (Postgres, Auth, Edge Functions, Storage)
- **Styling:** Tailwind CSS
- **Server State:** TanStack Query (React Query) — all Supabase data fetching goes through query/mutation hooks
- **Routing:** React Router v7
- **Hosting:** Vercel / Netlify / Cloudflare Pages (static SPA deploy)

## Core Features

- Customer management with contact info and notes
- Car registry linked to customers (make, model, year, plates, VIN)
- Service history per car with descriptions of work performed
- Photo attachments per service (before/after damage photos via Supabase Storage)
- Invoice generation with payment status tracking (paid / unpaid / partial)
- Profit & expense calculations (daily / monthly / yearly)
- Service reminders (km-based and time-based intervals) so the owner can call customers
- WhatsApp deep links for quick customer contact
- Recurring service templates (oil change, brakes, filters with default intervals)
- Daily summary dashboard (today's work, pending payments, upcoming reminders)
- Global search across customers, cars, and services

## Project Structure

```
├── supabase/
│   ├── migrations/          # Numbered SQL migrations (source of truth for schema)
│   ├── functions/           # Deno-based Edge Functions
│   │   └── _shared/        # Shared utilities across functions (CORS, auth, validation)
│   ├── seed.sql             # Development seed data
│   └── config.toml          # Supabase local config
├── src/
│   ├── components/          # Reusable UI components
│   │   └── ui/             # Primitive/base components (Button, Input, Modal, etc.)
│   ├── features/            # Feature-based modules (co-located logic)
│   │   ├── auth/
│   │   ├── customers/
│   │   ├── cars/
│   │   ├── services/
│   │   ├── invoices/
│   │   ├── reminders/
│   │   ├── dashboard/
│   │   └── reports/
│   │   └── [feature]/
│   │       ├── components/  # Feature-specific components
│   │       ├── hooks/       # Feature-specific hooks (useCustomers, useCreateCar, etc.)
│   │       ├── types.ts     # Feature-specific types (derived from database.ts)
│   │       └── api.ts       # Supabase queries for this feature
│   ├── hooks/               # Shared custom hooks
│   ├── lib/
│   │   ├── supabase.ts     # Supabase client init (single instance)
│   │   ├── query-client.ts  # TanStack Query client config
│   │   └── utils.ts
│   ├── types/
│   │   ├── database.ts     # Auto-generated — NEVER edit manually
│   │   └── index.ts
│   ├── routes/              # Route-level page components
│   └── App.tsx
├── .github/
│   └── workflows/
│       └── deploy.yml       # CI/CD for Supabase migrations + edge functions
├── .env.local               # Local Supabase URL + anon key (git-ignored)
└── .env.example             # Template for required env vars
```

## Local Development

### Prerequisites

- Node.js >= 20
- Docker (required for local Supabase)
- Supabase CLI (`npm install -g supabase`)

### Setup

```bash
npm install
supabase start
supabase db reset          # Apply migrations + seed data
supabase gen types typescript --local > src/types/database.ts
npm run dev
```

### Local Supabase Endpoints

- Dashboard: http://localhost:54323
- API URL: http://localhost:54321
- DB: postgresql://postgres:postgres@localhost:54322/postgres
- `.env.local` points to these local endpoints — never hardcode production URLs.

### Edge Functions (local)

```bash
supabase functions serve   # All functions with hot reload
```

## Database Conventions

### Migrations

- One concern per migration file.
- File naming: `supabase/migrations/YYYYMMDDHHMMSS_descriptive_name.sql`
- Create via `supabase migration new <name>`, then write SQL manually.
- Always include RLS policies in the same migration as the table they protect.
- Never edit a migration that has been applied to production.

### Schema Patterns

- All tables: `id uuid DEFAULT gen_random_uuid() PRIMARY KEY`.
- All tables: `created_at timestamptz DEFAULT now() NOT NULL`.
- Mutable tables: `updated_at timestamptz DEFAULT now() NOT NULL` with a trigger.
- `snake_case` for all SQL identifiers.
- Foreign keys always have explicit `ON DELETE` behavior.
- Every table has Row Level Security enabled. No exceptions.
- RLS policies authenticate via `auth.uid()`.

### RLS Policy Naming

Format: `[table]_[action]_[role]` — e.g., `customers_select_owner`, `services_insert_owner`.

## Edge Functions

- Runtime: Deno (TypeScript). Import from `https://esm.sh/` or Deno std.
- Shared code goes in `supabase/functions/_shared/`.
- Validate request body with Zod (via esm.sh).
- Return consistent JSON: `{ data: T }` on success, `{ error: string }` on failure.
- Use `supabase.auth.getUser()` for auth — never trust client-sent user IDs.
- Set CORS headers using the shared CORS utility.

## Frontend Conventions

### Supabase Client

- Single client instance exported from `src/lib/supabase.ts`.
- Typed with the generated schema: `createClient<Database>(url, key)`.

### Data Fetching (TanStack Query)

- All Supabase reads go through `useQuery` hooks in feature-level `hooks/` directories.
- All Supabase writes go through `useMutation` hooks with proper cache invalidation.
- Query keys are namespaced by feature: `['customers', 'list']`, `['cars', 'detail', id]`, `['services', 'by-car', carId]`.
- Raw Supabase queries live in feature-level `api.ts` files — hooks import from there.
- Handle loading, error, and empty states explicitly in every data-consuming component.

### Type Safety

- `src/types/database.ts` is auto-generated. Never edit manually.
- Derive row/insert/update types from the generated schema:
  ```ts
  type Customer = Database["public"]["Tables"]["customers"]["Row"];
  type CustomerInsert = Database["public"]["Tables"]["customers"]["Insert"];
  ```
- Prefer derived types over hand-written interfaces for anything backed by a table.

### Component Patterns

- Feature components live in `src/features/[feature]/components/`.
- Shared/reusable components live in `src/components/`.
- Co-locate hooks, types, and API calls with their feature.
- Props interfaces are defined in the same file, above the component.

### Naming

- Components: `PascalCase` files and exports.
- Hooks: `camelCase`, prefixed with `use` — e.g., `useCustomers.ts`.
- Utilities: `camelCase` functions, `camelCase` files.
- Types: `PascalCase`, no `I` prefix.
- Constants: `UPPER_SNAKE_CASE`.
- Query keys: `camelCase` arrays — e.g., `['invoices', 'unpaid']`.

## CI/CD — GitHub Actions

### Pipeline (`deploy.yml`)

Triggers on push to `main`. Two jobs:

1. **Migrate** — runs `supabase db push` to apply new migrations to production.
2. **Deploy Functions** — runs `supabase functions deploy` for all edge functions.

### Required GitHub Secrets

| Secret                  | Description                                                      |
| ----------------------- | ---------------------------------------------------------------- |
| `SUPABASE_ACCESS_TOKEN` | Personal access token from supabase.com/dashboard/account/tokens |
| `SUPABASE_PROJECT_ID`   | Project ref from project settings                                |
| `SUPABASE_DB_PASSWORD`  | Database password for the production project                     |

### Workflow Rules

- Never push migrations that haven't been tested locally with `supabase db reset`.
- The pipeline has no rollback — destructive migrations require careful review.
- Edge function deploys are all-or-nothing per push.

## Environment Variables

| Variable                 | Local Value                          | Production                 |
| ------------------------ | ------------------------------------ | -------------------------- |
| `VITE_SUPABASE_URL`      | `http://localhost:54321`             | Project URL from dashboard |
| `VITE_SUPABASE_ANON_KEY` | Local anon key from `supabase start` | Anon key from dashboard    |

- All client-exposed vars are prefixed with `VITE_`.
- Server-only secrets (Edge Functions) are set via `supabase secrets set` and accessed with `Deno.env.get()`.

## Commands Reference

```bash
npm run dev              # Start Vite dev server
npm run build            # Production build
npm run lint             # ESLint
npm run typecheck        # tsc --noEmit

supabase start           # Start local Supabase
supabase stop            # Stop local Supabase
supabase db reset        # Reapply all migrations + seed
supabase migration new   # Create a new migration file
supabase gen types typescript --local > src/types/database.ts
supabase functions serve  # Local Edge Functions
supabase functions deploy # Deploy functions to production
supabase db push         # Push migrations to production
```
