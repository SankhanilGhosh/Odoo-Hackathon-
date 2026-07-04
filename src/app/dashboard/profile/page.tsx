'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { showToast } from '@/components/ui/toast';

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [salary, setSalary] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({ phone: '', address: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: prof } = await supabase
      .from('employee_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (prof) {
      setProfile(prof);
      setEditData({ phone: prof.phone || '', address: prof.address || '' });

      const { data: sal } = await supabase
        .from('salary_structures')
        .select('*')
        .eq('employee_id', prof.id)
        .single();
      setSalary(sal);
    }
    setLoading(false);
  }

  async function handleSave() {
    setSaving(true);
    const { error } = await supabase
      .from('employee_profiles')
      .update({ phone: editData.phone, address: editData.address })
      .eq('id', profile.id);

    if (error) {
      showToast('Failed to update profile', 'error');
    } else {
      showToast('Profile updated successfully', 'success');
      setProfile({ ...profile, ...editData });
      setEditing(false);
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="skeleton h-8 w-48"></div>
        <div className="skeleton h-64 rounded-xl"></div>
      </div>
    );
  }

  if (!profile) return <div className="text-center py-12 text-surface-500">Profile not found</div>;

  const infoRow = (label: string, value: string | null) => (
    <div className="flex justify-between py-3 border-b border-surface-100 last:border-0">
      <span className="text-sm text-surface-500">{label}</span>
      <span className="text-sm font-medium text-surface-900">{value || '—'}</span>
    </div>
  );

  return (
    <div className="page-enter space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">My Profile</h1>
          <p className="text-surface-500 text-sm mt-1">View and manage your personal information</p>
        </div>
        {!editing ? (
          <button onClick={() => setEditing(true)} className="btn-primary">
            ✏️ Edit Profile
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={() => setEditing(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>

      {/* Profile Header Card */}
      <div className="card card-body">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
            {profile.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-surface-900">{profile.full_name}</h2>
            <p className="text-primary-600 font-medium">{profile.job_title}</p>
            <p className="text-sm text-surface-500">{profile.department} • {profile.employee_id}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Details */}
        <div className="card card-body">
          <h3 className="font-semibold text-surface-900 mb-3">Personal Information</h3>
          {infoRow('Email', profile.email)}
          {editing ? (
            <>
              <div className="py-3 border-b border-surface-100">
                <label className="label">Phone</label>
                <input
                  className="input"
                  value={editData.phone}
                  onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                  placeholder="Enter phone number"
                />
              </div>
              <div className="py-3">
                <label className="label">Address</label>
                <textarea
                  className="input"
                  rows={2}
                  value={editData.address}
                  onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                  placeholder="Enter address"
                />
              </div>
            </>
          ) : (
            <>
              {infoRow('Phone', profile.phone)}
              {infoRow('Address', profile.address)}
            </>
          )}
        </div>

        {/* Job Details */}
        <div className="card card-body">
          <h3 className="font-semibold text-surface-900 mb-3">Job Details</h3>
          {infoRow('Employee ID', profile.employee_id)}
          {infoRow('Job Title', profile.job_title)}
          {infoRow('Department', profile.department)}
          {infoRow('Date Joined', new Date(profile.date_joined).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }))}
          {infoRow('Role', profile.role === 'admin' ? 'Administrator' : 'Employee')}
        </div>
      </div>

      {/* Salary Structure (Read Only) */}
      {salary && (
        <div className="card card-body">
          <h3 className="font-semibold text-surface-900 mb-3">Salary Structure</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-surface-50 rounded-lg">
              <p className="text-xs text-surface-500 uppercase tracking-wider">Base Salary</p>
              <p className="text-lg font-bold text-surface-900 mt-1">₹{Number(salary.base_salary).toLocaleString('en-IN')}</p>
            </div>
            <div className="text-center p-4 bg-emerald-50 rounded-lg">
              <p className="text-xs text-surface-500 uppercase tracking-wider">Allowances</p>
              <p className="text-lg font-bold text-emerald-700 mt-1">+₹{Number(salary.allowances).toLocaleString('en-IN')}</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-xs text-surface-500 uppercase tracking-wider">Deductions</p>
              <p className="text-lg font-bold text-red-700 mt-1">-₹{Number(salary.deductions).toLocaleString('en-IN')}</p>
            </div>
            <div className="text-center p-4 bg-primary-50 rounded-lg">
              <p className="text-xs text-surface-500 uppercase tracking-wider">Net Salary</p>
              <p className="text-lg font-bold text-primary-700 mt-1">₹{Number(salary.net_salary).toLocaleString('en-IN')}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
