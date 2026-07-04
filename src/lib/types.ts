// Core TypeScript types for HRMS

export type UserRole = 'employee' | 'admin';

export type AttendanceStatus = 'present' | 'absent' | 'half-day' | 'leave';

export type LeaveType = 'paid' | 'sick' | 'unpaid';

export type LeaveStatus = 'pending' | 'approved' | 'rejected';

export interface EmployeeProfile {
  id: string;
  user_id: string;
  employee_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  address: string | null;
  profile_picture_url: string | null;
  job_title: string;
  department: string;
  date_joined: string;
  role: UserRole;
  created_at: string;
}

export interface AttendanceRecord {
  id: string;
  employee_id: string;
  date: string;
  status: AttendanceStatus;
  check_in: string | null;
  check_out: string | null;
  employee_profiles?: EmployeeProfile;
}

export interface LeaveRequest {
  id: string;
  employee_id: string;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  remarks: string | null;
  status: LeaveStatus;
  admin_comment: string | null;
  created_at: string;
  employee_profiles?: EmployeeProfile;
}

export interface SalaryStructure {
  id: string;
  employee_id: string;
  base_salary: number;
  allowances: number;
  deductions: number;
  net_salary: number;
  updated_at: string;
  employee_profiles?: EmployeeProfile;
}

export interface Document {
  id: string;
  employee_id: string;
  doc_type: string;
  file_url: string;
  uploaded_at: string;
}

export interface DashboardStats {
  totalEmployees: number;
  presentToday: number;
  absentToday: number;
  pendingLeaves: number;
  attendancePercentage: number;
}
