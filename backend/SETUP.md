# SciFit Tracker - Development Setup

## Prerequisites

| Tool | Installation |
|------|--------------|
| **Node.js** | https://nodejs.org |
| **Docker Desktop** | https://www.docker.com/products/docker-desktop |
| **Supabase CLI** | https://supabase.com/docs/guides/local-development/cli/getting-started?queryGroups=platform&platform=windows |

---

## Local Supabase

Will use for early development, then later move to cloud.

### Step 1: Start Local Supabase

```bash
# Navigate to backend directory
cd backend

# Start Supabase (runs in Docker)
supabase start
```

> **Windows:** Make sure Docker Desktop is running first
> **Mac:** `brew install supabase` if CLI not installed

### Step 2: Get Your Local API Keys

After `supabase start`, copy both `Publishable` and `Secret` Authentication Keys from the `Authentication Keys` table

- These keys look like `sb_publishable_xxxxxxxxxxxxxxxxxxxxxxx` and `sb_secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxx`, respectively

These can also be found at any time by running:
```bash
supabase status
```

### Step 3: Create Your .env File

Create new file in `scifit-tracker/backend` called `.env` and copy everything from `.env.example` to it.

Edit `.env` and fill in the Supabase keys from Step 2:

```env
# Local Supabase
SUPABASE_URL=http://localhost:54321
SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxxxxxxxxxxxxx
SUPABASE_SERVICE_ROLE_KEY=sb_secret_xxxxxxxxxxxxxxxx
SUPABASE_KEY=sb_secret_xxxxxxxxxxxxxxxx
```

### Step 4: Apply Database Schema

```bash
supabase db reset
```

This creates all tables (profiles, workouts, sets, nutrition_logs, media_uploads) and sets up Row Level Security policies.

### Step 5: Verify Database Creation Locally

Open a browser and go to http://127.0.0.1:54323 after running

```bash
supabase db reset
```

Database schema should be there and tables should be viewable.

---

___IGNORE___ (still working on this)

## Option B: Cloud Supabase

For when deployment is ready, or if we would prefer using database in the cloud from the start.

### Step 1: Link to Cloud Project

```bash
cd backend
supabase link --project-ref pvbaspuiemiwnwoonioy
```

This will open browser login - authenticate with your GitHub account

### Step 2: Update .env for Cloud

Get cloud credentials from one of these:

**Option A: From GitHub Secrets** (if you're setting up CI/CD or have access):
```
SUPABASE_URL=${{ secrets.SUPABASE_URL }}
SUPABASE_PUBLISHABLE_KEY=${{ secrets.SUPABASE_ANON_KEY }}
SUPABASE_SERVICE_ROLE_KEY=${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
SUPABASE_KEY=${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
```

**Option B: Ask for Secrets/Get Added to Dashboard:**

If on Dashboard already:

1. Go to: https://supabase.com/dashboard/project/pvbaspuiemiwnwoonioy/settings/api
2. Copy the values from there

Edit `.env` with cloud credentials:

```env
# Cloud Supabase
SUPABASE_URL=supabase_project_url
SUPABASE_PUBLISHABLE_KEY=your_cloud_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_cloud_service_role_key
SUPABASE_KEY=your_cloud_service_role_key
```

### Step 3: Push Schema to Cloud

```bash
supabase db push
```

---

## To Switch Between Local and Cloud

| Action | Command |
|--------|---------|
| Unlink cloud project | `supabase projects api delete` (or just don't run `supabase link`) |
| Check current connection | `supabase status` |
| Pull cloud schema to local | `supabase db reset` (after linking) |

---