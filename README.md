# Connectz CCTV — Catalog & Setup Builder

A modern, production-ready **CCTV Product Catalog + Complete CCTV Setup Builder + Admin Inventory Management Platform**.

Built with **Next.js 16 + TypeScript + Tailwind CSS + shadcn/ui + Prisma ORM**. The database schema mirrors a Supabase normalized structure (UUIDs, `created_at`/`updated_at`, foreign keys, RLS-ready) so it can be ported to Supabase PostgreSQL with minimal changes.

---

## Quick Start

```bash
# 1. Install dependencies
bun install

# 2. Copy env vars and edit if needed
cp .env.example .env
# Default admin: connectzsalesandservices@gmail.com / Connectz@2026

# 3. Push Prisma schema to local SQLite DB
bun run db:push

# 4. Seed demo data (10 brands, 36 products, rules, transactions)
bun run scripts/seed.ts

# 5. Start dev server
bun run dev
```

Open <http://localhost:3000>.

---

## Admin Login

| Field    | Value                                 |
| -------- | ------------------------------------- |
| Email    | `connectzsalesandservices@gmail.com`  |
| Password | `Connectz@2026`                       |

Change these in `.env` via `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

WhatsApp support: **+91 78094 65102** (configurable via `NEXT_PUBLIC_WHATSAPP_NUMBER`).

---

## Features

### Customer View
- **Catalog browser** with 8 categories (IP cameras, Analog cameras, DVR/NVR, HDD, PoE, SMPS, Cables, Accessories), search, brand/type/megapixel filters, sort
- **Product cards** with image carousel, featured/discount/low-stock badges, megapixel/tech/variety chips, MRP + sale price + savings, **Learn** modal (simple + technical explanations), qty +/- controls, Add to Setup
- **4 calculators**: HDD retention (e.g. *8 × 4MP + H.265 + 24h + 6TB → ~17 days*), PoE power budget, SMPS power, Cable length with per-camera distances and wastage %
- **7-step Setup Builder** (Cameras → Recorder → Storage → Power/PoE → Cable → Accessories → Review) with a sticky summary panel showing sectioned cart, real-time compatibility warnings, and Subtotal/Discount/GST(18%)/Grand Total
- **Request Quote** modal that saves customer + setup configuration to the database
- Floating **WhatsApp** support button

### Admin View (login required)
- **Dashboard**: 8 stat cards, stock movement bar chart, sales trend area chart, top products, category distribution pie, low-stock alerts, recent activity table
- **Products**: full CRUD — create / edit / delete / enable-disable / price editor / image manager / specs editor / features editor / learning content editor
- **Inventory**: per-product transaction ledger with Opening + Purchases + Returns − Sales − Damage = Current Stock formula
- **CCTV Rules**: 5-tab manager for Compatibility / Storage / Power / Cable / Learning rules — all DB-driven, no hard-coded specs
- **Quote Requests**: list of customer-submitted quotes with full setup config and totals
- **Warehouses** & **Suppliers** master data

### Compatibility Engine (database-driven)
Validates the customer setup against rules and shows clear warnings:
- IP cameras require NVR (vs DVR)
- Analog cameras require DVR/XVR
- Camera count ≤ recorder channels
- Camera resolution ≤ recorder max resolution
- PoE power budget vs total camera wattage
- Cable type matches system (Cat6 for IP, RG59/Siamese for Analog)
- HDD retention vs target days
- Missing SMPS / PoE switch / HDD

---

## Tech Stack

| Layer            | Technology                                                    |
| ---------------- | ------------------------------------------------------------- |
| Framework        | Next.js 16 (App Router) + TypeScript 5                        |
| Styling          | Tailwind CSS 4 + shadcn/ui (New York) + Lucide icons          |
| Database         | Prisma ORM + SQLite (local dev, Supabase-ready schema)        |
| State management | Zustand (client) + TanStack Query (server)                   |
| Auth             | NextAuth.js v4 (credentials provider, JWT sessions)          |
| Charts           | Recharts                                                       |
| Toasts           | Sonner                                                         |

---

## Project Structure

```
prisma/
  schema.prisma              # 25+ models — Supabase-migratable
scripts/
  seed.ts                    # Demo data: brands, products, rules, transactions
src/
  app/
    api/                     # REST routes: catalog, rules, dashboard, quote, inventory, products, auth
    auth/[...nextauth]/      # NextAuth credentials provider
    layout.tsx               # Root layout with Providers
    page.tsx                 # Main app (Customer / Admin view switch)
    providers.tsx            # QueryClient + SessionProvider + Toasters
  components/
    admin/                   # AdminView, AdminOverview, ProductsTable, RulesManager, WarehousesView, QuotesView, LoginModal
    cctv/                    # CustomerView, CatalogBrowser, ProductCard, Calculators, SetupSummary, SetupSteps
    ui/                      # shadcn/ui component library
  lib/
    cctv/                    # types, calculators, compatibility engine, setup-store (Zustand), hooks
    db.ts                    # Prisma client
```

---

## Database Schema (Prisma → Supabase)

25+ normalized models including:
- **Auth**: `Profile`, `Role` (5 roles: Super Admin / Inventory Mgr / Catalogue Mgr / Sales Mgr / Viewer)
- **Catalog**: `Brand`, `Category`, `Product`, `ProductVariant`, `Pricing`, `LearningContent`
- **Inventory**: `Warehouse`, `WarehouseLocation`, `Inventory`, `InventoryTransaction` (ledger), `StockTransfer`
- **Suppliers**: `Supplier`, `ProductSupplier`
- **Rules**: `CompatibilityRule`, `StorageCalculationRule`, `PowerCalculationRule`, `CableCalculationRule`, `AccessoryRecommendationRule`
- **Commerce**: `Customer`, `QuoteRequest`
- **Settings**: `AppSetting`

All tables use UUID-like CUID primary keys and include `createdAt` / `updatedAt` timestamps.

To port to Supabase:
1. Convert Prisma schema → Supabase SQL migration
2. Replace `@/lib/db` import with Supabase client
3. Add Row Level Security policies per role
4. Create Storage buckets: `product-images`, `product-documents`, `product-videos`, `brand-assets`, `category-assets`

---

## Scripts

| Command                       | Description                                            |
| ----------------------------- | ------------------------------------------------------ |
| `bun run dev`                 | Start Next.js dev server on port 3000                  |
| `bun run build`               | Production build                                       |
| `bun run lint`                | ESLint check                                           |
| `bun run db:push`             | Push Prisma schema to database                        |
| `bun run db:generate`         | Regenerate Prisma Client                               |
| `bun run scripts/seed.ts`     | Seed demo data (idempotent — wipes & re-inserts)       |

---

## Production Deployment

### Deploy on Vercel (recommended, ~5 minutes)

1. **Push to GitHub** (already done at <https://github.com/fdandcb-cyber/cnz-card>)

2. **Set up Supabase first** (gives you `DATABASE_URL`):
   - Create a project at <https://supabase.com>
   - Open Supabase SQL Editor → paste contents of [`supabase/schema.sql`](supabase/schema.sql) → Run
   - This creates all 22 tables, indexes, RLS policies, and seeds the rules
   - Project Settings → Database → Connection string → copy the URI
   - Replace `[YOUR-PASSWORD]` with your actual DB password

3. **Import to Vercel**:
   - Go to <https://vercel.com/new>
   - Find `fdandcb-cyber/cnz-card` → **Import**
   - Framework: **Next.js** (auto-detected)
   - Build & Output Settings: leave as default

4. **Add Environment Variables** (in the Vercel import screen):

   | Name | Value |
   |---|---|
   | `DATABASE_URL` | Your Supabase connection string (Step 2) |
   | `ADMIN_EMAIL` | `connectzsalesandservices@gmail.com` |
   | `ADMIN_PASSWORD` | Your strong password (e.g. `Connectz@2026`) |
   | `NEXTAUTH_SECRET` | Click **Generate** in Vercel, or run `openssl rand -base64 32` locally |
   | `NEXTAUTH_URL` | Leave empty for first deploy; set after Vercel gives you the URL (e.g. `https://cnz-card.vercel.app`) |
   | `NEXT_PUBLIC_WHATSAPP_NUMBER` | `917809465102` |

5. **Click Deploy** — wait ~2-3 min

6. **After deploy, set `NEXTAUTH_URL`**:
   - Vercel → your project → **Settings → Environment Variables**
   - Edit `NEXTAUTH_URL` → set to your live URL (e.g. `https://cnz-card.vercel.app`)
   - Save → go to **Deployments** → ⋮ on latest deploy → **Redeploy**

7. **Optional: Seed demo products** (only if you want the 36 demo products):
   - Run locally with your Supabase `DATABASE_URL` set in `.env`:
     ```bash
     DATABASE_URL='postgresql://...' bun run scripts/seed.ts
     ```
   - This inserts brands, categories, products, warehouses, suppliers

### Other platforms

1. Set environment variables in your hosting platform (Vercel / Netlify / self-hosted):
   - `DATABASE_URL` — Supabase PostgreSQL connection string
   - `ADMIN_EMAIL` — your admin email
   - `ADMIN_PASSWORD` — strong password (use a secret manager)
   - `NEXTAUTH_SECRET` — generate with `openssl rand -base64 32`
   - `NEXTAUTH_URL` — your production URL
   - `NEXT_PUBLIC_WHATSAPP_NUMBER` — your WhatsApp support number (international format, no `+`)
2. Run `supabase/schema.sql` against your PostgreSQL database
3. Build with `bun run build`
4. Deploy

---

## License

Proprietary — Connectz. Demo build for evaluation.
