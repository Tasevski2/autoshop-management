# Deployment Guide

Step-by-step instructions for running AutoShop Manager locally and deploying it to production using Supabase, Cloudflare Pages, and GitHub Actions.

## Table of Contents

- [Local Development](#local-development)
- [Supabase Production Setup](#supabase-production-setup)
- [Cloudflare Pages Setup](#cloudflare-pages-setup)
- [GitHub Actions (CI/CD)](#github-actions-cicd)
- [Environment Variables Reference](#environment-variables-reference)

---

## Local Development

### Prerequisites

- **Node.js** >= 20
- **Docker** (required for local Supabase)
- **Supabase CLI** — install with `npm install -g supabase`

### Step 1 — Clone and install dependencies

```bash
git clone <your-repo-url>
cd autoshop-management
npm install
```

### Step 2 — Start local Supabase

```bash
supabase start
```

This spins up a local Supabase instance via Docker. On first run it will pull the required images — this may take a few minutes.

Once started, the CLI will print the local credentials:

```text
API URL:   http://localhost:54321
anon key:  eyJhbGciOiJI...  (a long JWT)
DB URL:    postgresql://postgres:postgres@localhost:54322/postgres
Studio:    http://localhost:54323
```

### Step 3 — Configure environment variables

Copy the example file and fill in the local values printed above:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```text
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=<paste the anon key from supabase start output>
```

### Step 4 — Apply migrations and seed data

```bash
supabase db reset
```

This drops and recreates the local database and applies all migrations from `supabase/migrations/` (including the global vehicle brands and models seed data).

### Step 5 — Start the dev server

```bash
npm run dev
```

The app will be available at **http://localhost:5173**. Before logging in, create a user in the local Supabase Studio at [http://127.0.0.1:54323/project/default/auth/users](http://127.0.0.1:54323/project/default/auth/users) — click **Add User** and set any email/password.

### Step 6 — Generate TypeScript types (optional)

If you modify the database schema, regenerate the types:

```bash
supabase gen types typescript --local > src/types/database.ts
```

---

## Supabase Production Setup

### Step 1 — Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and sign in.
2. Click **New Project**.
3. Choose an organization, enter a project name, set a **database password** (save this — you'll need it for CI/CD), and select a region.
4. Wait for the project to finish provisioning.

### Step 2 — Get your project credentials

From your project dashboard:

1. Go to **Settings > API**.
2. Copy the **Project URL** — this is your `VITE_SUPABASE_URL`.
3. Copy the **anon/public key** — this is your `VITE_SUPABASE_ANON_KEY`.
4. Go to **Settings > General** and copy the **Reference ID** — this is your `SUPABASE_PROJECT_ID`.

### Step 3 — Get your access token

1. Go to [supabase.com/dashboard/account/tokens](https://supabase.com/dashboard/account/tokens).
2. Generate a new **access token** — this is your `SUPABASE_ACCESS_TOKEN`.

### Step 4 — Push migrations

From your local machine:

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

This applies all migrations to your production database.

### Step 5 — Verify storage bucket

The migrations automatically create a `service-images` storage bucket. Verify it exists:

1. Go to **Storage** in the Supabase dashboard.
2. You should see the `service-images` bucket listed.

---

## Cloudflare Pages Setup

### Step 1 — Create a Cloudflare account

Go to [cloudflare.com](https://www.cloudflare.com) and sign up (the free plan is sufficient).

### Step 2 — Connect your GitHub repository

1. In the Cloudflare dashboard, go to **Workers & Pages > Create**.
2. Select **Pages** and click **Connect to Git**.
3. Authorize Cloudflare to access your GitHub account.
4. Select the repository containing this project.

### Step 3 — Configure build settings

| Setting                    | Value                                                   |
| -------------------------- | ------------------------------------------------------- |
| **Production branch**      | `main`                                                  |
| **Build command**          | `npm run build`                                         |
| **Build output directory** | `dist`                                                  |
| **Node.js version**        | `20` (set via environment variable `NODE_VERSION = 20`) |

### Step 4 — Set environment variables

In the Cloudflare Pages project settings, go to **Settings > Environment variables** and add:

| Variable                 | Value                                                     |
| ------------------------ | --------------------------------------------------------- |
| `VITE_SUPABASE_URL`      | Your Supabase project URL (from Step 2 of Supabase setup) |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon/public key                             |

### Step 5 — Deploy

Click **Save and Deploy**. Cloudflare will build the project and deploy it to a `*.pages.dev` URL. Every subsequent push to `main` will trigger an automatic redeployment.

### Step 6 — Custom domain (optional)

1. Go to your Pages project > **Custom domains**.
2. Add your domain and follow the DNS configuration instructions.

---

## GitHub Actions (CI/CD)

The project includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that automatically pushes Supabase migrations on every push to `main`.

### Step 1 — Add GitHub secrets

Go to your GitHub repository > **Settings > Secrets and variables > Actions** and add these secrets:

| Secret                  | Where to find it                                                                       |
| ----------------------- | -------------------------------------------------------------------------------------- |
| `SUPABASE_ACCESS_TOKEN` | [supabase.com/dashboard/account/tokens](https://supabase.com/dashboard/account/tokens) |
| `SUPABASE_PROJECT_ID`   | Supabase dashboard > Settings > General > Reference ID                                 |
| `SUPABASE_DB_PASSWORD`  | The database password you set when creating the Supabase project                       |

### Step 2 — Verify the workflow

After adding the secrets, push a commit to `main`. The "Migrate" workflow should:

1. Check out the repository.
2. Install the Supabase CLI.
3. Link to your production project.
4. Run `supabase db push` to apply any new migrations.

You can monitor the workflow in **GitHub > Actions**.

### How deployments work

```text
Push to main
  ├── Cloudflare Pages (automatic)
  │     → Builds the frontend (npm run build)
  │     → Deploys static files to CDN
  │
  └── GitHub Actions (automatic)
        → Runs supabase db push
        → Applies new SQL migrations to production database
```

Both run independently and in parallel. The frontend deploy typically completes in under a minute; migrations depend on complexity.

---

## Environment Variables Reference

### Local development (`.env.local`)

| Variable                 | Value                                |
| ------------------------ | ------------------------------------ |
| `VITE_SUPABASE_URL`      | `http://localhost:54321`             |
| `VITE_SUPABASE_ANON_KEY` | Local anon key from `supabase start` |

### Cloudflare Pages (build-time)

| Variable                 | Value                           |
| ------------------------ | ------------------------------- |
| `VITE_SUPABASE_URL`      | Production Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Production anon/public key      |
| `NODE_VERSION`           | `20`                            |

### GitHub Actions (secrets)

| Secret                  | Purpose                                           |
| ----------------------- | ------------------------------------------------- |
| `SUPABASE_ACCESS_TOKEN` | Authenticates the Supabase CLI                    |
| `SUPABASE_PROJECT_ID`   | Identifies which Supabase project to target       |
| `SUPABASE_DB_PASSWORD`  | Authenticates database connections for migrations |
