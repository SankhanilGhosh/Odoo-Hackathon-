'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function PayrollPage() {
  const [salary, setSalary] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: prof } = await supabase
        .from('employee_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (prof) {
        setProfile(prof);
        const { data: sal } = await supabase
          .from('salary_structures')
          .select('*')
          .eq('employee_id', prof.id)
          .single();
        setSalary(sal);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="skeleton h-8 w-48"></div>
        <div className="skeleton h-64 rounded-xl"></div>
      </div>
    );
  }

  if (!salary) {
    return (
      <div className="page-enter">
        <h1 className="text-2xl font-bold text-surface-900 mb-4">Payroll</h1>
        <div className="card card-body text-center py-12 text-surface-400">
          <p className="text-3xl mb-2">💰</p>
          <p className="text-sm">Salary structure not yet assigned. Contact HR.</p>
        </div>
      </div>
    );
  }

  const base = Number(salary.base_salary);
  const allowances = Number(salary.allowances);
  const deductions = Number(salary.deductions);
  const net = Number(salary.net_salary);

  return (
    <div className="page-enter space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Payroll</h1>
        <p className="text-surface-500 text-sm mt-1">Your current salary structure</p>
      </div>

      {/* Net Salary Highlight */}
      <div className="card overflow-hidden">
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-6 text-white">
          <p className="text-sm text-primary-100 uppercase tracking-wider">Monthly Net Salary</p>
          <p className="text-4xl font-bold mt-1">₹{net.toLocaleString('en-IN')}</p>
          <p className="text-sm text-primary-200 mt-2">{profile?.job_title} • {profile?.department}</p>
        </div>
      </div>

      {/* Breakdown */}
      <div className="card card-body space-y-4">
        <h2 className="font-semibold text-surface-900">Salary Breakdown</h2>

        <div className="space-y-3">
          <div className="flex justify-between items-center py-3 border-b border-surface-100">
            <div>
              <p className="font-medium text-surface-900">Base Salary</p>
              <p className="text-xs text-surface-500">Monthly fixed pay</p>
            </div>
            <span className="text-lg font-semibold text-surface-900">₹{base.toLocaleString('en-IN')}</span>
          </div>

          <div className="flex justify-between items-center py-3 border-b border-surface-100">
            <div>
              <p className="font-medium text-emerald-700">Allowances</p>
              <p className="text-xs text-surface-500">HRA, DA, Special allowances</p>
            </div>
            <span className="text-lg font-semibold text-emerald-600">+₹{allowances.toLocaleString('en-IN')}</span>
          </div>

          <div className="flex justify-between items-center py-3 border-b border-surface-100">
            <div>
              <p className="font-medium text-red-700">Deductions</p>
              <p className="text-xs text-surface-500">PF, Tax, Insurance</p>
            </div>
            <span className="text-lg font-semibold text-red-600">-₹{deductions.toLocaleString('en-IN')}</span>
          </div>

          <div className="flex justify-between items-center py-3 bg-primary-50 rounded-lg px-4 -mx-1">
            <div>
              <p className="font-bold text-primary-900">Net Salary</p>
              <p className="text-xs text-primary-600">Take-home pay</p>
            </div>
            <span className="text-2xl font-bold text-primary-700">₹{net.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      <p className="text-xs text-surface-400 text-center">
        Last updated: {new Date(salary.updated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
        {' • '}For changes, contact HR.
      </p>
    </div>
  );
}
