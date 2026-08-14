-- ============================================================================
-- Connectz CCTV Platform — PostgreSQL / Supabase Schema Migration
-- ============================================================================
--
-- This file is the SQL equivalent of prisma/schema.prisma.
-- Run it in: Supabase SQL Editor  →  New Query  →  paste entire file  →  Run
--            OR psql: psql "$DATABASE_URL" -f supabase/schema.sql
--
-- Notes:
--   • Uses UUID primary keys via gen_random_uuid() (requires pgcrypto extension)
--   • All tables include created_at / updated_at timestamps
--   • Foreign keys with appropriate CASCADE / SET NULL behaviors
--   • Indexes on hot lookup columns (brandId, categoryId, productId, etc.)
--   • Row Level Security (RLS) policies included per role
--   • Storage buckets are NOT created here — create them separately:
--       product-images, product-documents, product-videos, brand-assets,
--       category-assets
--
-- Idempotent: re-running drops existing tables first (CASCADE).
-- ============================================================================

-- Required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Updated-at trigger function (reused for every table)
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- DROP EXISTING TABLES (clean slate — comment out if upgrading in place)
-- ============================================================================
DROP TABLE IF EXISTS "QuoteRequest" CASCADE;
DROP TABLE IF EXISTS "Customer" CASCADE;
DROP TABLE IF EXISTS "AppSetting" CASCADE;
DROP TABLE IF EXISTS "AccessoryRecommendationRule" CASCADE;
DROP TABLE IF EXISTS "CableCalculationRule" CASCADE;
DROP TABLE IF EXISTS "PowerCalculationRule" CASCADE;
DROP TABLE IF EXISTS "StorageCalculationRule" CASCADE;
DROP TABLE IF EXISTS "CompatibilityRule" CASCADE;
DROP TABLE IF EXISTS "ProductSupplier" CASCADE;
DROP TABLE IF EXISTS "Supplier" CASCADE;
DROP TABLE IF EXISTS "StockTransfer" CASCADE;
DROP TABLE IF EXISTS "InventoryTransaction" CASCADE;
DROP TABLE IF EXISTS "Inventory" CASCADE;
DROP TABLE IF EXISTS "WarehouseLocation" CASCADE;
DROP TABLE IF EXISTS "Warehouse" CASCADE;
DROP TABLE IF EXISTS "LearningContent" CASCADE;
DROP TABLE IF EXISTS "Pricing" CASCADE;
DROP TABLE IF EXISTS "ProductVariant" CASCADE;
DROP TABLE IF EXISTS "Product" CASCADE;
DROP TABLE IF EXISTS "Category" CASCADE;
DROP TABLE IF EXISTS "Brand" CASCADE;
DROP TABLE IF EXISTS "Profile" CASCADE;
DROP TABLE IF EXISTS "Role" CASCADE;

-- ============================================================================
-- AUTH & USERS
-- ============================================================================

CREATE TABLE "Role" (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  description TEXT,
  permissions TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER role_updated_at BEFORE UPDATE ON "Role"
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TABLE "Profile" (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    TEXT NOT NULL UNIQUE,
  email      TEXT NOT NULL UNIQUE,
  full_name  TEXT,
  phone      TEXT,
  role_id    UUID REFERENCES "Role"(id) ON DELETE SET NULL,
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER profile_updated_at BEFORE UPDATE ON "Profile"
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE INDEX idx_profile_role_id ON "Profile"(role_id);
CREATE INDEX idx_profile_email ON "Profile"(email);

-- ============================================================================
-- CATALOG TAXONOMY
-- ============================================================================

CREATE TABLE "Brand" (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  slug        TEXT NOT NULL UNIQUE,
  description TEXT,
  logo_url    TEXT,
  country     TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER brand_updated_at BEFORE UPDATE ON "Brand"
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE INDEX idx_brand_active ON "Brand"(is_active);

CREATE TABLE "Category" (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  slug        TEXT NOT NULL UNIQUE,
  description TEXT,
  icon_url    TEXT,
  parent_id   UUID REFERENCES "Category"(id) ON DELETE SET NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER category_updated_at BEFORE UPDATE ON "Category"
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE INDEX idx_category_parent_id ON "Category"(parent_id);
CREATE INDEX idx_category_active ON "Category"(is_active);

-- ============================================================================
-- PRODUCTS
-- ============================================================================

CREATE TABLE "Product" (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku               TEXT NOT NULL UNIQUE,
  name              TEXT NOT NULL,
  model_number      TEXT NOT NULL,
  brand_id          UUID NOT NULL REFERENCES "Brand"(id) ON DELETE RESTRICT,
  category_id       UUID NOT NULL REFERENCES "Category"(id) ON DELETE RESTRICT,
  product_type      TEXT NOT NULL,
  variety           TEXT,
  technology        TEXT,
  megapixel        TEXT,
  channels          INTEGER,
  short_description TEXT,
  long_description  TEXT,
  key_specs         JSONB,
  features          JSONB,
  images            JSONB,
  video_url         TEXT,
  document_url      TEXT,
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  is_featured       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER product_updated_at BEFORE UPDATE ON "Product"
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE INDEX idx_product_brand_id ON "Product"(brand_id);
CREATE INDEX idx_product_category_id ON "Product"(category_id);
CREATE INDEX idx_product_active ON "Product"(is_active);
CREATE INDEX idx_product_featured ON "Product"(is_featured);
CREATE INDEX idx_product_type ON "Product"(product_type);
CREATE INDEX idx_product_variety ON "Product"(variety);
CREATE INDEX idx_product_megapixel ON "Product"(megapixel);
CREATE INDEX idx_product_sku ON "Product"(sku);
CREATE INDEX idx_product_name_search ON "Product" USING gin (to_tsvector('simple', name));
CREATE INDEX idx_product_fulltext_search ON "Product" USING gin (
  to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(sku, '') || ' ' || coalesce(model_number, ''))
);

CREATE TABLE "ProductVariant" (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID NOT NULL REFERENCES "Product"(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  sku         TEXT,
  attributes  JSONB,
  price_delta NUMERIC(12, 2) NOT NULL DEFAULT 0,
  stock       INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER product_variant_updated_at BEFORE UPDATE ON "ProductVariant"
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE INDEX idx_product_variant_product_id ON "ProductVariant"(product_id);

CREATE TABLE "Pricing" (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id          UUID NOT NULL UNIQUE REFERENCES "Product"(id) ON DELETE CASCADE,
  mrp                 NUMERIC(12, 2) NOT NULL,
  sale_price          NUMERIC(12, 2) NOT NULL,
  dealer_price        NUMERIC(12, 2),
  purchase_price      NUMERIC(12, 2),
  gst_rate            NUMERIC(5, 2) NOT NULL DEFAULT 18,
  discount_percent    NUMERIC(5, 2) NOT NULL DEFAULT 0,
  min_selling_price   NUMERIC(12, 2),
  effective_from      TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER pricing_updated_at BEFORE UPDATE ON "Pricing"
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TABLE "LearningContent" (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id           UUID NOT NULL UNIQUE REFERENCES "Product"(id) ON DELETE CASCADE,
  title                TEXT NOT NULL,
  simple_explanation   TEXT NOT NULL,
  technical_details    TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER learning_content_updated_at BEFORE UPDATE ON "LearningContent"
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ============================================================================
-- INVENTORY
-- ============================================================================

CREATE TABLE "Warehouse" (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  code       TEXT NOT NULL UNIQUE,
  address    TEXT,
  city       TEXT,
  phone      TEXT,
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER warehouse_updated_at BEFORE UPDATE ON "Warehouse"
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TABLE "WarehouseLocation" (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id UUID NOT NULL REFERENCES "Warehouse"(id) ON DELETE CASCADE,
  rack         TEXT,
  shelf        TEXT,
  bin          TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER warehouse_location_updated_at BEFORE UPDATE ON "WarehouseLocation"
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE INDEX idx_warehouse_location_wh_id ON "WarehouseLocation"(warehouse_id);

CREATE TABLE "Inventory" (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id          UUID NOT NULL UNIQUE REFERENCES "Product"(id) ON DELETE CASCADE,
  warehouse_id        UUID REFERENCES "Warehouse"(id) ON DELETE SET NULL,
  location_id         UUID REFERENCES "WarehouseLocation"(id) ON DELETE SET NULL,
  quantity            INTEGER NOT NULL DEFAULT 0,
  reserved_qty        INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER NOT NULL DEFAULT 5,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER inventory_updated_at BEFORE UPDATE ON "Inventory"
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE INDEX idx_inventory_warehouse_id ON "Inventory"(warehouse_id);

CREATE TABLE "InventoryTransaction" (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id   UUID NOT NULL REFERENCES "Product"(id) ON DELETE CASCADE,
  inventory_id UUID REFERENCES "Inventory"(id) ON DELETE SET NULL,
  type         TEXT NOT NULL,
  quantity     INTEGER NOT NULL,
  reference    TEXT,
  notes        TEXT,
  warehouse_id UUID REFERENCES "Warehouse"(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_inv_txn_product_id ON "InventoryTransaction"(product_id);
CREATE INDEX idx_inv_txn_inventory_id ON "InventoryTransaction"(inventory_id);
CREATE INDEX idx_inv_txn_type ON "InventoryTransaction"(type);
CREATE INDEX idx_inv_txn_created_at ON "InventoryTransaction"(created_at DESC);

CREATE TABLE "StockTransfer" (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id        UUID NOT NULL REFERENCES "Product"(id) ON DELETE CASCADE,
  quantity          INTEGER NOT NULL,
  from_warehouse_id UUID NOT NULL REFERENCES "Warehouse"(id) ON DELETE RESTRICT,
  to_warehouse_id   UUID NOT NULL REFERENCES "Warehouse"(id) ON DELETE RESTRICT,
  status            TEXT NOT NULL DEFAULT 'PENDING',
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER stock_transfer_updated_at BEFORE UPDATE ON "StockTransfer"
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE INDEX idx_stock_transfer_product_id ON "StockTransfer"(product_id);
CREATE INDEX idx_stock_transfer_from_wh ON "StockTransfer"(from_warehouse_id);
CREATE INDEX idx_stock_transfer_to_wh ON "StockTransfer"(to_warehouse_id);

-- ============================================================================
-- SUPPLIERS
-- ============================================================================

CREATE TABLE "Supplier" (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT NOT NULL,
  contact_person TEXT,
  phone          TEXT,
  email          TEXT,
  address        TEXT,
  gst_number     TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER supplier_updated_at BEFORE UPDATE ON "Supplier"
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE INDEX idx_supplier_name ON "Supplier"(name);

CREATE TABLE "ProductSupplier" (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id     UUID NOT NULL REFERENCES "Product"(id) ON DELETE CASCADE,
  supplier_id    UUID NOT NULL REFERENCES "Supplier"(id) ON DELETE CASCADE,
  lead_time_days INTEGER,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_product_supplier_product_id ON "ProductSupplier"(product_id);
CREATE INDEX idx_product_supplier_supplier_id ON "ProductSupplier"(supplier_id);
CREATE UNIQUE INDEX uq_product_supplier ON "ProductSupplier"(product_id, supplier_id);

-- ============================================================================
-- COMPATIBILITY & CALCULATION RULES
-- ============================================================================

CREATE TABLE "CompatibilityRule" (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  rule_type   TEXT NOT NULL,
  source_type TEXT,
  target_type TEXT,
  source_attr JSONB,
  target_attr JSONB,
  severity    TEXT NOT NULL DEFAULT 'ERROR',
  description TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER compatibility_rule_updated_at BEFORE UPDATE ON "CompatibilityRule"
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE INDEX idx_compat_rule_active ON "CompatibilityRule"(is_active);
CREATE INDEX idx_compat_rule_type ON "CompatibilityRule"(rule_type);

CREATE TABLE "StorageCalculationRule" (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT NOT NULL,
  megapixel      TEXT NOT NULL,
  codec          TEXT NOT NULL,
  bitrate_mbps   NUMERIC(8, 2) NOT NULL,
  fps            INTEGER NOT NULL,
  motion_factor  NUMERIC(4, 2) NOT NULL DEFAULT 1.0,
  audio_overhead NUMERIC(4, 2) NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER storage_rule_updated_at BEFORE UPDATE ON "StorageCalculationRule"
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE INDEX idx_storage_rule_lookup ON "StorageCalculationRule"(megapixel, codec);

CREATE TABLE "PowerCalculationRule" (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  TEXT NOT NULL,
  product_type          TEXT NOT NULL,
  wattage               NUMERIC(8, 2) NOT NULL,
  safety_margin_percent NUMERIC(5, 2) NOT NULL DEFAULT 20,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER power_rule_updated_at BEFORE UPDATE ON "PowerCalculationRule"
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE INDEX idx_power_rule_product_type ON "PowerCalculationRule"(product_type);

CREATE TABLE "CableCalculationRule" (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  cable_type       TEXT NOT NULL,
  system_type      TEXT NOT NULL,
  roll_length_m    INTEGER NOT NULL DEFAULT 305,
  wastage_percent  NUMERIC(5, 2) NOT NULL DEFAULT 10,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER cable_rule_updated_at BEFORE UPDATE ON "CableCalculationRule"
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE INDEX idx_cable_rule_lookup ON "CableCalculationRule"(cable_type, system_type);

CREATE TABLE "AccessoryRecommendationRule" (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name               TEXT NOT NULL,
  system_type        TEXT,
  trigger            JSONB,
  accessory_category TEXT,
  qty_per_camera     NUMERIC(8, 2) NOT NULL DEFAULT 0,
  description        TEXT,
  is_active          BOOLEAN NOT NULL DEFAULT TRUE,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER accessory_rule_updated_at BEFORE UPDATE ON "AccessoryRecommendationRule"
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ============================================================================
-- ORDERS & QUOTES
-- ============================================================================

CREATE TABLE "Customer" (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  phone      TEXT NOT NULL,
  email      TEXT,
  location   TEXT,
  notes      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER customer_updated_at BEFORE UPDATE ON "Customer"
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE INDEX idx_customer_phone ON "Customer"(phone);

CREATE TABLE "QuoteRequest" (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id              UUID NOT NULL REFERENCES "Customer"(id) ON DELETE CASCADE,
  setup_config             JSONB NOT NULL,
  subtotal                 NUMERIC(12, 2) NOT NULL,
  discount                 NUMERIC(12, 2) NOT NULL DEFAULT 0,
  gst                      NUMERIC(12, 2) NOT NULL DEFAULT 0,
  grand_total              NUMERIC(12, 2) NOT NULL,
  installation_requirement TEXT,
  status                   TEXT NOT NULL DEFAULT 'PENDING',
  notes                    TEXT,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER quote_request_updated_at BEFORE UPDATE ON "QuoteRequest"
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE INDEX idx_quote_request_customer_id ON "QuoteRequest"(customer_id);
CREATE INDEX idx_quote_request_status ON "QuoteRequest"(status);
CREATE INDEX idx_quote_request_created_at ON "QuoteRequest"(created_at DESC);

-- ============================================================================
-- CONFIG (system-wide settings)
-- ============================================================================

CREATE TABLE "AppSetting" (
  id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key   TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE "Role"                          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Profile"                        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Brand"                         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Category"                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Product"                       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProductVariant"                ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Pricing"                       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LearningContent"               ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Warehouse"                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WarehouseLocation"             ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Inventory"                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "InventoryTransaction"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StockTransfer"                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Supplier"                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProductSupplier"               ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CompatibilityRule"             ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StorageCalculationRule"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PowerCalculationRule"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CableCalculationRule"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AccessoryRecommendationRule"   ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Customer"                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "QuoteRequest"                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AppSetting"                    ENABLE ROW LEVEL SECURITY;

-- Helper function: check if current user is Super Admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM "Profile" p
    JOIN "Role" r ON r.id = p.role_id
    WHERE p.user_id = auth.uid()::text
      AND r.name = 'Super Admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Catalog read policies — public can read active catalog content
CREATE POLICY "Public can read active brands"        ON "Brand"                       FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Public can read active categories"   ON "Category"                    FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Public can read active products"     ON "Product"                     FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Public can read pricing"             ON "Pricing"                     FOR SELECT USING (TRUE);
CREATE POLICY "Public can read learning content"   ON "LearningContent"             FOR SELECT USING (TRUE);
CREATE POLICY "Public can read compatibility rules" ON "CompatibilityRule"           FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Public can read storage rules"      ON "StorageCalculationRule"      FOR SELECT USING (TRUE);
CREATE POLICY "Public can read power rules"        ON "PowerCalculationRule"          FOR SELECT USING (TRUE);
CREATE POLICY "Public can read cable rules"        ON "CableCalculationRule"          FOR SELECT USING (TRUE);
CREATE POLICY "Public can read accessory rules"    ON "AccessoryRecommendationRule"  FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Public can read settings"           ON "AppSetting"                   FOR SELECT USING (TRUE);

-- Authenticated users (admin) can read everything (including inactive rows)
CREATE POLICY "Admins can read all brands"          ON "Brand"             FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Admins can read all categories"      ON "Category"          FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Admins can read all products"        ON "Product"           FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Admins can read warehouses"         ON "Warehouse"         FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Admins can read warehouse locations" ON "WarehouseLocation" FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Admins can read inventory"          ON "Inventory"          FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Admins can read inventory txns"     ON "InventoryTransaction" FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Admins can read stock transfers"    ON "StockTransfer"     FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Admins can read suppliers"          ON "Supplier"          FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Admins can read product suppliers"  ON "ProductSupplier"  FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Admins can read roles"              ON "Role"             FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Admins can read profiles"           ON "Profile"          FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Admins can read quotes"            ON "QuoteRequest"     FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Admins can read customers"         ON "Customer"          FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Admins can read product variants"  ON "ProductVariant"   FOR SELECT TO authenticated USING (TRUE);

-- WRITE policies — authenticated admins can write to all tables
-- (In production, narrow these by joining on Profile.role_id and the
--  specific role name — Catalogue Manager / Inventory Manager / etc.)
CREATE POLICY "Admins can write brands"            ON "Brand"                       FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Admins can write categories"       ON "Category"                    FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Admins can write products"         ON "Product"                     FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Admins can write pricing"          ON "Pricing"                     FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Admins can write learning"        ON "LearningContent"             FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Admins can write variants"         ON "ProductVariant"              FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Admins can write warehouses"       ON "Warehouse"                  FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Admins can write wh locations"    ON "WarehouseLocation"          FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Admins can write inventory"        ON "Inventory"                  FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Admins can write inv txns"         ON "InventoryTransaction"        FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Admins can write stock transfers" ON "StockTransfer"               FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Admins can write suppliers"       ON "Supplier"                   FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Admins can write product suppliers" ON "ProductSupplier"          FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Admins can write compatibility rules" ON "CompatibilityRule"           FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Admins can write storage rules"      ON "StorageCalculationRule"     FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Admins can write power rules"        ON "PowerCalculationRule"        FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Admins can write cable rules"        ON "CableCalculationRule"       FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Admins can write accessory rules"    ON "AccessoryRecommendationRule" FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Admins can write settings"          ON "AppSetting"                  FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Admins can write roles"            ON "Role"                        FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Admins can write profiles"         ON "Profile"                     FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);

-- QUOTE SUBMISSION — public can INSERT (no login required for the customer form)
CREATE POLICY "Public can create customers"   ON "Customer"     FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Public can create quotes"      ON "QuoteRequest" FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Public can update own customer" ON "Customer"   FOR UPDATE USING (TRUE) WITH CHECK (TRUE);

-- ============================================================================
-- SEED DATA: Roles
-- ============================================================================
INSERT INTO "Role" (name, description, permissions) VALUES
  ('Super Admin',        'Full access to all features',   '["*"]'),
  ('Inventory Manager',  'Manage stock and warehouses',   '["inventory:*","products:read"]'),
  ('Catalogue Manager',  'Manage products and pricing',   '["products:*","pricing:*"]'),
  ('Sales Manager',      'View orders and quotes',        '["orders:*","quotes:*"]'),
  ('Viewer',             'Read-only access',              '["*:read"]')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- SEED DATA: App Settings
-- ============================================================================
INSERT INTO "AppSetting" (key, value) VALUES
  ('DEFAULT_GST_RATE',             '18'),
  ('DEFAULT_POE_SAFETY_MARGIN',   '20'),
  ('DEFAULT_POWER_SAFETY_MARGIN', '20'),
  ('DEFAULT_CABLE_WASTAGE',       '10')
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- SEED DATA: Storage Calculation Rules (bitrate assumptions)
-- ============================================================================
INSERT INTO "StorageCalculationRule" (name, megapixel, codec, bitrate_mbps, fps, motion_factor, audio_overhead) VALUES
  ('2MP H.264',  '2MP', 'H.264',  4.0,  25, 0.4, 0.05),
  ('2MP H.265',  '2MP', 'H.265',  2.0,  25, 0.4, 0.05),
  ('2MP H.265+', '2MP', 'H.265+', 1.2,  25, 0.3, 0.05),
  ('4MP H.264',  '4MP', 'H.264',  8.0,  25, 0.4, 0.05),
  ('4MP H.265',  '4MP', 'H.265',  4.0,  25, 0.4, 0.05),
  ('4MP H.265+', '4MP', 'H.265+', 2.5,  25, 0.3, 0.05),
  ('5MP H.265',  '5MP', 'H.265',  5.0,  25, 0.4, 0.05),
  ('5MP H.265+', '5MP', 'H.265+', 3.0,  25, 0.3, 0.05),
  ('8MP H.265',  '8MP', 'H.265',  8.0,  25, 0.4, 0.05),
  ('8MP H.265+', '8MP', 'H.265+', 5.0,  25, 0.3, 0.05),
  ('4K H.265',   '4K',  'H.265',  12.0, 30, 0.4, 0.05),
  ('4K H.265+',  '4K',  'H.265+', 7.0,  30, 0.3, 0.05)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SEED DATA: Power Calculation Rules
-- ============================================================================
INSERT INTO "PowerCalculationRule" (name, product_type, wattage, safety_margin_percent) VALUES
  ('Analog Dome Camera',   'ANALOG_CAMERA', 4,  20),
  ('Analog Bullet Camera', 'ANALOG_CAMERA', 5,  20),
  ('Analog PTZ Camera',    'ANALOG_CAMERA', 25, 25),
  ('IP Dome Camera',       'IP_CAMERA',     6,  20),
  ('IP Bullet Camera',     'IP_CAMERA',     7,  20),
  ('IP PTZ Camera',        'IP_CAMERA',     35, 25),
  ('DVR (8CH)',            'DVR',           25, 15),
  ('DVR (16CH)',           'DVR',           35, 15),
  ('NVR (16CH)',           'NVR',           40, 15),
  ('NVR (32CH)',           'NVR',           60, 15)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SEED DATA: Cable Calculation Rules
-- ============================================================================
INSERT INTO "CableCalculationRule" (name, cable_type, system_type, roll_length_m, wastage_percent) VALUES
  ('Cat6 (IP system)',               'CAT6',             'IP',     305, 10),
  ('Cat6 Outdoor (IP system)',      'CAT6_OUTDOOR',     'IP',     305, 10),
  ('Cat6 Pure Copper (IP system)',  'CAT6_PURE_COPPER', 'IP',     305, 10),
  ('Cat5e (IP system)',             'CAT5E',            'IP',     305, 10),
  ('RG59 Siamese (Analog system)',  'SIAMESE',          'ANALOG', 100, 10),
  ('RG59 Coax+Power (Analog system)','RG59',           'ANALOG', 100, 10),
  ('RG6 (Analog system)',           'RG6',              'ANALOG', 100, 10)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SEED DATA: Compatibility Rules
-- ============================================================================
INSERT INTO "CompatibilityRule" (name, rule_type, source_type, target_type, source_attr, target_attr, severity, description) VALUES
  ('IP camera requires NVR',                  'RECORDER_TECH',      'IP_CAMERA',     'NVR',
   '{"technology":"IP"}'::jsonb,
   '{"product_type":"NVR"}'::jsonb,
   'ERROR', 'IP cameras require an NVR (not a DVR/XVR).'),
  ('Analog camera requires DVR/XVR',          'RECORDER_TECH',      'ANALOG_CAMERA', 'DVR',
   '{"technology":{"in":["TVI","CVI","AHD","Analog"]}}'::jsonb,
   '{"product_type":{"in":["DVR","XVR"]}}'::jsonb,
   'ERROR', 'Analog cameras require a DVR or XVR.'),
  ('Camera count <= recorder channels',       'CHANNEL_COUNT',      'CAMERA',        'RECORDER', NULL, NULL, 'ERROR',   'Total camera count cannot exceed recorder channel capacity.'),
  ('Camera resolution <= recorder support',   'RESOLUTION_SUPPORT', 'CAMERA',        'RECORDER', NULL, NULL, 'WARNING','Recorder should support the megapixel rating of all connected cameras.'),
  ('PoE power budget covers cameras',         'POE_POWER',          'IP_CAMERA',     'POE_SWITCH', NULL, NULL, 'ERROR',   'PoE switch power budget must cover total camera wattage.'),
  ('Cable type matches system',               'CABLE_MATCH',        'CAMERA',         'CABLE', NULL, NULL, 'WARNING','Cable type should match the system (Cat6 for IP, Siamese/RG59 for Analog).'),
  ('HDD retention matches requirement',      'STORAGE_RETENTION',  'CAMERA',         'HDD', NULL, NULL, 'WARNING','Selected HDD should provide retention days close to the customer requirement.')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SEED DATA: Accessory Recommendation Rules
-- ============================================================================
INSERT INTO "AccessoryRecommendationRule" (name, system_type, trigger, accessory_category, qty_per_camera, description) VALUES
  ('Junction box per camera',   '*',     '{"cameraCount":">0"}'::jsonb,    'Junction Box',   1.0, 'One junction box per outdoor camera install'),
  ('Camera mount per camera',   '*',     '{"cameraCount":">0"}'::jsonb,    'Camera Bracket', 1.0, 'Mounting bracket per camera'),
  ('Cable clips per camera',    '*',     '{"cameraCount":">0"}'::jsonb,    'Cable Clips',    1.0, 'Packs of cable clips for clean wiring'),
  ('UPS for recorder',          '*',     '{"cameraCount":">0"}'::jsonb,    'UPS',            0.1, 'One UPS per setup to keep recorder running'),
  ('HDMI cable for monitor',    '*',     '{"recorderCount":">0"}'::jsonb, 'HDMI Cable',     0.1, 'HDMI cable to connect recorder to monitor'),
  ('RJ45 connectors (IP)',      'IP',    '{"cameraCount":">0"}'::jsonb,    'RJ45 Connector', 2.0, 'Two RJ45 connectors per IP camera run'),
  ('BNC connectors (Analog)',   'ANALOG','{"cameraCount":">0"}'::jsonb,    'BNC Connector',  2.0, 'Two BNC connectors per analog camera run')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- DONE — schema ready. Next steps:
-- ============================================================================
-- 1. Create Storage buckets in Supabase Dashboard → Storage:
--      product-images, product-documents, product-videos, brand-assets, category-assets
-- 2. Set up Supabase Auth → Users → invite your admin user
--    (email: connectzsalesandservices@gmail.com)
-- 3. After the user signs up, insert their profile row linking to the Super Admin role:
--      INSERT INTO "Profile" (user_id, email, full_name, role_id)
--      SELECT auth.users.id::text, auth.users.email, 'Connectz Admin', r.id
--      FROM auth.users, "Role" r
--      WHERE auth.users.email = 'connectzsalesandservices@gmail.com'
--        AND r.name = 'Super Admin';
-- 4. Run scripts/seed-supabase.ts to insert demo products, brands, categories.
-- ============================================================================
