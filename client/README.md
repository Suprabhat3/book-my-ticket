# Book My Ticket - Client

Frontend for the Book My Ticket hackathon assignment.
This app consumes the backend APIs for auth, public movie browsing, seat selection, booking, and payment completion.

## Tech Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS v4

## Prerequisites

- Node.js 20+
- pnpm (recommended)
- Running backend server (default: `http://localhost:8080`)

## Environment Setup

Create `client/.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api/v1
```

## Install

```bash
cd client
pnpm install
```

## Run

```bash
pnpm dev
```

App runs at `http://localhost:3000`.

## Available Scripts

- `pnpm dev` - start dev server
- `pnpm build` - create production build
- `pnpm start` - run production build
- `pnpm lint` - run ESLint

## App Capabilities

- User registration and login
- Auth-aware navigation and guarded admin views
- Public movie/show discovery
- Seat map view with seat lock flow
- Booking creation for logged-in users
- Payment completion flow integration
- Booking history and booking details pages

## API Integration

The client talks to backend endpoints under:

- `/api/v1/auth`
- `/api/v1/movies`
- `/api/v1/shows`
- `/api/v1/bookings`
- `/api/v1/payments`

If backend URL/port changes, update `NEXT_PUBLIC_API_BASE_URL`.

## Notes

- For full-system setup, refer to the root repository README.
- This frontend is optional per assignment rules, but included for end-to-end demonstration.
