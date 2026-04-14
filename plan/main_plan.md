# Book My Ticket - Project Plan

## 1. Project Goal
Build a full-stack movie ticket booking platform for a hackathon:
- Backend: Node.js + Express + PostgreSQL
- Frontend: Nextjs
- Roles: `admin`, `user`
- Payments: Razorpay (test mode first)

## 2. Core Roles and Capabilities

### Admin
- Admin authentication (secure login)
- Create/manage movies
- Upload movie poster + metadata
- Create/manage theaters and screen layout (seat size/map)
- Create show schedules (movie + theater + time slot)
- Publish upcoming movies and active shows

### User
- User signup/login
- Browse upcoming movies
- View movie details, theaters, and available time slots
- Select show, choose seats, and book ticket
- Pay via Razorpay
- View booking history and ticket details

## 3. Suggested Tech Stack
- Backend: Node.js, Express, PostgreSQL, `pg`
- Auth: JWT (access + refresh) or session-based (JWT preferred for hackathon speed)
- Validation: Zod or Joi
- Password hashing: bcrypt
- File upload: Multer (local storage initially), optional cloud (Cloudinary/S3)
- Payments: Razorpay Orders + Payment Verification (signature check)
- Frontend: Nextjs + Tailwind CSS
- State/API: Nextjs Query + Axios (or fetch)

## 4. High-Level Architecture
- `client/` -> Nextjs app
- `server/` -> Express API
- API prefix: `/api/v1`
- Layering:
  - Routes
  - Controllers
  - Services
  - Repositories (DB queries)
  - Middleware (auth, role checks, validation, error handling)

## 5. Database Design (Initial)

### users
- id (PK)
- name
- email (unique)
- password_hash
- role (`admin` | `user`)
- created_at, updated_at

### movies
- id (PK)
- title
- description
- duration_minutes
- language
- genre
- release_date
- poster_url
- is_active
- created_at, updated_at

### theaters
- id (PK)
- name
- city
- address
- total_rows
- total_cols
- created_at, updated_at

### screens (optional but recommended)
- id (PK)
- theater_id (FK)
- name
- total_rows
- total_cols

### seats
- id (PK)
- screen_id (FK)
- seat_label (A1, A2...)
- seat_type (regular, premium, recliner)

### shows
- id (PK)
- movie_id (FK)
- theater_id/screen_id (FK)
- start_time
- end_time
- price
- status (scheduled, canceled, completed)

### show_seats (inventory lock per show)
- id (PK)
- show_id (FK)
- seat_id (FK)
- status (available, locked, booked)
- locked_until

### bookings
- id (PK)
- user_id (FK)
- show_id (FK)
- booking_status (pending, paid, failed, canceled)
- total_amount
- razorpay_order_id
- razorpay_payment_id
- created_at

### booking_seats
- id (PK)
- booking_id (FK)
- show_seat_id (FK)
- price

## 6. Backend API Plan (v1)

### Auth
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /auth/me`

### Admin - Movies
- `POST /admin/movies`
- `PUT /admin/movies/:id`
- `DELETE /admin/movies/:id`
- `POST /admin/movies/:id/poster`

### Admin - Theaters and Shows
- `POST /admin/theaters`
- `PUT /admin/theaters/:id`
- `POST /admin/theaters/:id/screens`
- `POST /admin/shows`
- `PUT /admin/shows/:id`
- `DELETE /admin/shows/:id`

### Public/User
- `GET /movies?city=&date=`
- `GET /movies/:id`
- `GET /shows/:id/seats`
- `POST /bookings/lock-seats`
- `POST /payments/create-order`
- `POST /payments/verify`
- `GET /bookings/me`
- `GET /bookings/:id`

## 7. Booking and Razorpay Flow
1. User selects show + seats
2. Backend checks availability in transaction and sets seats `locked` for short TTL (for example 5 minutes)
3. Backend creates Razorpay order
4. Frontend opens Razorpay checkout
5. On success, frontend sends payment data to backend
6. Backend verifies Razorpay signature
7. On valid signature, booking -> `paid`, seats -> `booked`
8. On failure/timeout, booking -> `failed`, locks released

## 8. Frontend Plan (Nextjs)

### Public Pages
- Home (now showing + upcoming)
- Movie details
- Theater/time slot selection
- Seat selection
- Checkout/payment
- Booking success/failure

### User Pages
- Login/Register
- My bookings
- Ticket details

### Admin Pages
- Admin login
- Dashboard
- Manage movies
- Manage theaters/screens
- Manage shows

## 9. Security and Quality Checklist
- Use `.env` for secrets (DB, JWT, Razorpay keys)
- Hash passwords with bcrypt
- Role-based middleware (`adminOnly`)
- Input validation on all write routes
- SQL parameterization everywhere
- Transaction-based booking logic
- Central error handler + proper status codes
- Basic rate limit on auth/payment endpoints

## 10. Milestone Plan (Hackathon Friendly)

### Milestone 1 - Foundation
- Setup monorepo structure: `client/` and `server/`
- Configure PostgreSQL + migrations
- Base Express app + health endpoint
- Auth (register/login/me) with role support

### Milestone 2 - Admin Features
- Movie CRUD + poster upload
- Theater/screen setup
- Show creation with time slots and pricing

### Milestone 3 - User Booking
- Movie/show discovery APIs
- Seat map + live availability
- Seat locking + booking creation

### Milestone 4 - Payments
- Razorpay order creation
- Payment verification endpoint
- Booking confirmation + failure handling

### Milestone 5 - Frontend UI
- Nextjs app screens for user and admin
- Responsive and visually polished design
- Integrate all APIs and payment flow

### Milestone 6 - Final Hardening
- Error states and loading UX
- Basic tests for critical flows
- Demo data seeding
- Deployment (frontend + backend + DB)

## 11. Immediate Next Step
Start with Milestone 1:
1. Restructure current starter into `server/` and `client/`
2. Build DB schema + migration SQL
3. Implement auth module with admin/user roles
4. Expose first stable API set for frontend integration
