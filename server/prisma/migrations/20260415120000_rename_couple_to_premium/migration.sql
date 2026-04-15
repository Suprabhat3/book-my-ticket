-- Rename seat type enum value from COUPLE to PREMIUM.
ALTER TYPE "SeatType" RENAME VALUE 'COUPLE' TO 'PREMIUM';

-- Migrate legacy layout profile key from coupleRows to premiumRows.
UPDATE "Screen"
SET "layoutProfile" = CASE
  WHEN "layoutProfile" IS NULL THEN NULL
  WHEN "layoutProfile"::jsonb ? 'coupleRows' THEN
    jsonb_set(
      "layoutProfile"::jsonb - 'coupleRows',
      '{premiumRows}',
      COALESCE("layoutProfile"::jsonb -> 'premiumRows', "layoutProfile"::jsonb -> 'coupleRows'),
      true
    )
  ELSE "layoutProfile"::jsonb
END
WHERE "layoutProfile" IS NOT NULL;

-- Migrate legacy pricing profile key from couplePrice to premiumPrice.
UPDATE "Show"
SET "pricingProfile" = CASE
  WHEN "pricingProfile" IS NULL THEN NULL
  WHEN "pricingProfile"::jsonb ? 'couplePrice' THEN
    jsonb_set(
      "pricingProfile"::jsonb - 'couplePrice',
      '{premiumPrice}',
      COALESCE("pricingProfile"::jsonb -> 'premiumPrice', "pricingProfile"::jsonb -> 'couplePrice'),
      true
    )
  ELSE "pricingProfile"::jsonb
END
WHERE "pricingProfile" IS NOT NULL;
