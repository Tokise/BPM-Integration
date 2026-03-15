-- Migration to support consolidated Purchase Orders and Shipments

-- 1. Add shop_id to procurement to group items by seller
ALTER TABLE "bpm-anec-global".procurement ADD COLUMN shop_id uuid REFERENCES "bpm-anec-global".shops(id);

-- 2. Add items JSONB column to procurement to store consolidated product data
ALTER TABLE "bpm-anec-global".procurement ADD COLUMN items jsonb;

-- 3. Add items JSONB column to shipments to support consolidated pickups
ALTER TABLE "bpm-anec-global".shipments ADD COLUMN items jsonb;

-- 4. (Optional) Add status index for faster lookups
CREATE INDEX IF NOT EXISTS procurement_status_idx ON "bpm-anec-global".procurement(status);
