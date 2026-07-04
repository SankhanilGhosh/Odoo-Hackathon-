'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function SignUp() {
  const router = useRouter();
  const [form, setForm] = useState({
    employeeId: '',
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'employee' as 'employee' | 'admin',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const updateForm = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 8) return 'Password must be at least 8 characters';
    if (!/\d/.test(pwd)) return 'Password must contain at least 1 number';
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) return 'Password must contain at least 1 special character';
    return null;
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }
    const pwdError = validatePassword(form.password);
    if (pwdError) {
      setError(pwdError);
      setLoading(false);
      return;
    }

    try {
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
      });

      if (authError) throw authError;

      if (authData.user) {
        // 2. Create employee profile
        const { error: profileError } = await supabase
          .from('employee_profiles')
          .insert({
            user_id: authData.user.id,
            employee_id: form.employeeId,
            full_name: form.fullName,
            email: form.email,
            role: form.role,
            job_title: form.role === 'admin' ? 'HR Manager' : 'Employee',
            department: form.role === 'admin' ? 'Human Resources' : 'General',
          });

        if (profileError) throw profileError;

        // 3. Create default salary structure
        const { data: profile } = await supabase
          .from('employee_profiles')
          .select('id')
          .eq('user_id', authData.user.id)
          .single();

        if (profile) {
          await supabase.from('salary_structures').insert({
            employee_id: profile.id,
            base_salary: 50000,
            allowances: 8000,
            deductions: 4000,
          });
        }
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-surface-100 p-4">
        <div className="w-full max-w-md animate-fade-in">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-elevated border border-surface-200/50 p-8 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">✓</div>
            <h2 className="text-xl font-bold text-surface-900 mb-2">Account Created!</h2>
            <p className="text-surface-500 text-sm mb-6">
              Your account has been created successfully. You can now sign in with your credentials.
            </p>
            <Link href="/sign-in" className="btn-primary btn-lg w-full">
              Go to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-surface-100 p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-200/30 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary-100/40 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md relative animate-fade-in">
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-elevated border border-surface-200/50 p-8">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4 shadow-lg">
              H
            </div>
            <h1 className="text-2xl font-bold text-surface-900">Create Account</h1>
            <p className="text-surface-500 text-sm mt-1">Join the HRMS platform</p>
          </div>

          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="employeeId" className="label">Employee ID</label>
                <input
                  id="employeeId"
                  type="text"
                  value={form.employeeId}
                  onChange={(e) => updateForm('employeeId', e.target.value)}
                  className="input"
                  placeholder="EMP011"
                  required
                />
              </div>
              <div>
                <label htmlFor="role" className="label">Role</label>
                <select
                  id="role"
                  value={form.role}
                  onChange={(e) => updateForm('role', e.target.value)}
                  className="input"
                >
                  <option value="employee">Employee</option>
                  <option value="admin">Admin (HR)</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="fullName" className="label">Full Name</label>
              <input
                id="fullName"
                type="text"
                value={form.fullName}
                onChange={(e) => updateForm('fullName', e.target.value)}
                className="input"
                placeholder="John Doe"
                required
              />
            </div>

            <div>
              <label htmlFor="signup-email" className="label">Email Address</label>
              <input
                id="signup-email"
                type="email"
                value={form.email}
                onChange={(e) => updateForm('email', e.target.value)}
                className="input"
                placeholder="you@company.com"
                required
              />
            </div>

            <div>
              <label htmlFor="signup-password" className="label">Password</label>
              <input
                id="signup-password"
                type="password"
                value={form.password}
                onChange={(e) => updateForm('password', e.target.value)}
                className="input"
                placeholder="Min 8 chars, 1 number, 1 special"
                required
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="label">Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                value={form.confirmPassword}
                onChange={(e) => updateForm('confirmPassword', e.target.value)}
                className="input"
                placeholder="Re-enter password"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg flex items-center gap-2">
                <span className="text-red-500 flex-shrink-0">⚠</span>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full btn-lg">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Creating account...
                </span>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-surface-500">
              Already have an account?{' '}
              <Link href="/sign-in" className="text-primary-600 font-medium hover:text-primary-700 transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
