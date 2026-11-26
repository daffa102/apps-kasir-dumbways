# Kopora · Café Point of Sale

Kopora is a café POS project in development. Its Express API handles the menu, orders, and payments. The current React client brings the live order queue to the barista.

## Current implementation

- **Barista workspace** — sign in, view paid tickets, move orders from pending to in progress, ready, and completed, then archive completed tickets. The board refreshes when the server emits a Socket.IO update.
- **Cashier API** — create orders from available menu items. Cash orders record the amount tendered and change. QRIS orders start a Midtrans Snap sandbox transaction and rely on a signed payment notification before entering the paid queue.
- **Admin API** — manage menu categories and items, including menu image uploads. Authenticated users can read the catalog.
- **Frontend scope** — cashier and owner experiences are design previews. The runnable app opens the barista workspace for barista accounts and a signed-in summary for other roles. See the [UI mockup](client/public/mockup-preview.html) for planned screens.

## Stack

- [Client](client/package.json) · React, TypeScript, Vite, Tailwind CSS, Axios, Zod, Socket.IO Client
- [Server](server/package.json) · Express, TypeScript, Prisma, PostgreSQL, JWT, Zod, Socket.IO, Midtrans Snap
- [Database model](server/prisma/schema.prisma) · user roles, categories, menus, orders, items, payments, and ticket archiving

## Run locally

Use Node.js 24, npm, a disposable PostgreSQL database, and Midtrans **sandbox** keys. The server requires the sandbox keys at startup, including for cash-only local development.

Create an untracked `server/.env` using these settings.

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Connection URL for the local PostgreSQL database |
| `JWT_SECRET` | Unique local signing secret of at least 32 bytes |
| `MIDTRANS_SERVER_KEY` | Midtrans sandbox server key |
| `MIDTRANS_CLIENT_KEY` | Midtrans sandbox client key |
| `PORT` | Optional API port, defaults to `5001` |

From the repository root, start the API in one terminal.

```sh
cd server
npm ci
npx prisma generate
npx prisma migrate deploy
npm run dev
```

Run the migrations against the disposable local database. To try the barista flow, create a local barista and sample menu data. The repository has a [development seed](server/prisma/seed.ts) that can populate a disposable database with `npx prisma db seed`. Its accounts share a fixed password. Keep seeded accounts local and isolated.

From the repository root, start the client in a second terminal.

```sh
cd client
npm ci
npm run dev
```

Open [localhost:5173](http://localhost:5173/). The frontend defaults to `http://localhost:5001/api`. If you change the API address, set `VITE_API_URL` in `client/.env.local`. Keep the Vite origin at `http://localhost:5173` for the server’s Socket.IO CORS configuration.

## Verify locally

- Open [localhost:5001](http://localhost:5001/) to confirm the API responds.
- Sign in with a local barista account and open the order board. Create a paid test order through the cashier API using a local cashier account to check ticket progression.
- Run `npm run lint` and `npm run build` from `client/` to check the frontend. The server currently has a placeholder test script.

## API overview

| Area | Routes |
| --- | --- |
| Session | `POST /api/auth/login`, `GET /api/auth/me` |
| Catalog | `/api/categories`, `/api/menus` |
| Cashier | `POST /api/orders` |
| Barista | `GET /api/orders/kds`, `PATCH /api/orders/:id/status`, `PATCH /api/orders/:id/archive`, `PATCH /api/orders/kds/archive-completed` |
| Payments | `POST /api/webhooks/midtrans` |
