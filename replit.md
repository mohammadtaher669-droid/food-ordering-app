# Mat'ami — Multi-Restaurant Food Ordering Platform

## Overview

Premium multi-restaurant food ordering web app with WhatsApp order routing, bilingual Arabic/English support, and a full admin panel. Frontend-only, no backend — all data persisted via localStorage.

## Stack

- **Framework**: React + Vite + TypeScript (`@workspace/food-ordering`)
- **Monorepo**: pnpm workspaces
- **Routing**: Wouter
- **Styling**: Tailwind CSS + shadcn/ui, dark premium theme (#0F0F0F bg, #FF7A00 primary)
- **Animations**: Framer Motion
- **State**: localStorage-based reactive store (`src/lib/store.ts`)

## Key Files

- `src/lib/store.ts` — Central typed CRUD store for all entities (Restaurant, Branch, Category, MenuItem, Offer, Coupon, Review). Dispatches `store-updated` events for reactivity.
- `src/lib/initStore.ts` — Seeds default data on first load.
- `src/data/seedData.ts` — Real restaurant data + 100+ menu items extracted from menu images.
- `src/hooks/useStore.ts` — React hook for reactive store subscriptions.
- `src/contexts/CartContext.tsx` — Cart state with localStorage persistence.
- `src/contexts/LanguageContext.tsx` — Bilingual AR/EN + RTL support.

## Restaurants

1. **Sabah Al Lail** (صباح الليل) — Breakfast, BBQ, late-night. Color: #6A9B3B
2. **Asad Al Hamra Al-Bukhari** (أسد الحمراء البخاري) — Bukhari rice, grills, Saudi cuisine. Color: #C1121F
3. **Chickens Bar** — Shawarma, Broasted, Burgers. Color: #FF5722

Each has 2 branches (Riyadh + Jeddah) with WhatsApp numbers, delivery fees, and working hours.

## Features

### Customer Side
- Home with offers carousel and restaurant cards
- Restaurant page: popular items strip, new items, branch selection with open/closed status
- Branch page: category tabs, menu items with Add to Cart
- Cart: quantity control, promo codes, auto-discount (10% over 50 SAR + 2 SAR pickup)
- Checkout: customer details form, WhatsApp order routing
- Confirmation + review submission

### Admin Panel (`/admin`, password: `admin123`)
- **Dashboard**: stats overview + JSON export/import + reset
- **Restaurants**: full CRUD — name, logo (emoji or image upload), color theme, description
- **Branches**: full CRUD — name, WhatsApp, open/close hours, delivery fee, address
- **Menu Builder**: category + item CRUD with image upload, popular/new/available toggles
- **Offers**: create/toggle/delete promotional offers (%, fixed, free delivery) with carousel display
- **Coupons**: create/toggle/delete coupon codes
- **Reviews**: approve or delete customer reviews

## Assets

Logos at `attached_assets/`:
- `لوجو_الموقع_مطعمي_1776635393637.png` — Mat'ami platform logo
- `صباح_الليل_1776635384733.png` — Sabah Al Lail
- `اسد_الحمرا_1776635384732.png` — Asad Al Hamra
- `chickens_bar_1776635384731.png` — Chickens Bar

## Dev Commands

```bash
pnpm --filter @workspace/food-ordering run dev   # start dev server
```

The app auto-initializes store data from seedData.ts on first load. Reset via Admin > Dashboard > Reset.
