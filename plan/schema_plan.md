# Schema Plan - Cities, Theaters, Screens

## 1. Goal
Design a schema that is easy to manage when:
- Admin adds supported cities
- Admin creates theaters in a city
- Admin creates screens (audi) inside theaters
- Each screen is one type: `ELITE`, `PREMIUM`, `NORMAL`
- Seat layout and pricing can be customized but still manageable

## 2. Core Design Decision
Use two-level modeling for screens:
1. **Screen Type** (`ELITE`, `PREMIUM`, `NORMAL`) for business/category logic
2. **Screen Profile** (JSON config) for layout/features so admin can customize without schema change

This keeps the database structured but flexible.

## 3. Tables (Recommended)

### cities
- `id` (PK)
- `name` (unique, e.g. "Mumbai")
- `state`
- `country` (default `India`)
- `is_active` (bool)
- `created_at`, `updated_at`

### theaters
- `id` (PK)
- `city_id` (FK -> cities.id)
- `name`
- `slug` (unique per city if needed)
- `address_line`
- `pincode`
- `latitude`, `longitude` (optional)
- `is_active` (bool)
- `created_at`, `updated_at`

### screens
- `id` (PK)
- `theater_id` (FK -> theaters.id)
- `name` (e.g. "Audi 1")
- `screen_type` (enum: `ELITE`, `PREMIUM`, `NORMAL`)
- `total_rows`
- `total_cols`
- `seat_capacity`
- `layout_profile` (jsonb)
- `is_active` (bool)
- `created_at`, `updated_at`

### screen_seats
- `id` (PK)
- `screen_id` (FK -> screens.id)
- `row_label` (A, B, C...)
- `seat_number` (1, 2, 3...)
- `seat_label` (A1, A2...)
- `zone` (e.g. `PLATINUM`, `GOLD`, `SILVER`)
- `seat_type` (e.g. `REGULAR`, `RECLINER`, `COUPLE`)
- `is_active`
- unique (`screen_id`, `seat_label`)

### shows
- `id` (PK)
- `movie_id` (FK)
- `theater_id` (FK)
- `screen_id` (FK)
- `start_time`
- `end_time`
- `base_price`
- `status` (`SCHEDULED`, `CANCELLED`, `COMPLETED`)
- `created_at`, `updated_at`

### show_seats
- `id` (PK)
- `show_id` (FK -> shows.id)
- `screen_seat_id` (FK -> screen_seats.id)
- `price` (final seat price for this show)
- `status` (`AVAILABLE`, `LOCKED`, `BOOKED`)
- `locked_until` (nullable)
- unique (`show_id`, `screen_seat_id`)

## 4. Why This Is Easy to Manage
- `screen_type` gives simple filtering and reporting.
- `layout_profile` stores complex screen setup without adding many new columns.
- `screen_seats` keeps seat map normalized and query-friendly.
- `show_seats` allows dynamic pricing + lock/book flow per show.

## 5. Suggested `layout_profile` JSON
Keep structured JSON for UI rendering and admin editing.

Example:
```json
{
  "has_dolby": true,
  "has_3d": true,
  "has_imax": true,
  "zones": [
    { "name": "PLATINUM", "rows": ["A", "B"], "multiplier": 2.0 },
    { "name": "GOLD", "rows": ["C", "D", "E"], "multiplier": 1.5 },
    { "name": "SILVER", "rows": ["F", "G", "H"], "multiplier": 1.0 }
  ],
  "aisles_after_cols": [4, 8],
  "blocked_seats": ["A1", "A2"]
}
```

## 6. Screen Type Defaults (Admin Override Allowed)

### ELITE (IMAX)
- Larger capacity
- More premium zones
- Higher default multiplier
- `has_imax = true`

### PREMIUM (Big screen)
- Medium-large capacity
- Standard premium + regular split
- `has_imax = false`

### NORMAL (Small screen)
- Smaller capacity
- Mostly regular seating
- Budget-friendly multipliers

Admin can start from type defaults, then customize layout before save.

## 7. Admin Flow (Schema Perspective)
1. Add city (`cities`)
2. Add theater in that city (`theaters`)
3. Add screen with type (`screens`)
4. Auto-generate seat grid into `screen_seats`
5. Optional manual seat edits (block/rename/zone changes)
6. Create show for movie + screen (`shows`)
7. Auto-create `show_seats` from `screen_seats`

## 8. Constraints and Indexes
- `cities.name` unique
- index on `theaters.city_id`
- index on `screens.theater_id`
- unique `screen_seats (screen_id, seat_label)`
- index on `shows (movie_id, start_time)`
- index on `shows (theater_id, start_time)`
- unique `show_seats (show_id, screen_seat_id)`
- index on `show_seats (show_id, status)`

## 9. Future-Proofing
- Add `amenities` table later if needed (food, parking, wheelchair).
- Add `screen_format` table later if more types arrive (4DX, MX4D).
- Keep enum values stable for hackathon; migrate to lookup table later if required.

## 10. Implementation Note
For hackathon speed:
- Keep `screen_type` as PostgreSQL enum
- Keep `layout_profile` as `jsonb`
- Generate seats using backend service when screen is created

This gives quick delivery now and flexibility later.
