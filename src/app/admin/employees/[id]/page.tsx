'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { showToast } from '@/components/ui/toast';

export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [employee, setEmployee] = useState<any>(null);
  const [salary, setSalary] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmployee();
  }, [params.id]);

  async function fetchEmployee() {
    const { data: emp } = await supabase
      .from('employee_profiles')
      .select('*')
      .eq('id', params.id)
      .single();

    if (emp) {
      setEmployee(emp);
      setEditData(emp);

      const { data: sal } = await supabase
        .from('salary_structures')
        .select('*')
        .eq('employee_id', emp.id)
        .single();
      setSalary(sal);
    }
    setLoading(false);
  }

  async function handleSave() {
    setSaving(true);
    const { error } = await supabase
      .from('employee_profiles')
      .update({
        full_name: editData.full_name,
        phone: editData.phone,
        address: editData.address,
        job_title: editData.job_title,
        department: editData.department,
      })
      .eq('id', employee.id);

    if (error) {
      showToast('Failed to update employee', 'error');
    } else {
      showToast('Employee updated successfully', 'success');
      setEmployee({ ...employee, ...editData });
      setEditing(false);
    }
    setSaving(false);
  }

  if (loading) {
    return <div className="space-y-6 animate-pulse"><div className="skeleton h-8 w-48"></div><div className="skeleton h-64 rounded-xl"></div></div>;
  }

  if (!employee) {
    return <div className="text-center py-12 text-surface-500">Employee not found</div>;
  }

  const field = (label: string, key: string, editable = true) => (
    <div className="flex justify-between items-center py-3 border-b border-surface-100 last:border-0">
      <span className="text-sm text-surface-500">{label}</span>
      {editing && editable ? (
        <input
          className="input w-48 text-right"
          value={editData[key] || ''}
          onChange={(e) => setEditData({ ...editData, [key]: e.target.value })}
        />
      ) : (
        <span className="text-sm font-medium text-surface-900">{employee[key] || '—'}</span>
      )}
    </div>
  );

  return (
    <div className="page-enter space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/admin/employees')} className="btn-ghost btn-sm">← Back</button>
          <div>
            <h1 className="text-2xl font-bold text-surface-900">{employee.full_name}</h1>
            <p className="text-surface-500 text-sm">{employee.employee_id} • {employee.department}</p>
          </div>
        </div>
        {!editing ? (
          <button onClick={() => setEditing(true)} className="btn-primary">✏️ Edit</button>
        ) : (
          <div className="flex gap-2">
            <button onClick={() => { setEditing(false); setEditData(employee); }} className="btn-secondary">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        )}
      </div>

      {/* Profile Header */}
      <div className="card card-body flex items-center gap-4">
        <div className="w-20 h-20 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
          {employee.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
        </div>
        <div>
          <h2 className="text-xl font-bold text-surface-900">{employee.full_name}</h2>
          <p className="text-primary-600 font-medium">{employee.job_title}</p>
          <p className="text-sm text-surface-500">{employee.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card card-body">
          <h3 className="font-semibold text-surface-900 mb-3">Personal Details</h3>
          {field('Full Name', 'full_name')}
          {field('Email', 'email', false)}
          {field('Phone', 'phone')}
          {field('Address', 'address')}
        </div>
        <div className="card card-body">
          <h3 className="font-semibold text-surface-900 mb-3">Job Details</h3>
          {field('Employee ID', 'employee_id', false)}
          {field('Job Title', 'job_title')}
          {field('Department', 'department')}
          {field('Date Joined', 'date_joined', false)}
          {field('Role', 'role', false)}
        </div>
      </div>

      {salary && (
        <div className="card card-body">
          <h3 className="font-semibold text-surface-900 mb-3">Salary Structure</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-surface-50 rounded-lg">
              <p className="text-xs text-surface-500 uppercase">Base Salary</p>
              <p className="text-lg font-bold text-surface-900 mt-1">₹{Number(salary.base_salary).toLocaleString('en-IN')}</p>
            </div>
            <div className="text-center p-4 bg-emerald-50 rounded-lg">
              <p className="text-xs text-surface-500 uppercase">Allowances</p>
              <p className="text-lg font-bold text-emerald-700 mt-1">+₹{Number(salary.allowances).toLocaleString('en-IN')}</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-xs text-surface-500 uppercase">Deductions</p>
              <p className="text-lg font-bold text-red-700 mt-1">-₹{Number(salary.deductions).toLocaleString('en-IN')}</p>
            </div>
            <div className="text-center p-4 bg-primary-50 rounded-lg">
              <p className="text-xs text-surface-500 uppercase">Net Salary</p>
              <p className="text-lg font-bold text-primary-700 mt-1">₹{Number(salary.net_salary).toLocaleString('en-IN')}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
