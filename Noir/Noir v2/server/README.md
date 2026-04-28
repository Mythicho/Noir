# NOIR Backend

A drop-in Node.js + Express + SQLite backend for the NOIR luxury imported snacks
storefront. Mirrors the API used by `src/backend/db.ts` so you can switch from
the in-browser simulated backend to a real server with minimal frontend changes.

## Quick start

```bash
cd server
npm install
npm start
```

The API will run on `http://localhost:4000`. Data is stored in `noir.db`
(SQLite) created automatically next to `index.js`.

## Endpoints

- `POST   /api/customers`               upsert a customer profile
- `GET    /api/customers`               list customers (admin)
- `GET    /api/customers/:email`        get a customer
- `DELETE /api/customers/:id`           remove a customer
- `POST   /api/orders`                  create an order
- `GET    /api/orders`                  list orders (admin)
- `GET    /api/orders/:id`              get a single order
- `PATCH  /api/orders/:id/status`       update order status
- `DELETE /api/orders/:id`              delete an order
- `GET    /api/products`                list products (with overrides)
- `PATCH  /api/products/:id`            override a product
- `GET    /api/analytics/summary`       dashboard summary
- `GET    /api/analytics/top-products`  top revenue products
- `GET    /api/analytics/revenue?days=14` revenue by day
- `POST   /api/admin/login`             admin login (returns token)

## Switching the storefront from local DB to real API

Open `src/backend/db.ts` and replace the local `read/write` helpers with
`fetch()` calls to your hosted server (e.g. `process.env.VITE_API_URL`).
The function signatures already match the REST endpoints above.

## Default admin password

`noir-admin` (change in `server/index.js` -> `ADMIN_PASSWORD`).
