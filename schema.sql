-- ================================================================
-- HRMS Database Schema for Supabase
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor)
-- ================================================================

-- Drop old QuantumCore tables if they exist
DROP TABLE IF EXISTS propulsion_metrics CASCADE;
DROP TABLE IF EXISTS flight_clearance_requests CASCADE;
DROP TABLE IF EXISTS telemetry_logs CASCADE;
DROP TABLE IF EXISTS researcher_profiles CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop HRMS tables if they exist (to allow re-running)
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS salary_structures CASCADE;
DROP TABLE IF EXISTS leave_requests CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS employee_profiles CASCADE;


-- ================================================================
-- 1. Employee Profiles
-- ================================================================
CREATE TABLE employee_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  employee_id TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  profile_picture_url TEXT,
  job_title TEXT NOT NULL DEFAULT 'Employee',
  department TEXT NOT NULL DEFAULT 'General',
  date_joined DATE NOT NULL DEFAULT CURRENT_DATE,
  role TEXT NOT NULL CHECK (role IN ('employee', 'admin')) DEFAULT 'employee',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================
-- 2. Attendance
-- ================================================================
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employee_profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'half-day', 'leave')) DEFAULT 'present',
  check_in TIMESTAMP WITH TIME ZONE,
  check_out TIMESTAMP WITH TIME ZONE,
  UNIQUE(employee_id, date)
);

-- ================================================================
-- 3. Leave Requests
-- ================================================================
CREATE TABLE leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employee_profiles(id) ON DELETE CASCADE,
  leave_type TEXT NOT NULL CHECK (leave_type IN ('paid', 'sick', 'unpaid')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  remarks TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  admin_comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================
-- 4. Salary Structures
-- ================================================================
CREATE TABLE salary_structures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employee_profiles(id) ON DELETE CASCADE UNIQUE,
  base_salary NUMERIC(12,2) NOT NULL DEFAULT 0,
  allowances NUMERIC(12,2) NOT NULL DEFAULT 0,
  deductions NUMERIC(12,2) NOT NULL DEFAULT 0,
  net_salary NUMERIC(12,2) GENERATED ALWAYS AS (base_salary + allowances - deductions) STORED,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================
-- 5. Documents
-- ================================================================
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employee_profiles(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================
-- Helper Functions (Security Definer to bypass RLS recursion)
-- ================================================================
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN COALESCE(
    (SELECT role = 'admin' FROM employee_profiles WHERE user_id = auth.uid()),
    FALSE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- Row Level Security (RLS)
-- ================================================================
ALTER TABLE employee_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- 1. Employee Profiles Policies
CREATE POLICY "Profiles are viewable by authenticated users"
  ON employee_profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Profiles can be inserted by owner"
  ON employee_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Profiles can be updated by owner or admin"
  ON employee_profiles FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id 
    OR 
    is_admin()
  );

CREATE POLICY "Admins have full access to profiles"
  ON employee_profiles FOR ALL
  TO authenticated
  USING (
    is_admin()
  );

-- 2. Attendance Policies
CREATE POLICY "Attendance is viewable by authenticated users"
  ON attendance FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Employees can insert own attendance"
  ON attendance FOR INSERT
  TO authenticated
  WITH CHECK (
    employee_id IN (SELECT id FROM employee_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Attendance can be updated by owner or admin"
  ON attendance FOR UPDATE
  TO authenticated
  USING (
    employee_id IN (SELECT id FROM employee_profiles WHERE user_id = auth.uid())
    OR
    is_admin()
  );

CREATE POLICY "Admins have full access to attendance"
  ON attendance FOR ALL
  TO authenticated
  USING (
    is_admin()
  );

-- 3. Leave Requests Policies
CREATE POLICY "Leaves are viewable by authenticated users"
  ON leave_requests FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Employees can insert own leave requests"
  ON leave_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    employee_id IN (SELECT id FROM employee_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Leaves can be updated by owner or admin"
  ON leave_requests FOR UPDATE
  TO authenticated
  USING (
    employee_id IN (SELECT id FROM employee_profiles WHERE user_id = auth.uid())
    OR
    is_admin()
  );

CREATE POLICY "Admins have full access to leave requests"
  ON leave_requests FOR ALL
  TO authenticated
  USING (
    is_admin()
  );

-- 4. Salary Structures Policies
CREATE POLICY "Salaries are viewable by owner or admin"
  ON salary_structures FOR SELECT
  TO authenticated
  USING (
    employee_id IN (SELECT id FROM employee_profiles WHERE user_id = auth.uid())
    OR
    is_admin()
  );

CREATE POLICY "Admins manage all salaries"
  ON salary_structures FOR ALL
  TO authenticated
  USING (
    is_admin()
  );

-- 5. Documents Policies
CREATE POLICY "Documents viewable by owner or admin"
  ON documents FOR SELECT
  TO authenticated
  USING (
    employee_id IN (SELECT id FROM employee_profiles WHERE user_id = auth.uid())
    OR
    is_admin()
  );

CREATE POLICY "Admins manage all documents"
  ON documents FOR ALL
  TO authenticated
  USING (
    is_admin()
  );

-- ================================================================
-- SEED DATA (10 employees, varied attendance, leave requests)
-- NOTE: Run this AFTER creating a user in Supabase Auth.
-- The first employee profile links to your existing auth user.
-- For the rest, they are demo data (no auth user linked).
-- ================================================================

-- You'll need to replace 'YOUR_AUTH_USER_ID' with the actual UUID
-- from Supabase Auth → Users → your user's UUID
-- For sankhanilrendi@gmail.com the UUID is: eee7e597-c225-4024-873f-a8478bab5af8

-- Admin user (linked to your real auth account)
INSERT INTO employee_profiles (user_id, employee_id, full_name, email, phone, address, job_title, department, date_joined, role)
VALUES
  ('eee7e597-c225-4024-873f-a8478bab5af8', 'EMP001', 'Sankhanil Ghosh', 'odoosankhanil@gmail.com', '+91 9876543210', '123 Main Street, Kolkata', 'HR Director', 'Human Resources', '2024-01-15', 'admin');

-- Demo employees (no auth user linked — for display/demo purposes)
INSERT INTO employee_profiles (employee_id, full_name, email, phone, address, job_title, department, date_joined, role)
VALUES
  ('EMP002', 'Priya Sharma', 'priya.sharma@company.com', '+91 9876543211', '45 Park Avenue, Mumbai', 'Software Engineer', 'Engineering', '2024-02-01', 'employee'),
  ('EMP003', 'Rahul Verma', 'rahul.verma@company.com', '+91 9876543212', '78 Lake Road, Bangalore', 'Product Manager', 'Product', '2024-01-20', 'employee'),
  ('EMP004', 'Ananya Das', 'ananya.das@company.com', '+91 9876543213', '12 Green Park, Delhi', 'UI/UX Designer', 'Engineering', '2024-03-10', 'employee'),
  ('EMP005', 'Vikram Singh', 'vikram.singh@company.com', '+91 9876543214', '56 MG Road, Pune', 'DevOps Engineer', 'Engineering', '2024-02-15', 'employee'),
  ('EMP006', 'Meera Patel', 'meera.patel@company.com', '+91 9876543215', '89 Ring Road, Ahmedabad', 'Marketing Manager', 'Marketing', '2024-01-05', 'employee'),
  ('EMP007', 'Arjun Nair', 'arjun.nair@company.com', '+91 9876543216', '34 Beach Road, Chennai', 'Data Analyst', 'Product', '2024-04-01', 'employee'),
  ('EMP008', 'Kavita Reddy', 'kavita.reddy@company.com', '+91 9876543217', '67 Jubilee Hills, Hyderabad', 'HR Executive', 'Human Resources', '2024-03-20', 'employee'),
  ('EMP009', 'Sanjay Gupta', 'sanjay.gupta@company.com', '+91 9876543218', '23 Civil Lines, Lucknow', 'Sales Executive', 'Marketing', '2024-05-01', 'employee'),
  ('EMP010', 'Deepika Iyer', 'deepika.iyer@company.com', '+91 9876543219', '91 Koramangala, Bangalore', 'QA Engineer', 'Engineering', '2024-04-15', 'employee');

-- Salary Structures for all employees
INSERT INTO salary_structures (employee_id, base_salary, allowances, deductions)
SELECT id, 
  CASE department 
    WHEN 'Engineering' THEN 85000
    WHEN 'Product' THEN 90000
    WHEN 'Human Resources' THEN 75000
    WHEN 'Marketing' THEN 70000
    ELSE 60000
  END,
  CASE department 
    WHEN 'Engineering' THEN 15000
    WHEN 'Product' THEN 18000
    WHEN 'Human Resources' THEN 12000
    WHEN 'Marketing' THEN 10000
    ELSE 8000
  END,
  CASE department 
    WHEN 'Engineering' THEN 8000
    WHEN 'Product' THEN 9000
    WHEN 'Human Resources' THEN 6000
    WHEN 'Marketing' THEN 5500
    ELSE 4500
  END
FROM employee_profiles;

-- Attendance records for the past 2 weeks (varied statuses)
DO $$
DECLARE
  emp RECORD;
  d DATE;
  day_of_week INT;
  rand_val FLOAT;
  att_status TEXT;
  checkin_time TIMESTAMP WITH TIME ZONE;
  checkout_time TIMESTAMP WITH TIME ZONE;
BEGIN
  FOR emp IN SELECT id FROM employee_profiles LOOP
    FOR d IN SELECT generate_series(CURRENT_DATE - INTERVAL '14 days', CURRENT_DATE - INTERVAL '1 day', '1 day')::date LOOP
      day_of_week := EXTRACT(DOW FROM d);
      -- Skip weekends
      IF day_of_week IN (0, 6) THEN CONTINUE; END IF;
      
      rand_val := random();
      IF rand_val < 0.75 THEN
        att_status := 'present';
        checkin_time := d + TIME '09:00:00' + (random() * INTERVAL '45 minutes');
        checkout_time := d + TIME '17:30:00' + (random() * INTERVAL '1 hour');
      ELSIF rand_val < 0.85 THEN
        att_status := 'half-day';
        checkin_time := d + TIME '09:00:00' + (random() * INTERVAL '30 minutes');
        checkout_time := d + TIME '13:00:00' + (random() * INTERVAL '30 minutes');
      ELSIF rand_val < 0.95 THEN
        att_status := 'absent';
        checkin_time := NULL;
        checkout_time := NULL;
      ELSE
        att_status := 'leave';
        checkin_time := NULL;
        checkout_time := NULL;
      END IF;
      
      INSERT INTO attendance (employee_id, date, status, check_in, check_out)
      VALUES (emp.id, d, att_status, checkin_time, checkout_time)
      ON CONFLICT (employee_id, date) DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

-- Leave Requests (mix of pending, approved, rejected)
INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date, remarks, status, admin_comment)
SELECT 
  ep.id,
  lr.leave_type,
  lr.start_date,
  lr.end_date,
  lr.remarks,
  lr.status,
  lr.admin_comment
FROM (VALUES
  ('EMP002', 'paid',   CURRENT_DATE + 3,  CURRENT_DATE + 5,  'Family wedding ceremony', 'pending', NULL),
  ('EMP003', 'sick',   CURRENT_DATE - 5,  CURRENT_DATE - 4,  'Fever and cold', 'approved', 'Get well soon, take rest'),
  ('EMP004', 'unpaid', CURRENT_DATE + 10, CURRENT_DATE + 12, 'Personal travel', 'pending', NULL),
  ('EMP005', 'paid',   CURRENT_DATE - 10, CURRENT_DATE - 8,  'Annual vacation', 'approved', 'Approved. Enjoy!'),
  ('EMP006', 'sick',   CURRENT_DATE + 1,  CURRENT_DATE + 2,  'Medical appointment', 'rejected', 'Please reschedule, critical campaign this week'),
  ('EMP007', 'paid',   CURRENT_DATE + 7,  CURRENT_DATE + 7,  'Personal day', 'pending', NULL),
  ('EMP009', 'unpaid', CURRENT_DATE + 14, CURRENT_DATE + 18, 'Extended family visit', 'pending', NULL)
) AS lr(emp_id, leave_type, start_date, end_date, remarks, status, admin_comment)
JOIN employee_profiles ep ON ep.employee_id = lr.emp_id;
