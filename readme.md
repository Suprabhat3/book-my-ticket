# Book My Ticket - Hackathon Follow-up Assignment

This project is an extended implementation of the **Chai Aur SQL** starter code challenge.
The goal is to work like a real developer: start from an existing codebase and add production-style authentication and protected booking flows without breaking existing endpoints.

Starter repository reference: https://github.com/chaicodehq/book-my-ticket

## Project Objective
Build a simplified movie ticket booking platform where:

- Users can register and login
- Authentication protects booking and user-specific operations
- Only logged-in users can book seats
- Duplicate seat booking is prevented (including concurrency-safe checks)
- Bookings are associated with the authenticated user
- Movie/show data can stay mocked or admin-managed
- Payments is also implemented with razorpay

## Monorepo Structure

- `client/` - Next.js frontend (optional in hackathon, included here)
- `server/` - Express + Prisma backend (core evaluation area)

## Current Backend Architecture

The server is modular and feature-based:

- `server/src/app.js` - Express app, middleware, route mounting
- `server/src/server.js` - server startup + graceful shutdown
- `server/index.mjs` - compatibility/main entrypoint (delegates to `src/server.js`)
- `server/src/modules/*` - domain modules (auth, bookings, shows, payments, etc.)
- `server/prisma/` - schema + migrations

## Implemented Features

### Authentication

- Register user: `POST /api/v1/auth/register`
- Login: `POST /api/v1/auth/login`
- Refresh token: `POST /api/v1/auth/refresh`
- Logout: `POST /api/v1/auth/logout`
- Current user: `GET /api/v1/auth/me`
- Admin-only guard available through role middleware

### Protected Booking Flow

- Booking routes are protected with `requireAuth`
- Seat availability is validated before booking creation
- Race conditions are handled by transactional seat-lock/update flow
- Booking records include authenticated `userId`

### Additional Modules

- Health, Users, Cities, Theaters, Screens, Movies, Shows, Bookings, Payments
- Public and admin endpoints separated where required

## Tech Stack

### Server

- Node.js (ESM)
- Express
- Prisma ORM
- PostgreSQL
- JWT auth (access token + refresh token)
- Zod validation

### Client

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS v4

## Environment Variables

### Server (`server/.env`)

Create from `server/.env.example` and update values:

```env
NODE_ENV=development
PORT=8080
CLIENT_ORIGIN=http://localhost:3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/book_my_ticket

JWT_ACCESS_SECRET=replace-with-strong-access-secret
JWT_REFRESH_SECRET=replace-with-strong-refresh-secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

ADMIN_REGISTRATION_KEY=replace-with-admin-key

IMAGEKIT_PUBLIC_KEY=replace-with-imagekit-public-key
IMAGEKIT_PRIVATE_KEY=replace-with-imagekit-private-key
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_imagekit_id

RAZORPAY_KEY_ID=replace-with-razorpay-key-id
RAZORPAY_KEY_SECRET=replace-with-razorpay-key-secret
```

Notes:

- `DATABASE_URL`, `JWT_ACCESS_SECRET`, and `JWT_REFRESH_SECRET` are required.
- Set `CLIENT_ORIGIN` to your client URL (usually `http://localhost:3000` for Next.js).

### Client (`client/.env.local`)

Create:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api/v1
```

## Local Setup

### 1. Clone

```bash
git clone <your-repo-url>
cd book-my-ticket
```

### 2. Install Dependencies

```bash
cd server && pnpm install
cd ../client && pnpm install
```

You can use `npm` as well, but keep one package manager consistently per folder.

### 3. Database Setup

```bash
cd server
pnpm prisma:migrate
pnpm prisma:generate
```

### 4. Run Backend

```bash
cd server
pnpm dev
```

Backend starts on `http://localhost:8080`.

### 5. Run Frontend

```bash
cd client
pnpm dev
```

Frontend starts on `http://localhost:3000`.

## Key API Groups

Base URL: `http://localhost:8080/api/v1`

- `/health` - service health
- `/auth` - register/login/refresh/logout/me
- `/movies/public`, `/shows/public`, `/theaters/public`, `/cities/public` - public browsing
- `/shows/:id/seat-locks` - authenticated seat locking/unlocking
- `/bookings` - authenticated booking operations
- `/payments` - authenticated payment + booking payment completion

## Auth + Booking Flow (Recommended)

1. Register with `/auth/register`
2. Login via `/auth/login` and store returned `accessToken`
3. Use `Authorization: Bearer <accessToken>` for protected requests
4. Fetch public shows and seat map
5. Lock seats with `/shows/:id/seat-locks`
6. Create booking via `/bookings`
7. Complete payment (`/payments/...`) and finalize booking

## Hackathon Requirement Mapping

- Starter code used as base: Yes
- Existing endpoints preserved and extended: Yes
- Register/login added: Yes
- Protected booking endpoints: Yes
- Only logged-in users can book: Yes
- Duplicate booking prevention: Yes (transactional/locking checks)
- Booking mapped to logged-in user: Yes
- Mock/admin-managed data supported: Yes
- Frontend optional: Included

## Scripts

### Server

- `pnpm dev` - run backend in watch mode (`index.mjs` entrypoint)
- `pnpm start` - run backend in production mode
- `pnpm prisma:migrate` - apply migrations
- `pnpm prisma:generate` - regenerate Prisma client
- `pnpm prisma:studio` - open Prisma Studio

### Client

- `pnpm dev` - run Next.js dev server
- `pnpm build` - production build
- `pnpm start` - run production build
- `pnpm lint` - run lint checks

## Submission Checklist

- Public GitHub repository with working code
- `README` with setup + flow explanation
- `.env.example` committed (secrets excluded)
- Endpoints demonstrably working (Postman/curl/screenshots optional but recommended)

## Future Improvements

- Add automated tests (unit + integration)
- Add API docs (OpenAPI/Swagger)
- Add rate limiting and brute-force protection on auth routes
- Improve observability and structured logging

