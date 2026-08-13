-- Add slug as nullable first so existing rows can be backfilled before the
-- NOT NULL + UNIQUE constraints are applied.
ALTER TABLE "Property" ADD COLUMN "slug" TEXT;

-- Backfill existing rows: readable-text slug + a short id fragment to
-- guarantee uniqueness without replicating the app's collision-retry logic
-- in SQL. Only affects pre-existing rows — new rows going forward get a
-- clean slug (no id fragment) via the application's own generation logic,
-- which only appends a numeric suffix on an actual collision.
UPDATE "Property"
SET "slug" = lower(
  regexp_replace(
    regexp_replace(trim(title || ' ' || locality || ' ' || city), '[^a-zA-Z0-9\s-]', '', 'g'),
    '\s+', '-', 'g'
  )
) || '-' || substr(id, 1, 8)
WHERE "slug" IS NULL;

ALTER TABLE "Property" ALTER COLUMN "slug" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Property_slug_key" ON "Property"("slug");
