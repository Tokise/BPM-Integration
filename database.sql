-- COMPREHENSIVE E-COMMERCE MANAGEMENT SYSTEM SCHEMA
-- Includes all modules: HR 1-4, Core Transactions 1-3, Logistics 1-2, and Financials.
-- Activates RLS for all tables.

CREATE SCHEMA IF NOT EXISTS "bpm-anec-global";

-- Grant usage on the schema to Supabase default roles
GRANT USAGE ON SCHEMA "bpm-anec-global" TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA "bpm-anec-global" TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA "bpm-anec-global" TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA "bpm-anec-global" GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA "bpm-anec-global" GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

-- Set search_path for the roles so they always find "bpm-anec-global" tables
ALTER ROLE anon SET search_path TO "bpm-anec-global", public;
ALTER ROLE authenticated SET search_path TO "bpm-anec-global", public;
ALTER ROLE authenticator SET search_path TO "bpm-anec-global", public;
ALTER ROLE service_role SET search_path TO "bpm-anec-global", public;

-- ==========================================
-- 1. AUTH & BASIC ENTITIES
-- ==========================================

CREATE TABLE "bpm-anec-global".departments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  code text UNIQUE,
  manager_id uuid,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE "bpm-anec-global".profiles (
  id uuid NOT NULL PRIMARY KEY,
  full_name text,
  email text,
  role text CHECK (role = ANY (ARRAY['customer'::text, 'seller'::text, 'admin'::text, 'hr'::text, 'logistics'::text, 'finance'::text])),
  department_id uuid REFERENCES "bpm-anec-global".departments(id),
  avatar_url text,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);

ALTER TABLE "bpm-anec-global".departments 
ADD CONSTRAINT departments_manager_fkey FOREIGN KEY (manager_id) REFERENCES "bpm-anec-global".profiles(id);

CREATE TABLE "bpm-anec-global".addresses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES "bpm-anec-global".profiles(id),
  label text,
  first_name text,
  last_name text,
  address text,
  city text,
  postal_code text,
  is_default boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- ==========================================
-- 2. HUMAN RESOURCE 1: Talent Acquisition
-- ==========================================

CREATE TABLE "bpm-anec-global".applicant_management (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name text, last_name text, email text, status text DEFAULT 'applied', resume_url text, created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE "bpm-anec-global".recruitment_management (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_title text, department_id uuid REFERENCES "bpm-anec-global".departments(id), budget numeric, status text DEFAULT 'open'
);

CREATE TABLE "bpm-anec-global".social_recognition (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  giver_id uuid REFERENCES "bpm-anec-global".profiles(id), receiver_id uuid REFERENCES "bpm-anec-global".profiles(id), message text, points integer, created_at timestamp with time zone DEFAULT now()
);

-- ==========================================
-- 3. HUMAN RESOURCE 2: Talent Development
-- ==========================================

CREATE TABLE "bpm-anec-global".competency_management (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id uuid REFERENCES "bpm-anec-global".profiles(id), skill_name text, proficiency_level integer, last_assessed date
);

CREATE TABLE "bpm-anec-global".learning_management (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text, description text, course_url text, created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE "bpm-anec-global".training_management (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id uuid REFERENCES "bpm-anec-global".learning_management(id), employee_id uuid REFERENCES "bpm-anec-global".profiles(id), status text DEFAULT 'enrolled', completed_at timestamp with time zone
);

CREATE TABLE "bpm-anec-global".succession_planning (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  position_title text, current_incumbent uuid REFERENCES "bpm-anec-global".profiles(id), potential_successor uuid REFERENCES "bpm-anec-global".profiles(id), readiness_status text
);

-- ==========================================
-- 4. HUMAN RESOURCE 3: Workforce Operations
-- ==========================================

CREATE TABLE "bpm-anec-global".attendance (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id uuid REFERENCES "bpm-anec-global".profiles(id), check_in timestamp with time zone, check_out timestamp with time zone, status text
);

CREATE TABLE "bpm-anec-global".shift_schedule_management (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id uuid REFERENCES "bpm-anec-global".profiles(id), start_time timestamp with time zone, end_time timestamp with time zone, shift_type text
);

CREATE TABLE "bpm-anec-global".timesheet_management (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id uuid REFERENCES "bpm-anec-global".profiles(id), week_starting date, total_hours numeric, status text DEFAULT 'submitted'
);

CREATE TABLE "bpm-anec-global".leave_management (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id uuid REFERENCES "bpm-anec-global".profiles(id), type text, start_date date, end_date date, status text DEFAULT 'pending'
);

CREATE TABLE "bpm-anec-global".claims_reimbursement (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id uuid REFERENCES "bpm-anec-global".profiles(id), claim_type text, amount numeric, receipt_url text, status text DEFAULT 'pending'
);

-- ==========================================
-- 5. HUMAN RESOURCE 4: Compensation
-- ==========================================

CREATE TABLE "bpm-anec-global".payroll_management (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id uuid REFERENCES "bpm-anec-global".profiles(id), base_salary numeric, bonuses numeric DEFAULT 0, deductions numeric DEFAULT 0, net_pay numeric, pay_period_end date, processed_at timestamp with time zone DEFAULT now()
);

CREATE TABLE "bpm-anec-global".compensation_planning (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id uuid REFERENCES "bpm-anec-global".profiles(id), plan_type text, proposed_increase numeric, effective_date date
);

CREATE TABLE "bpm-anec-global".hmo_benefits (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id uuid REFERENCES "bpm-anec-global".profiles(id), plan_name text, coverage_amount numeric, status text DEFAULT 'active'
);

-- ==========================================
-- 6. CORE TRANSACTION 1: Marketplace
-- ==========================================

CREATE TABLE "bpm-anec-global".categories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL, slug text NOT NULL UNIQUE, created_at timestamp with time zone DEFAULT now()
);

-- Note: Shops, Products, Orders, Order Items are here
CREATE TABLE "bpm-anec-global".shops (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id uuid REFERENCES "bpm-anec-global".profiles(id), 
  name text, 
  description text, 
  avatar_url text,
  rating numeric DEFAULT 0,
  location text,
  status text DEFAULT 'active'
);

CREATE TABLE "bpm-anec-global".products (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id uuid REFERENCES "bpm-anec-global".shops(id), 
  category_id uuid REFERENCES "bpm-anec-global".categories(id), 
  name text NOT NULL, 
  description text,
  price numeric NOT NULL, 
  stock_qty integer DEFAULT 0, 
  images text[], 
  average_rating numeric DEFAULT 0,
  review_count integer DEFAULT 0,
  status text DEFAULT 'active'
);

CREATE TABLE "bpm-anec-global".orders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id uuid REFERENCES "bpm-anec-global".profiles(id), total_amount numeric, status text DEFAULT 'to_pay', order_number text UNIQUE, created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE "bpm-anec-global".order_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid REFERENCES "bpm-anec-global".orders(id), product_id uuid REFERENCES "bpm-anec-global".products(id), quantity integer, price_at_purchase numeric
);

CREATE TABLE "bpm-anec-global".customer_support (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES "bpm-anec-global".profiles(id), order_id uuid REFERENCES "bpm-anec-global".orders(id), issue text, status text DEFAULT 'open'
);

CREATE TABLE "bpm-anec-global".product_reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES "bpm-anec-global".products(id),
  customer_id uuid NOT NULL REFERENCES "bpm-anec-global".profiles(id),
  order_id uuid REFERENCES "bpm-anec-global".orders(id),
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title text,
  comment text NOT NULL,
  media_urls text[] DEFAULT '{}',
  verified_purchase boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- ==========================================
-- 7. CORE TRANSACTION 2: Seller Operations
-- ==========================================

CREATE TABLE "bpm-anec-global".order_cancellations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid REFERENCES "bpm-anec-global".orders(id), reason text, status text DEFAULT 'pending_review'
);

CREATE TABLE "bpm-anec-global".seller_applications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES "bpm-anec-global".profiles(id), shop_name text, status text DEFAULT 'pending'
);

-- ==========================================
-- 8. CORE TRANSACTION 3: Platform Control
-- ==========================================

CREATE TABLE "bpm-anec-global".subscriptions_commissions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id uuid REFERENCES "bpm-anec-global".shops(id), plan_type text, commission_rate numeric, status text DEFAULT 'active'
);

CREATE TABLE "bpm-anec-global".payout_management (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id uuid REFERENCES "bpm-anec-global".shops(id), amount numeric, status text DEFAULT 'pending', processed_at timestamp with time zone
);

-- ==========================================
-- 9. LOGISTICS 1: Smart Supply Chain
-- ==========================================

CREATE TABLE "bpm-anec-global".warehouses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL, location text, capacity_total integer
);

CREATE TABLE "bpm-anec-global".procurement (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid REFERENCES "bpm-anec-global".products(id), supplier_name text, quantity integer, status text DEFAULT 'requested'
);

CREATE TABLE "bpm-anec-global".asset_maintenance (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_name text, warehouse_id uuid REFERENCES "bpm-anec-global".warehouses(id), last_service date, next_service date
);

CREATE TABLE "bpm-anec-global".document_tracking (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  doc_type text, reference_id uuid, current_location text, status text
);

-- ==========================================
-- 10. LOGISTICS 2: Fleet & Transpo
-- ==========================================

CREATE TABLE "bpm-anec-global".vehicles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plate_number text NOT NULL UNIQUE, vehicle_type text, status text DEFAULT 'available'
);

CREATE TABLE "bpm-anec-global".vehicle_reservations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id uuid REFERENCES "bpm-anec-global".vehicles(id), driver_id uuid REFERENCES "bpm-anec-global".profiles(id), start_time timestamp with time zone, end_time timestamp with time zone
);

CREATE TABLE "bpm-anec-global".shipments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid REFERENCES "bpm-anec-global".orders(id), vehicle_id uuid REFERENCES "bpm-anec-global".vehicles(id), status text DEFAULT 'preparing'
);

-- ==========================================
-- 11. FINANCIALS
-- ==========================================

CREATE TABLE "bpm-anec-global".budgets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  department_id uuid REFERENCES "bpm-anec-global".departments(id), allocated_amount numeric, remaining_amount numeric, fiscal_year integer
);

CREATE TABLE "bpm-anec-global".collections (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid REFERENCES "bpm-anec-global".orders(id), amount_collected numeric, payment_method text, collected_at timestamp with time zone DEFAULT now()
);

CREATE TABLE "bpm-anec-global".financial_ledger (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_type text, amount numeric NOT NULL, created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE "bpm-anec-global".ap_ar (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type text CHECK (type = ANY (ARRAY['payable', 'receivable'])), entity_name text, amount numeric, due_date date, status text DEFAULT 'unpaid'
);

-- ==========================================
-- 12. RLS & FUNCTIONS
-- ==========================================

-- Enable RLS on ALL tables (simplified approach)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'bpm-anec-global') LOOP
        EXECUTE 'ALTER TABLE "bpm-anec-global".' || quote_ident(r.tablename) || ' ENABLE ROW LEVEL SECURITY';
    END LOOP;
END $$;

-- Basic Policies
CREATE POLICY "Public select" ON "bpm-anec-global".products FOR SELECT USING (true);
CREATE POLICY "Public select cats" ON "bpm-anec-global".categories FOR SELECT USING (true);
CREATE POLICY "Owner crud profiles" ON "bpm-anec-global".profiles FOR ALL USING (auth.uid() = id);

-- Product Reviews Policies
CREATE POLICY "Public select reviews" ON "bpm-anec-global".product_reviews FOR SELECT USING (true);
CREATE POLICY "Auth insert reviews" ON "bpm-anec-global".product_reviews FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Owner crud reviews" ON "bpm-anec-global".product_reviews FOR ALL USING (auth.uid() = customer_id);

-- Inventory RPCs
CREATE OR REPLACE FUNCTION "bpm-anec-global".decrement_stock(product_id UUID, qty INT) RETURNS void AS $$
BEGIN UPDATE "bpm-anec-global".products SET stock_qty = stock_qty - qty WHERE id = product_id; END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION "bpm-anec-global".increment_stock(product_id UUID, qty INT) RETURNS void AS $$
BEGIN UPDATE "bpm-anec-global".products SET stock_qty = stock_qty + qty WHERE id = product_id; END;
$$ LANGUAGE plpgsql;

-- Trigger Function for Automatic Profile Creation
CREATE OR REPLACE FUNCTION "bpm-anec-global".handle_new_user() RETURNS trigger AS $$
BEGIN INSERT INTO "bpm-anec-global".profiles (id, full_name, email, role) VALUES (new.id, new.raw_user_meta_data->>'full_name', new.email, 'customer'); RETURN new; END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Seed Departments
INSERT INTO "bpm-anec-global".departments (id, name, code) VALUES
('d1f5e27a-6b4c-4e8d-8c1a-2b3c4d5e6f7a', 'Human Resource 1', 'HR_DEPT1'),
('d2f5e27a-6b4c-4e8d-8c1a-2b3c4d5e6f7b', 'Human Resource 2', 'HR_DEPT2'),
('d3f5e27a-6b4c-4e8d-8c1a-2b3c4d5e6f7c', 'Human Resource 3', 'HR_DEPT3'),
('d4f5e27a-6b4c-4e8d-8c1a-2b3c4d5e6f7d', 'Human Resource 4', 'HR_DEPT4'),
('e1f5e27a-6b4c-4e8d-8c1a-2b3c4d5e6f7e', 'Logistics 1', 'LOG_DEPT1'),
('e2f5e27a-6b4c-4e8d-8c1a-2b3c4d5e6f7f', 'Logistics 2', 'LOG_DEPT2'),
('f1f5e27a-6b4c-4e8d-8c1a-2b3c4d5e6f80', 'Financials', 'FINANCE')
ON CONFLICT (code) DO NOTHING;