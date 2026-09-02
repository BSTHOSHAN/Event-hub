# Event Hub

Full-stack web app scaffold: React + Vite (TypeScript) frontend, Express (TypeScript) backend, PostgreSQL via Prisma.

## Structure

```
frontend/   React + Vite + TS app
backend/    Express + TS API, Prisma schema/client
```

## Prerequisites

- Node.js 20+
- A PostgreSQL database (local install, Docker, or a hosted instance)

## Setup

1. Install dependencies (from repo root, installs both workspaces):

   ```
   npm install
   ```

2. Configure the backend environment:

   ```
   cd backend
   cp .env.example .env
   ```

   Edit `.env` and set `DATABASE_URL` to point at your Postgres instance.

3. Create the database schema:

   ```
   npm run prisma:migrate -w backend
   ```

## Development

Run frontend and backend in separate terminals:

```
npm run dev:backend    # http://localhost:3001
npm run dev:frontend   # http://localhost:5173
```

The Vite dev server proxies `/api/*` requests to the backend, so the frontend can call `fetch('/api/events')` directly without CORS issues.

## Build

```
npm run build:frontend
npm run build:backend
```
