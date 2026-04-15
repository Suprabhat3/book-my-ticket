# Book My Ticket - Server

Backend for the Book My Ticket hackathon follow-up assignment based on Chai Aur SQL starter code.
This service provides authentication, protected booking flow, seat locking, and payment-related APIs.

## Tech Stack

- Node.js (ESM)
- Express
- Prisma ORM
- PostgreSQL
- JWT (access + refresh token)
- Zod validation

## Entry Point

- Main/compatibility entry: `server/index.mjs`
- Runtime server bootstrap: `server/src/server.js`
- Express app setup: `server/src/app.js`

`index.mjs` is intentionally kept as the startup entry and delegates to the modular server implementation.

## Module Structure

`server/src/modules/`

- `auth` - register/login/refresh/logout/me
- `bookings` - authenticated booking APIs
- `cities`, `theaters`, `screens`, `movies`, `shows` - domain CRUD/public listings
- `payments` - booking payment lifecycle
- `health` - health endpoint
- `users` - user-related placeholder/admin support

## Environment Setup

Create `server/.env` from `server/.env.example`:

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

Required for boot:

- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`

## Install

```bash
cd server
pnpm install
```

## Database Setup

```bash
pnpm prisma:migrate
pnpm prisma:generate
```

Optional:

```bash
pnpm prisma:studio
```

## Run

Development:

```bash
pnpm dev
```

Production:

```bash
pnpm start
```

Server runs at `http://localhost:8080` by default.

## Scripts

- `pnpm dev` - run nodemon with `index.mjs`
- `pnpm start` - run Node with `index.mjs`
- `pnpm prisma:migrate` - apply migrations
- `pnpm prisma:generate` - generate Prisma client
- `pnpm prisma:studio` - open Prisma Studio

## API Base

`/api/v1`

Major route groups:

- `/health`
- `/auth`
- `/cities`
- `/theaters`
- `/screens`
- `/movies`
- `/shows`
- `/bookings`
- `/payments`

## Assignment Requirement Coverage

- Starter code extended (not rebuilt from scratch)
- Register + login implemented
- Protected booking endpoints (`requireAuth`)
- Only authenticated users can create bookings
- Duplicate/overlapping seat booking prevented via transactional locking checks
- Bookings linked to authenticated users

## Notes

- Keep existing endpoints stable while extending features.
- Use root README for full monorepo setup (client + server together).
