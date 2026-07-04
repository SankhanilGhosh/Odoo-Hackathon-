'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function SignIn() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      // Fetch role from employee_profiles
      let { data: profile } = await supabase
        .from('employee_profiles')
        .select('role, full_name')
        .eq('user_id', data.user.id)
        .single();

      // Auto-create profile if it doesn't exist
      if (!profile) {
        const { error: insertError } = await supabase
          .from('employee_profiles')
          .insert({
            user_id: data.user.id,
            employee_id: 'EMP' + Date.now().toString().slice(-6),
            full_name: data.user.email?.split('@')[0] || 'User',
            email: data.user.email || email,
            role: 'admin', // First user gets admin role
            job_title: 'HR Director',
            department: 'Human Resources',
          });

        if (insertError) {
          throw new Error('Could not create profile: ' + insertError.message);
        }

        // Re-fetch the newly created profile
        const { data: newProfile } = await supabase
          .from('employee_profiles')
          .select('role, full_name')
          .eq('user_id', data.user.id)
          .single();
        
        profile = newProfile;
      }

      if (!profile) {
        throw new Error('Profile setup failed. Please try again.');
      }

      // Set role cookie for middleware
      document.cookie = `hrms_role=${profile.role}; path=/; max-age=${60 * 60 * 24 * 7}`;

      // Redirect based on role
      if (profile.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-surface-100 p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-200/30 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary-100/40 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md relative animate-fade-in">
        {/* Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-elevated border border-surface-200/50 p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4 shadow-lg">
              H
            </div>
            <h1 className="text-2xl font-bold text-surface-900">Welcome back</h1>
            <p className="text-surface-500 text-sm mt-1">Sign in to your HRMS account</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label htmlFor="email" className="label">Email Address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="you@company.com"
                required
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="password" className="label">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="Enter your password"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg flex items-center gap-2">
                <span className="text-red-500 flex-shrink-0">⚠</span>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full btn-lg"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-sm text-surface-500">
              Don&apos;t have an account?{' '}
              <Link href="/sign-up" className="text-primary-600 font-medium hover:text-primary-700 transition-colors">
                Sign up
              </Link>
            </p>
          </div>
        </div>

        {/* Demo credentials hint */}
        <div className="mt-4 p-4 bg-white/60 backdrop-blur rounded-xl border border-surface-200/50 text-center">
          <p className="text-xs text-surface-400 font-medium uppercase tracking-wider mb-1">Demo Credentials</p>
          <p className="text-xs text-surface-500">
            <span className="font-medium">Admin:</span> odoosankhanil@gmail.com
          </p>
        </div>
      </div>
    </div>
  );
}
