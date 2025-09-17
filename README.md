# Kanban Board (Frontend Only)

This repository now contains only the Frontend (Vue 3 + TypeScript + Vite + Pinia).
The Backend has been moved to a separate repository:

- https://github.com/markzzzforeducation/Kanban-Board-Backend

## Prerequisites

- Node.js 18+
- npm 9+

## Frontend (root)

```bash
npm install
npm run dev
```

## Backend API

Base URL (default): `http://localhost:5174`

Auth

- POST `/api/auth/register` { name, email, password }
- POST `/api/auth/login` { email, password } → returns `{ token, user }`

Boards (requires `Authorization: Bearer <token>`)

- GET `/api/boards`
- POST `/api/boards` { name }
- PUT `/api/boards/:id` { name }
- DELETE `/api/boards/:id`

## Run both concurrently (optional)

You can run the backend separately from the backend repository.

## Switching DB to Postgres/MySQL

In the backend repository, edit `.env`:

- Postgres: `DATABASE_PROVIDER=postgresql`, `DATABASE_URL=postgresql://user:pass@host:5432/db?schema=public`
- MySQL: `DATABASE_PROVIDER=mysql`, `DATABASE_URL=mysql://user:pass@host:3306/db`

Run migrations again:

```bash
cd backend
npx prisma migrate dev --name switch-sql
```
