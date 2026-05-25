# Mat'ami — Multi-Restaurant Food Ordering Platform

A production-ready, full-stack food ordering web app with WhatsApp order routing, bilingual Arabic/English support, a comprehensive admin panel, and a REST API backed by PostgreSQL.

---

## Live Demo

The app is deployed on Replit. The admin panel is at `/admin`.

---

## Architecture

```
matami/
├── artifacts/
│   ├── food-ordering/        # React + Vite + TypeScript frontend
│   └── api-server/           # Express + Drizzle ORM REST API
├── lib/
│   ├── db/                   # Drizzle schema + PostgreSQL client
│   ├── api-spec/             # OpenAPI spec + codegen
│   ├── api-zod/              # Shared Zod validators
│   └── api-client-react/     # React Query hooks (generated)
├── .env.example              # All required environment variables
└── pnpm-workspace.yaml       # pnpm monorepo config
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 7, TypeScript, Tailwind CSS v4, shadcn/ui |
| Routing | Wouter |
| Animations | Framer Motion |
| State | React Query + in-memory store synced to PostgreSQL |
| Backend | Express 5, Drizzle ORM, PostgreSQL |
| Auth | JWT (admin panel) |
| Images | Cloudinary (optional) — falls back to Base64 |
| Package manager | pnpm workspaces |

---

## Prerequisites

- **Node.js** ≥ 20
- **pnpm** ≥ 9 — install with `npm install -g pnpm`
- **PostgreSQL** ≥ 15 — running locally or via a cloud provider

---

## Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/mohammadtaher669-droid/food-ordering-app.git
cd food-ordering-app
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in every value (see [Environment Variables](#environment-variables) below).

### 4. Push the database schema

```bash
pnpm --filter @workspace/db run push
```

This runs `drizzle-kit push` and creates all 18 tables in your PostgreSQL database. Safe to re-run — it is non-destructive.

### 5. Seed initial data

Start the API server first (step 6), then in a second terminal:

```bash
curl -X POST http://localhost:3001/api/seed
```

This populates the database with all three restaurants, their branches, menus (100+ items), categories, and default app settings.

### 6. Start the API server

```bash
pnpm --filter @workspace/api-server run dev
```

The API server will be available at `http://localhost:3001`.

### 7. Start the frontend

In a new terminal:

```bash
pnpm --filter @workspace/food-ordering run dev
```

The app will be available at `http://localhost:5173`.

---

## Environment Variables

All variables are documented in `.env.example`. Copy it to `.env` before running locally.

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | Full PostgreSQL connection string: `postgresql://user:pass@host:5432/db` |
| `PGHOST` | ✅ | PostgreSQL host |
| `PGPORT` | ✅ | PostgreSQL port (default `5432`) |
| `PGDATABASE` | ✅ | Database name |
| `PGUSER` | ✅ | Database user |
| `PGPASSWORD` | ✅ | Database password |
| `JWT_SECRET` | ✅ | Random string ≥ 32 chars. Generate: `openssl rand -hex 32` |
| `ADMIN_PASSWORD` | ✅ | Password for the `/admin` panel |
| `CLOUDINARY_URL` | ☐ | `cloudinary://API_KEY:API_SECRET@CLOUD_NAME` — if omitted, images are stored as Base64 in the DB |
| `PORT` | ☐ | API server port (default `3001`) |
| `NODE_ENV` | ☐ | `development` or `production` |

---

## Running Both Services Together

For convenience you can run both in parallel with a single command:

```bash
# Terminal 1 — API
pnpm --filter @workspace/api-server run dev

# Terminal 2 — Frontend
pnpm --filter @workspace/food-ordering run dev
```

Or use any process manager (e.g. `concurrently`, `pm2`, `foreman`).

---

## Production Build

```bash
# Type-check everything
pnpm run typecheck

# Build the frontend (outputs to artifacts/food-ordering/dist/public)
PORT=3000 BASE_PATH=/ pnpm --filter @workspace/food-ordering run build

# Build the API server (outputs to artifacts/api-server/dist)
pnpm --filter @workspace/api-server run build

# Start the API in production
NODE_ENV=production pnpm --filter @workspace/api-server run start
```

Serve `artifacts/food-ordering/dist/public` with any static host (Nginx, Caddy, Vercel, etc.) and point the frontend's API calls at your production API URL.

---

## API Reference

Base URL: `http://localhost:3001`

### Authentication

```
POST   /api/admin/login          Login — returns JWT { token }
GET    /api/admin/verify         Verify token (Authorization: Bearer <token>)
```

All `/api/admin/*` routes and mutating endpoints require `Authorization: Bearer <token>`.

### Restaurants & Catalog

```
GET    /api/restaurants          List all restaurants
GET    /api/restaurants/:id      Get restaurant with branches
POST   /api/restaurants          Create restaurant (admin)
PATCH  /api/restaurants/:id      Update restaurant (admin)
DELETE /api/restaurants/:id      Delete restaurant (admin)

GET    /api/branches             List branches (optional ?restaurantId=)
POST   /api/branches             Create branch (admin)
PATCH  /api/branches/:id         Update branch (admin)
DELETE /api/branches/:id         Delete branch (admin)

GET    /api/categories           List categories (optional ?branchId=)
POST   /api/categories           Create category (admin)
PATCH  /api/categories/:id       Update category (admin)
DELETE /api/categories/:id       Delete category (admin)

GET    /api/menu-items           List items (optional ?categoryId=, ?branchId=)
GET    /api/menu-items/:id       Get single item
POST   /api/menu-items           Create item (admin)
PATCH  /api/menu-items/:id       Update item (admin)
DELETE /api/menu-items/:id       Delete item (admin)
```

### Offers & Coupons

```
GET    /api/offers               List active offers
POST   /api/offers               Create offer (admin)
PATCH  /api/offers/:id           Update offer (admin)
DELETE /api/offers/:id           Delete offer (admin)

GET    /api/coupons              List coupons (admin)
POST   /api/coupons              Create coupon (admin)
POST   /api/coupons/validate     Validate a coupon code (public)
PATCH  /api/coupons/:id          Update coupon (admin)
DELETE /api/coupons/:id          Delete coupon (admin)
```

### Orders & CRM

```
GET    /api/orders               List orders (admin)
POST   /api/orders               Submit new order (public)
PATCH  /api/orders/:id           Update order status (admin)

GET    /api/customers            List customers (admin)
GET    /api/customers/:id        Get customer with order history (admin)
PATCH  /api/customers/:id        Update customer (admin)
```

### Content & Settings

```
GET    /api/banners              List active banners
POST   /api/banners              Create banner (admin)
PATCH  /api/banners/:id          Update banner (admin)
DELETE /api/banners/:id          Delete banner (admin)

GET    /api/settings             Get app settings
PATCH  /api/settings             Update app settings (admin)
```

### Modifier Groups

```
GET    /api/modifier-groups      List modifier groups
POST   /api/modifier-groups      Create group (admin)
PATCH  /api/modifier-groups/:id  Update group (admin)
DELETE /api/modifier-groups/:id  Delete group (admin)

POST   /api/modifier-options     Create option (admin)
PATCH  /api/modifier-options/:id Update option (admin)
DELETE /api/modifier-options/:id Delete option (admin)
```

### Utility

```
POST   /api/seed                 Seed database with default data
GET    /api/data                 Full data snapshot (used by frontend store sync)
POST   /api/images/upload        Upload image → Cloudinary or Base64
GET    /api/healthz              Health check
```

---

## Database Schema

All 18 tables managed by Drizzle ORM in `lib/db/src/schema/`:

| File | Tables |
|---|---|
| `restaurants.ts` | `restaurants` |
| `branches.ts` | `branches` |
| `categories.ts` | `categories` |
| `menu_items.ts` | `menu_items` |
| `modifiers.ts` | `modifier_groups`, `modifier_options`, `item_modifier_groups`, `modifier_overrides` |
| `offers.ts` | `offers` |
| `coupons.ts` | `coupons` |
| `orders.ts` | `orders`, `order_items` |
| `customers.ts` | `customers` |
| `banners.ts` | `banners` |
| `app_settings.ts` | `app_settings` |
| `conversations.ts` | `conversations`, `messages` |

To inspect or modify the schema, edit `lib/db/src/schema/*.ts` and re-run `pnpm --filter @workspace/db run push`.

---

## Admin Panel

Navigate to `/admin` in the browser.

Log in with the password set in `ADMIN_PASSWORD`. The session is stored in `sessionStorage` as a JWT — it expires when the tab is closed.

### Admin sections

| Section | Path |
|---|---|
| Dashboard | `/admin` |
| Restaurants | `/admin/restaurants` |
| Branches | `/admin/branches` |
| Menu Builder | `/admin/menu` |
| Menu Sorting | `/admin/menu-sorting` |
| Menu Import | `/admin/menu-import` |
| Modifiers | `/admin/modifiers` |
| Offers | `/admin/offers` |
| Coupons | `/admin/coupons` |
| Orders | `/admin/orders` |
| Customers (CRM) | `/admin/customers` |
| Reviews | `/admin/reviews` |
| Banners | `/admin/banners` |
| Content Control | `/admin/content` |
| Delivery Zones | `/admin/delivery-zones` |
| Analytics | `/admin/analytics` |
| Appearance | `/admin/appearance` |
| Backgrounds | `/admin/backgrounds` |
| Settings | `/admin/settings` |

---

## Restaurants

| Restaurant | Cuisine | Brand Color |
|---|---|---|
| Sabah Al Lail (صباح الليل) | Breakfast, BBQ, late-night | `#6A9B3B` |
| Asad Al Hamra Al-Bukhari (أسد الحمراء البخاري) | Bukhari rice, grills, Saudi cuisine | `#C1121F` |
| Chickens Bar | Shawarma, Broasted, Burgers | `#FF5722` |

Each has branches in Riyadh and Jeddah with individual WhatsApp numbers and delivery settings.

---

## TypeScript Checks

```bash
# Check the whole monorepo
pnpm run typecheck

# Check only the frontend
pnpm --filter @workspace/food-ordering run typecheck

# Check only the API server
pnpm --filter @workspace/api-server run typecheck
```

---

## Image Hosting

Images are handled by `artifacts/food-ordering/src/components/ImageUploader.tsx` and the `/api/images/upload` endpoint.

- **With `CLOUDINARY_URL`**: images are uploaded to Cloudinary and stored by URL — no database bloat
- **Without `CLOUDINARY_URL`**: images are processed client-side (resized, center-cropped, converted to WebP), then stored as Base64 in the database — works out of the box with no external accounts required

---

## Deploying to Production

### On Replit (recommended)

Click **Deploy** in the Replit UI. Replit automatically provisions the PostgreSQL database, sets `DATABASE_URL`, and runs the production build.

Set these secrets in Replit's Secrets panel before deploying:

- `JWT_SECRET`
- `ADMIN_PASSWORD`
- `CLOUDINARY_URL` (optional)

### On any VPS / cloud host

1. Set all environment variables from `.env.example`
2. Run `pnpm --filter @workspace/db run push` to migrate the database
3. Run `curl -X POST https://your-api-domain/api/seed` to seed initial data
4. Build and serve the frontend static files
5. Run the API server with a process manager (pm2, systemd, etc.)

---

## License

MIT
