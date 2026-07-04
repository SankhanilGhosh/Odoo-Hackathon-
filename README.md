# HRMS — Human Resource Management System

A polished, high-performance Human Resource Management System (HRMS) built for hackathon submissions. Features a clean, responsive interface using TailwindCSS, robust security policies via Supabase Row-Level Security, and detailed visualizations using Recharts.

---

## 🚀 Features

### 🔐 1. Authentication & RBAC
- **Unified Sign-in & Sign-up**: Clean forms with client-side password validations (min 8 chars, 1 number, 1 special char).
- **Role-Based Access Control (RBAC)**: Next.js middleware and database RLS (Row-Level Security) ensure employees can only see their own records, while HR Admins can view and manage the entire organization.

### 👥 2. Employee Management
- **Searchable/Filterable Directory**: Real-time filters by name, email, department, or employee ID.
- **Detailed Profiles**: Displays employee ID, contact information, job title, department, date joined, and a breakdown of their current salary structure.
- **Inline Editing**: Admins can edit any field on any profile; employees can update their contact details.

### 📋 3. Daily Attendance System
- **Real-Time Check-In/Check-Out**: Easy toggle buttons that record check-in/out timestamps.
- **Interactive Calendar View**: Color-coded calendar showing Present, Absent, Half Day, and Leave status.
- **Stats Dashboard**: Displays monthly summaries of attendance days.

### 🏖️ 4. Leave Approval Workflow
- **Application Form**: Employee leave submissions with start/end dates, leave type (paid/sick/unpaid), and remarks.
- **Admin Inbox**: Filterable approval request inbox for admins.
- **Instant Synchronization**: Approving a leave automatically updates the employee's attendance record (marks dates as 'Leave') and updates stats immediately.

### 📊 5. Payroll Management
- **Allowances & Deductions**: Complete salary breakdown with auto-calculated Net Take-Home Salary.
- **Admin Control**: HR admins can dynamically edit the salary structure of any employee with changes saving immediately.

### 📈 6. Visualization & Analytics
- **Weekly Attendance Graph**: Bar chart showing daily attendance status across all employees.
- **Department Heatmap**: Progress bars showing real-time department attendance percentage today.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router, TypeScript)
- **Styling**: TailwindCSS (Responsive Grid, Custom Components)
- **Database / Auth**: Supabase (PostgreSQL, Auth, RLS)
- **Charts**: Recharts

---

## ⚙️ Local Setup Instructions

### 1. Clone the repository
```bash
git clone https://github.com/SankhanilGhosh/Odoo-Hackathon-.git
cd Odoo-Hackathon-
```

### 2. Configure Environment Variables
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=https://rahnhapeeynkrntafiih.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SECRET_SERVICE_ROLE_KEY
```

### 3. Setup Database Schema & Seed Data
1. Go to your **Supabase Dashboard**.
2. Select your project and navigate to the **SQL Editor**.
3. Open the `schema.sql` file in the root of the project, copy the entire SQL script, paste it into the editor, and click **Run**.
4. *(Optional)* When logging in as `odoosankhanil@gmail.com` for the first time, the application will automatically create an admin profile row for you in the `employee_profiles` table.

### 4. Install Dependencies & Start Dev Server
```bash
npm install
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## 🔑 Demo Credentials

### Admin (HR)
- **Email**: `oodosankhanil@gmail.com`
- **Password**: `oodo1234!@`
