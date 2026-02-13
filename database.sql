-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE "bpm-anec-global".addresses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  label text,
  first_name text,
  last_name text,
  address text,
  city text,
  postal_code text,
  is_default boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT addresses_pkey PRIMARY KEY (id),
  CONSTRAINT addresses_user_id_fkey FOREIGN KEY (user_id) REFERENCES "bpm-anec-global".profiles(id)
);
CREATE TABLE "bpm-anec-global".ap_ar (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  type text CHECK (type = ANY (ARRAY['payable'::text, 'receivable'::text])),
  entity_name text,
  amount numeric,
  due_date date,
  status text DEFAULT 'unpaid'::text,
  CONSTRAINT ap_ar_pkey PRIMARY KEY (id)
);
CREATE TABLE "bpm-anec-global".applicant_management (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  first_name text,
  last_name text,
  email text,
  status text DEFAULT 'applied'::text,
  resume_url text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT applicant_management_pkey PRIMARY KEY (id)
);
CREATE TABLE "bpm-anec-global".asset_maintenance (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  asset_name text,
  warehouse_id uuid,
  last_service date,
  next_service date,
  CONSTRAINT asset_maintenance_pkey PRIMARY KEY (id),
  CONSTRAINT asset_maintenance_warehouse_id_fkey FOREIGN KEY (warehouse_id) REFERENCES "bpm-anec-global".warehouses(id)
);
CREATE TABLE "bpm-anec-global".attendance (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  employee_id uuid,
  check_in timestamp with time zone,
  check_out timestamp with time zone,
  status text,
  CONSTRAINT attendance_pkey PRIMARY KEY (id),
  CONSTRAINT attendance_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES "bpm-anec-global".profiles(id)
);
CREATE TABLE "bpm-anec-global".budgets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  department_id uuid,
  allocated_amount numeric,
  remaining_amount numeric,
  fiscal_year integer,
  CONSTRAINT budgets_pkey PRIMARY KEY (id),
  CONSTRAINT budgets_department_id_fkey FOREIGN KEY (department_id) REFERENCES "bpm-anec-global".departments(id)
);
CREATE TABLE "bpm-anec-global".categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT now(),
  description text,
  image_url text,
  CONSTRAINT categories_pkey PRIMARY KEY (id)
);
CREATE TABLE "bpm-anec-global".claims_reimbursement (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  employee_id uuid,
  claim_type text,
  amount numeric,
  receipt_url text,
  status text DEFAULT 'pending'::text,
  CONSTRAINT claims_reimbursement_pkey PRIMARY KEY (id),
  CONSTRAINT claims_reimbursement_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES "bpm-anec-global".profiles(id)
);
CREATE TABLE "bpm-anec-global".collections (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid,
  amount_collected numeric,
  payment_method text,
  collected_at timestamp with time zone DEFAULT now(),
  CONSTRAINT collections_pkey PRIMARY KEY (id),
  CONSTRAINT collections_order_id_fkey FOREIGN KEY (order_id) REFERENCES "bpm-anec-global".orders(id)
);
CREATE TABLE "bpm-anec-global".compensation_planning (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  employee_id uuid,
  plan_type text,
  proposed_increase numeric,
  effective_date date,
  CONSTRAINT compensation_planning_pkey PRIMARY KEY (id),
  CONSTRAINT compensation_planning_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES "bpm-anec-global".profiles(id)
);
CREATE TABLE "bpm-anec-global".competency_management (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  employee_id uuid,
  skill_name text,
  proficiency_level integer,
  last_assessed date,
  CONSTRAINT competency_management_pkey PRIMARY KEY (id),
  CONSTRAINT competency_management_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES "bpm-anec-global".profiles(id)
);
CREATE TABLE "bpm-anec-global".customer_support (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  order_id uuid,
  issue text,
  status text DEFAULT 'open'::text,
  CONSTRAINT customer_support_pkey PRIMARY KEY (id),
  CONSTRAINT customer_support_user_id_fkey FOREIGN KEY (user_id) REFERENCES "bpm-anec-global".profiles(id),
  CONSTRAINT customer_support_order_id_fkey FOREIGN KEY (order_id) REFERENCES "bpm-anec-global".orders(id)
);
CREATE TABLE "bpm-anec-global".departments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE,
  manager_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT departments_pkey PRIMARY KEY (id),
  CONSTRAINT departments_manager_fkey FOREIGN KEY (manager_id) REFERENCES "bpm-anec-global".profiles(id)
);
CREATE TABLE "bpm-anec-global".document_tracking (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  doc_type text,
  reference_id uuid,
  current_location text,
  status text,
  CONSTRAINT document_tracking_pkey PRIMARY KEY (id)
);
CREATE TABLE "bpm-anec-global".financial_ledger (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  transaction_type text,
  amount numeric NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT financial_ledger_pkey PRIMARY KEY (id)
);
CREATE TABLE "bpm-anec-global".hmo_benefits (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  employee_id uuid,
  plan_name text,
  coverage_amount numeric,
  status text DEFAULT 'active'::text,
  CONSTRAINT hmo_benefits_pkey PRIMARY KEY (id),
  CONSTRAINT hmo_benefits_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES "bpm-anec-global".profiles(id)
);
CREATE TABLE "bpm-anec-global".learning_management (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text,
  description text,
  course_url text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT learning_management_pkey PRIMARY KEY (id)
);
CREATE TABLE "bpm-anec-global".leave_management (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  employee_id uuid,
  type text,
  start_date date,
  end_date date,
  status text DEFAULT 'pending'::text,
  CONSTRAINT leave_management_pkey PRIMARY KEY (id),
  CONSTRAINT leave_management_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES "bpm-anec-global".profiles(id)
);
CREATE TABLE "bpm-anec-global".notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  title text NOT NULL,
  message text NOT NULL,
  type text DEFAULT 'system'::text,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES "bpm-anec-global".profiles(id)
);
CREATE TABLE "bpm-anec-global".order_cancellations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid,
  reason text,
  status text DEFAULT 'pending_review'::text,
  CONSTRAINT order_cancellations_pkey PRIMARY KEY (id),
  CONSTRAINT order_cancellations_order_id_fkey FOREIGN KEY (order_id) REFERENCES "bpm-anec-global".orders(id)
);
CREATE TABLE "bpm-anec-global".order_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid,
  product_id uuid,
  quantity integer,
  price_at_purchase numeric,
  product_name text,
  product_image text,
  product_category text,
  shop_id uuid,
  CONSTRAINT order_items_pkey PRIMARY KEY (id),
  CONSTRAINT order_items_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES "bpm-anec-global".shops(id),
  CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES "bpm-anec-global".orders(id),
  CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES "bpm-anec-global".products(id)
);
CREATE TABLE "bpm-anec-global".orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  customer_id uuid,
  total_amount numeric,
  status text DEFAULT 'to_pay'::text,
  order_number text UNIQUE,
  created_at timestamp with time zone DEFAULT now(),
  shop_id uuid,
  payment_status text DEFAULT 'pending'::text,
  shipping_status text DEFAULT 'pending'::text,
  shipping_address text,
  payment_method text,
  shipping_fee numeric DEFAULT 0,
  tax_amount numeric DEFAULT 0,
  discount_amount numeric DEFAULT 0,
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES "bpm-anec-global".shops(id),
  CONSTRAINT orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES "bpm-anec-global".profiles(id)
);
CREATE TABLE "bpm-anec-global".payout_management (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  shop_id uuid,
  amount numeric,
  status text DEFAULT 'pending'::text,
  processed_at timestamp with time zone,
  CONSTRAINT payout_management_pkey PRIMARY KEY (id),
  CONSTRAINT payout_management_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES "bpm-anec-global".shops(id)
);
CREATE TABLE "bpm-anec-global".payroll_management (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  employee_id uuid,
  base_salary numeric,
  bonuses numeric DEFAULT 0,
  deductions numeric DEFAULT 0,
  net_pay numeric,
  pay_period_end date,
  processed_at timestamp with time zone DEFAULT now(),
  CONSTRAINT payroll_management_pkey PRIMARY KEY (id),
  CONSTRAINT payroll_management_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES "bpm-anec-global".profiles(id)
);
CREATE TABLE "bpm-anec-global".procurement (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id uuid,
  supplier_name text,
  quantity integer,
  status text DEFAULT 'requested'::text,
  CONSTRAINT procurement_pkey PRIMARY KEY (id),
  CONSTRAINT procurement_product_id_fkey FOREIGN KEY (product_id) REFERENCES "bpm-anec-global".products(id)
);
CREATE TABLE "bpm-anec-global".product_reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  customer_id uuid NOT NULL,
  order_id uuid,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title text,
  comment text NOT NULL,
  media_urls text[] DEFAULT '{}'::text[],
  verified_purchase boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT product_reviews_pkey PRIMARY KEY (id),
  CONSTRAINT product_reviews_product_id_fkey FOREIGN KEY (product_id) REFERENCES "bpm-anec-global".products(id),
  CONSTRAINT product_reviews_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES "bpm-anec-global".profiles(id),
  CONSTRAINT product_reviews_order_id_fkey FOREIGN KEY (order_id) REFERENCES "bpm-anec-global".orders(id)
);
CREATE TABLE "bpm-anec-global".products (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  shop_id uuid,
  category_id uuid,
  name text NOT NULL,
  price numeric NOT NULL,
  stock_qty integer DEFAULT 0,
  images text[] DEFAULT '{}'::text[],
  status text DEFAULT 'active'::text,
  description text,
  slug text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  average_rating numeric DEFAULT 0,
  review_count integer DEFAULT 0,
  CONSTRAINT products_pkey PRIMARY KEY (id),
  CONSTRAINT products_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES "bpm-anec-global".shops(id),
  CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES "bpm-anec-global".categories(id)
);
CREATE TABLE "bpm-anec-global".profiles (
  id uuid NOT NULL,
  full_name text,
  email text,
  role text CHECK (role = ANY (ARRAY['customer'::text, 'seller'::text, 'admin'::text, 'hr'::text, 'logistics'::text, 'finance'::text])),
  department_id uuid,
  avatar_url text,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_department_id_fkey FOREIGN KEY (department_id) REFERENCES "bpm-anec-global".departments(id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE "bpm-anec-global".recruitment_management (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  job_title text,
  department_id uuid,
  budget numeric,
  status text DEFAULT 'open'::text,
  CONSTRAINT recruitment_management_pkey PRIMARY KEY (id),
  CONSTRAINT recruitment_management_department_id_fkey FOREIGN KEY (department_id) REFERENCES "bpm-anec-global".departments(id)
);
CREATE TABLE "bpm-anec-global".seller_applications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES "bpm-anec-global".profiles(id),
  shop_name text,
  shop_description text,
  status text DEFAULT 'pending'::text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT seller_applications_pkey PRIMARY KEY (id)
);
CREATE TABLE "bpm-anec-global".shift_schedule_management (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  employee_id uuid,
  start_time timestamp with time zone,
  end_time timestamp with time zone,
  shift_type text,
  CONSTRAINT shift_schedule_management_pkey PRIMARY KEY (id),
  CONSTRAINT shift_schedule_management_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES "bpm-anec-global".profiles(id)
);
CREATE TABLE "bpm-anec-global".shipments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid,
  vehicle_id uuid,
  status text DEFAULT 'preparing'::text,
  CONSTRAINT shipments_pkey PRIMARY KEY (id),
  CONSTRAINT shipments_order_id_fkey FOREIGN KEY (order_id) REFERENCES "bpm-anec-global".orders(id),
  CONSTRAINT shipments_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES "bpm-anec-global".vehicles(id)
);
CREATE TABLE "bpm-anec-global".shops (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  owner_id uuid,
  name text,
  description text,
  category text,
  phone text,
  website text,
  status text DEFAULT 'active'::text,
  avatar_url text,
  banner_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  rating numeric DEFAULT 0,
  location text,
  CONSTRAINT shops_pkey PRIMARY KEY (id),
  CONSTRAINT shops_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES "bpm-anec-global".profiles(id)
);
CREATE TABLE "bpm-anec-global".social_recognition (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  giver_id uuid,
  receiver_id uuid,
  message text,
  points integer,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT social_recognition_pkey PRIMARY KEY (id),
  CONSTRAINT social_recognition_giver_id_fkey FOREIGN KEY (giver_id) REFERENCES "bpm-anec-global".profiles(id),
  CONSTRAINT social_recognition_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES "bpm-anec-global".profiles(id)
);
CREATE TABLE "bpm-anec-global".subscriptions_commissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  shop_id uuid,
  plan_type text,
  commission_rate numeric,
  status text DEFAULT 'active'::text,
  CONSTRAINT subscriptions_commissions_pkey PRIMARY KEY (id),
  CONSTRAINT subscriptions_commissions_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES "bpm-anec-global".shops(id)
);
CREATE TABLE "bpm-anec-global".succession_planning (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  position_title text,
  current_incumbent uuid,
  potential_successor uuid,
  readiness_status text,
  CONSTRAINT succession_planning_pkey PRIMARY KEY (id),
  CONSTRAINT succession_planning_current_incumbent_fkey FOREIGN KEY (current_incumbent) REFERENCES "bpm-anec-global".profiles(id),
  CONSTRAINT succession_planning_potential_successor_fkey FOREIGN KEY (potential_successor) REFERENCES "bpm-anec-global".profiles(id)
);
CREATE TABLE "bpm-anec-global".timesheet_management (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  employee_id uuid,
  week_starting date,
  total_hours numeric,
  status text DEFAULT 'submitted'::text,
  CONSTRAINT timesheet_management_pkey PRIMARY KEY (id),
  CONSTRAINT timesheet_management_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES "bpm-anec-global".profiles(id)
);
CREATE TABLE "bpm-anec-global".training_management (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  course_id uuid,
  employee_id uuid,
  status text DEFAULT 'enrolled'::text,
  completed_at timestamp with time zone,
  CONSTRAINT training_management_pkey PRIMARY KEY (id),
  CONSTRAINT training_management_course_id_fkey FOREIGN KEY (course_id) REFERENCES "bpm-anec-global".learning_management(id),
  CONSTRAINT training_management_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES "bpm-anec-global".profiles(id)
);
CREATE TABLE "bpm-anec-global".vehicle_reservations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  vehicle_id uuid,
  driver_id uuid,
  start_time timestamp with time zone,
  end_time timestamp with time zone,
  CONSTRAINT vehicle_reservations_pkey PRIMARY KEY (id),
  CONSTRAINT vehicle_reservations_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES "bpm-anec-global".vehicles(id),
  CONSTRAINT vehicle_reservations_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES "bpm-anec-global".profiles(id)
);
CREATE TABLE "bpm-anec-global".vehicles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  plate_number text NOT NULL UNIQUE,
  vehicle_type text,
  status text DEFAULT 'available'::text,
  CONSTRAINT vehicles_pkey PRIMARY KEY (id)
);
CREATE TABLE "bpm-anec-global".warehouses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location text,
  capacity_total integer,
  CONSTRAINT warehouses_pkey PRIMARY KEY (id)
);

-- Row Level Security (RLS) Policies
ALTER TABLE "bpm-anec-global".profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE "bpm-anec-global".shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE "bpm-anec-global".products ENABLE ROW LEVEL SECURITY;
ALTER TABLE "bpm-anec-global".categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE "bpm-anec-global".orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE "bpm-anec-global".order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE "bpm-anec-global".product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE "bpm-anec-global".notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE "bpm-anec-global".addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE "bpm-anec-global".seller_applications ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read all, update own
CREATE POLICY "Public profiles are viewable by everyone" ON "bpm-anec-global".profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON "bpm-anec-global".profiles FOR UPDATE USING (auth.uid() = id);

-- Shops: Everyone can view, owners can update
CREATE POLICY "Public shops are viewable by everyone" ON "bpm-anec-global".shops FOR SELECT USING (true);
CREATE POLICY "Owners can update own shop" ON "bpm-anec-global".shops FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Owners can insert own shop" ON "bpm-anec-global".shops FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Products: Everyone can view, shop owners can update
CREATE POLICY "Public products are viewable by everyone" ON "bpm-anec-global".products FOR SELECT USING (true);
CREATE POLICY "Shop owners can manage products" ON "bpm-anec-global".products FOR ALL USING (
  EXISTS (
    SELECT 1 FROM "bpm-anec-global".shops 
    WHERE shops.id = products.shop_id AND shops.owner_id = auth.uid()
  )
);

-- Categories: Publicly viewable
CREATE POLICY "Public categories are viewable by everyone" ON "bpm-anec-global".categories FOR SELECT USING (true);

-- Product Reviews: Everyone can read, customers can insert after purchase (simplified here)
CREATE POLICY "Public reviews are viewable by everyone" ON "bpm-anec-global".product_reviews FOR SELECT USING (true);
CREATE POLICY "Customers can insert reviews" ON "bpm-anec-global".product_reviews FOR INSERT WITH CHECK (auth.uid() = customer_id);

-- Orders: Users can view their own orders
CREATE POLICY "Users can view own orders" ON "bpm-anec-global".orders FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Shop owners can view shop orders" ON "bpm-anec-global".orders FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM "bpm-anec-global".shops 
    WHERE shops.id = orders.shop_id AND shops.owner_id = auth.uid()
  )
);
CREATE POLICY "Users can insert own orders" ON "bpm-anec-global".orders FOR INSERT WITH CHECK (auth.uid() = customer_id);

-- Notifications: Users view own
CREATE POLICY "Users view own notifications" ON "bpm-anec-global".notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON "bpm-anec-global".notifications FOR UPDATE USING (auth.uid() = user_id);

-- Seller Applications: Users can read own and insert, logistics can read all
CREATE POLICY "Users can view own application" ON "bpm-anec-global".seller_applications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own application" ON "bpm-anec-global".seller_applications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Logistics can view all applications" ON "bpm-anec-global".seller_applications FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM "bpm-anec-global".profiles 
    WHERE profiles.id = auth.uid() AND lower(profiles.role) = 'logistics'
  )
);
CREATE POLICY "Logistics can update applications" ON "bpm-anec-global".seller_applications FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM "bpm-anec-global".profiles 
    WHERE profiles.id = auth.uid() AND lower(profiles.role) = 'logistics'
  )
);