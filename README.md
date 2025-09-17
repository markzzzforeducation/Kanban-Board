# Kanban Board (Vue + Pinia) with Backend (Express + Prisma)

Monorepo project containing:

- Frontend: Vue 3 + TypeScript + Vite + Pinia
- Backend: Node.js + Express + Prisma (SQLite in dev; switchable to Postgres/MySQL)

## Prerequisites

- Node.js 18+
- npm 9+

## Frontend (root)

```bash
npm install
npm run dev
```

## Backend (`backend/`)

```bash
cd backend
npm install
# Windows: copy .env.example .env
# macOS/Linux: cp .env.example .env
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

API base: `http://localhost:5174`

Auth

- POST `/api/auth/register` { name, email, password }
- POST `/api/auth/login` { email, password } → returns `{ token, user }`

Boards (requires `Authorization: Bearer <token>`)

- GET `/api/boards`
- POST `/api/boards` { name }
- PUT `/api/boards/:id` { name }
- DELETE `/api/boards/:id`

## Run both concurrently (optional)

At the repo root, you can add a script to run both frontend and backend together.

```json
{
  "scripts": {
    "dev:all": "concurrently -n web,api -c green,cyan \"npm:dev\" \"npm --prefix backend run dev\""
  }
}
```

Then:

```bash
npm install -D concurrently
npm run dev:all
```

## Switching DB to Postgres/MySQL

Edit `backend/.env`:

- Postgres: `DATABASE_PROVIDER=postgresql`, `DATABASE_URL=postgresql://user:pass@host:5432/db?schema=public`
- MySQL: `DATABASE_PROVIDER=mysql`, `DATABASE_URL=mysql://user:pass@host:3306/db`

Run migrations again:

```bash
cd backend
npx prisma migrate dev --name switch-sql
```
