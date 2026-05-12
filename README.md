# Aurora Atelier

Aurora Atelier is a Docker-first jewelry storefront with a React client, a custom jewelry constructor, customer account flows, order tracking, and admin tools for catalog and constructor management.

## Main launch path

```powershell
docker compose up --build
```

App URL:

```text
http://localhost:3000
```

Admin login:

```text
http://localhost:3000/admin/login
```

## Runtime model

- Main runtime: Node.js + Express + React build served from `public/react-app`
- Data runtime: `sqlite3`
- Container DB path: `/app/data/aurora.sqlite3`
- Persistence: Docker volume `aurora-sqlite-data`
- Uploaded/admin-managed assets: Docker volume `aurora-uploads`

The folder `core-design/` is kept as a **design reference only**. It is not part of runtime logic or the production source of truth.

## Seed demo data

The main app container does **not** seed automatically on each start.

Run seed explicitly when you want sample data:

```powershell
docker compose --profile tools run --rm seed
```

## Reset local Docker data

```powershell
docker compose down -v
docker compose up --build
```

Then seed again if needed:

```powershell
docker compose --profile tools run --rm seed
```

## Useful commands

Start:

```powershell
docker compose up --build
```

Stop:

```powershell
docker compose down
```

Run tests locally:

```powershell
npm test
```

Rebuild client locally:

```powershell
npm run build:client
```

## Environment

Copy `.env.example` to `.env` and configure the values you need.

Important variables:

- `APP_URL`
- `TRUST_PROXY`
- `GOOGLE_CLIENT_ID`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`

## Soft launch flow

The current public flow is a **soft launch**:

- client builds a cart,
- checkout creates a reservation,
- the atelier confirms details and prepayment afterwards,
- order statuses and email updates stay visible in account and order dossier.

## Main routes

- `/`
- `/catalog`
- `/constructor`
- `/cart`
- `/checkout`
- `/orders`
- `/account`
- `/admin/login`
- `/admin/orders`
- `/admin/products`
- `/admin/constructor`
