# Santander — Banking App

A mobile-first banking demo app built with React, TanStack Router, Tailwind CSS, and Supabase.

## Stack

- **React 19** + **TypeScript**
- **Vite 6** (pure SPA, no SSR)
- **TanStack Router** (file-based routing)
- **shadcn/ui** + **Radix UI** + **Tailwind CSS v4**
- **Supabase** (Postgres + Realtime)
- **Unified store** (`useSyncExternalStore`, localStorage + Supabase)

---

## Quick start (local)

```bash
npm install
cp .env.example .env.local   # fill in your values
npm run dev
```

---

## Environment variables

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon/public key |
| `VITE_ADMIN_EMAIL` | Admin console email (default: `admin@santander.app`) |
| `VITE_ADMIN_PASSWORD` | Admin console password (default: `admin1234`) |
| `VITE_ADMIN_PIN` | Admin 4-digit PIN (default: `1234`) |

Without Supabase vars, the app runs fully offline using localStorage only.

---

## Supabase setup

1. Create a new Supabase project
2. Open **SQL Editor** and run `supabase-schema.sql` (included in this repo)
3. In **Database → Replication**, enable Realtime on `santander_users` and `santander_transactions`
4. Copy your project URL and anon key into env vars

---

## Deploying to Vercel

1. Push to GitHub
2. Import repo in Vercel
3. Add all env vars in **Project Settings → Environment Variables**
4. Set **Build Command**: `npm run build`  
   **Output Directory**: `dist`
5. Deploy

The `vercel.json` already includes the SPA rewrite rule so all routes resolve correctly.

---

## Architecture

### Auth (two independent sessions)

| Session | Key | TTL |
|---|---|---|
| Client user | `santander.session` (sessionStorage) | 30 min |
| Admin | `santander.admin.session` (sessionStorage) | 30 min |

Admin credentials come from env vars. Client users are created by admin only.

### Store (`src/lib/store.ts`)

- Loads from `localStorage` instantly on boot
- Hydrates from Supabase on first render
- Subscribes to Supabase Realtime for live balance/transaction updates
- Every mutation writes to both localStorage and Supabase simultaneously

### Transfer logic

Transfers are **internal-only**. When a user sends money:
1. Sender's account checked for frozen status → show Contact Support modal immediately if frozen
2. Recipient bank details compared against all registered users via `findUserByBankDetails()`
3. If match found → `executeInternalTransfer()` instantly debits sender, credits recipient
4. If no match → Contact Support modal with failed_transaction reason
5. External/wire transfers do not exist

### Account controls

- **Frozen accounts**: user can log in and view dashboard, but Send page immediately redirects to Contact Support modal. A red LIEN banner appears on dashboard.
- **Admin funding**: admin balance starts at £2,000,000; admin can top up from the Overview page.

---

## Demo users (seed data)

| Name | Email | Password | PIN | Bank | Status |
|---|---|---|---|---|---|
| Alex Morgan | alex@santander.app | demo1234 | 1234 | Santander | Active |
| Sarah Kennedy | sarah.k@gmail.com | demo1234 | 1234 | Monzo | Active |
| James Patel | j.patel@outlook.com | demo1234 | 1234 | Starling Bank | Active |
| Mia Tanaka | mia.t@santander.app | demo1234 | 4321 | Revolut | Active |
| Tom Becker | tbecker@proton.me | demo1234 | 0000 | Barclays | **Frozen** |
