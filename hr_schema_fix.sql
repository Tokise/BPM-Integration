-- RELOAD SCHEMA for HR Modules
-- Run this in your Supabase SQL Editor to fix missing tables and columns

-- 1. Create compensation_management (Replaces compensation_planning)
CREATE TABLE IF NOT EXISTS "bpm-anec-global".compensation_management (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    employee_id uuid,
    employee_name text,
    base_salary numeric,
    bonus_percentage numeric DEFAULT 0,
    grade_level text,
    last_review date,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT compensation_management_pkey PRIMARY KEY (id),
    CONSTRAINT compensation_management_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES "bpm-anec-global".profiles(id)
);

-- 2. Enhance claims_reimbursement with description and timestamps
ALTER TABLE "bpm-anec-global".claims_reimbursement ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE "bpm-anec-global".claims_reimbursement ADD COLUMN IF NOT EXISTS employee_name text;
ALTER TABLE "bpm-anec-global".claims_reimbursement ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now();

-- 3. Update payroll_management with status and period start
ALTER TABLE "bpm-anec-global".payroll_management ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';
ALTER TABLE "bpm-anec-global".payroll_management ADD COLUMN IF NOT EXISTS pay_period_start date;

-- 4. Enable RLS and add handling policies
ALTER TABLE "bpm-anec-global".applicant_management ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public handle applicants" ON "bpm-anec-global".applicant_management;
CREATE POLICY "Public handle applicants" ON "bpm-anec-global".applicant_management FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

ALTER TABLE "bpm-anec-global".compensation_management ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public handle compensation" ON "bpm-anec-global".compensation_management;
CREATE POLICY "Public handle compensation" ON "bpm-anec-global".compensation_management FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

ALTER TABLE "bpm-anec-global".claims_reimbursement ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public handle claims" ON "bpm-anec-global".claims_reimbursement;
CREATE POLICY "Public handle claims" ON "bpm-anec-global".claims_reimbursement FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

ALTER TABLE "bpm-anec-global".payroll_management ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public handle payroll" ON "bpm-anec-global".payroll_management;
CREATE POLICY "Public handle payroll" ON "bpm-anec-global".payroll_management FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 5. Link learning and training (ensure RLS)
ALTER TABLE "bpm-anec-global".learning_management ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public handle learning" ON "bpm-anec-global".learning_management;
CREATE POLICY "Public handle learning" ON "bpm-anec-global".learning_management FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

ALTER TABLE "bpm-anec-global".training_management ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public handle training" ON "bpm-anec-global".training_management;
CREATE POLICY "Public handle training" ON "bpm-anec-global".training_management FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
