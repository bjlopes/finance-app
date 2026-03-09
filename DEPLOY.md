# Deploy to Vercel

## Prerequisites

1. **Supabase project** – Create one at [supabase.com](https://supabase.com)
2. **Vercel account** – Sign up at [vercel.com](https://vercel.com)

## Step 1: Prepare Supabase

1. In Supabase **SQL Editor**, run the contents of `supabase/migrations/001_create_user_data.sql`
2. Go to **Authentication → URL Configuration**
3. Add these **Redirect URLs**:
   - `https://your-project.vercel.app/auth/callback`
   - `https://*.vercel.app/auth/callback` (for preview deployments)

## Step 2: Deploy to Vercel

### Option A: Deploy via GitHub

1. Push this project to a GitHub repository
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import the repository
4. Add **Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL` – from Supabase Settings → API
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` – from Supabase Settings → API
5. Click **Deploy**

### Option B: Deploy via CLI

```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Login (opens browser)
vercel login

# Deploy from project folder
cd finance-app
vercel

# Add env vars when prompted, or in Vercel Dashboard:
# Settings → Environment Variables
```

## Step 3: Update Supabase redirect URL

After the first deploy, copy your production URL (e.g. `https://finance-app-xxx.vercel.app`) and add it to Supabase **Auth → URL Configuration → Redirect URLs**:

```
https://finance-app-xxx.vercel.app/auth/callback
```

## Environment variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous/public key |

Both are required for authentication and cloud sync. Without them, the app runs in local-only mode.
