# Allo Inventory Reservation System

A focused inventory reservation app built to solve checkout race conditions for multi-warehouse retail.

## Demo
- Live app: https://allohealth01.vercel.app/
- GitHub: https://github.com/Sanjeev-k-11/Allo_reservation_system/ 

## What this project includes
- Product listing with per-warehouse stock availability.
- Reservation creation with concurrency-safe inventory hold.
- Checkout/reservation page with live expiry countdown.
- Confirm and cancel actions with immediate UI update.
- Automatic release of expired reservations.

## Tech stack
- Next.js ( Router )
- TypeScript
- Prisma + PostgreSQL
- Upstash Redis for idempotency
- Tailwind CSS
- React Query for client data fetching

## Core API routes
- `GET /api/products`
  - Returns products with inventory grouped by warehouse.
- `GET /api/warehouses`
  - Returns warehouse list.
- `POST /api/reservations`
  - Reserves quantity for `productId` + `warehouseId`.
  - Returns `409` when insufficient stock remains.
- `POST /api/reservations/:id/confirm`
  - Confirms the reservation and permanently deducts stock.
  - Returns `410` when the reservation expired.
- `POST /api/reservations/:id/release`
  - Releases a pending reservation early.
- `GET /api/cron/expire-reservations`
  - Cleans up expired pending reservations and releases reserved stock.

## How reservation concurrency is handled
Reservation logic is designed to be race-condition-free:

1. Reservation creation runs inside a Prisma transaction.
2. It reads the current inventory row and calculates available stock.
3. If enough stock exists, it atomically increments `reservedStock`.
4. The code double-checks that `reservedStock` never exceeds `totalStock`.
5. If a concurrent request causes a conflict, one request succeeds and the other returns `409`.

This means two simultaneous reservations for the last unit cannot both succeed.

## Expiry 
Expired reservations are released automatically by a cron-style cleanup endpoint:

- It finds all `PENDING` reservations with `expiresAt < now`
- For each expired reservation, it decrements `reservedStock` and marks the reservation `EXPIRED`

## Idempotency
- `POST /api/reservations` supports idempotency via the `Idempotency-Key` header.
- If the same key is reused, the server returns the original reservation response instead of creating a duplicate hold.
- Stored responses are cached in Upstash Redis for one hour.

## Running locally
1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env` with at least:
   ```env
   DATABASE_URL="your-postgres-url"
   DIRECT_URL="your-postgres-direct-url"
   UPSTASH_REDIS_REST_URL="your-upstash-url"
   UPSTASH_REDIS_REST_TOKEN="your-upstash-token"
   CRON_SECRET="some-secret-value"
   ```

3. Push schema and seed sample data:
   ```bash
   npx prisma db push
   npm run seed
   ```

4. Start the app:
   ```bash
   npm run dev
   ```

5. Open `http://localhost:3000`

## Expected UI flow
- Home page lists products and warehouse availability.
- Each warehouse row shows available stock and reserved stock.
- Clicking Reserve creates a new reservation and navigates to `/reservation/[id]`.
- The reservation page shows:
  - reservation status
  - quantity
  - countdown timer
  - Confirm purchase button
  - Cancel button
- `409` errors show when stock is unavailable.
- `410` errors show when attempting to confirm an expired reservation.

## Trade-offs and future improvements
- The current expiry cleanup is cron-based rather than event-driven. With more time I would add a background worker or database-level scheduled job for stronger guarantees.
- The reservation confirm/release endpoints are correct under concurrency, but only reservation creation is currently idempotent.
- I used a simple Redis-backed idempotency cache instead of a fully persistent request log for speed.
- The UI is intentionally focused on clarity and responsiveness rather than being a full commerce storefront.

## Notes
- The application is implemented with a hosted PostgreSQL database and Upstash Redis in mind.
- The repository structure is kept small so the main reservation flow is easy to follow.
- If you want, I can also add a dedicated reservation status API route or improve the checkout page to show product images and warehouse metadata more richly.
