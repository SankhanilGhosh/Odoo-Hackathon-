'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { showToast } from '@/components/ui/toast';

export default function LeavePage() {
  const [profile, setProfile] = useState<any>(null);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    leave_type: 'paid',
    start_date: '',
    end_date: '',
    remarks: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

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
      const { data: leaveData } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('employee_id', prof.id)
        .order('created_at', { ascending: false });
      setLeaves(leaveData || []);
    }
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setSubmitting(true);

    const { error } = await supabase.from('leave_requests').insert({
      employee_id: profile.id,
      leave_type: form.leave_type,
      start_date: form.start_date,
      end_date: form.end_date,
      remarks: form.remarks || null,
    });

    if (error) {
      showToast('Failed to submit leave request', 'error');
    } else {
      showToast('Leave request submitted successfully!', 'success');
      setShowForm(false);
      setForm({ leave_type: 'paid', start_date: '', end_date: '', remarks: '' });
      fetchData();
    }
    setSubmitting(false);
  }

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending: 'badge-warning',
      approved: 'badge-success',
      rejected: 'badge-danger',
    };
    return map[status] || 'badge-neutral';
  };

  const leaveTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      paid: '🏖️ Paid Leave',
      sick: '🤒 Sick Leave',
      unpaid: '📋 Unpaid Leave',
    };
    return map[type] || type;
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="skeleton h-8 w-48"></div>
        <div className="skeleton h-64 rounded-xl"></div>
      </div>
    );
  }

  return (
    <div className="page-enter space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Leave Management</h1>
          <p className="text-surface-500 text-sm mt-1">Apply for leave and track request status</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? '✕ Cancel' : '+ Apply for Leave'}
        </button>
      </div>

      {/* Leave Application Form */}
      {showForm && (
        <div className="card card-body animate-slide-up">
          <h2 className="font-semibold text-surface-900 mb-4">New Leave Application</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="label">Leave Type</label>
                <select
                  className="input"
                  value={form.leave_type}
                  onChange={(e) => setForm({ ...form, leave_type: e.target.value })}
                >
                  <option value="paid">Paid Leave</option>
                  <option value="sick">Sick Leave</option>
                  <option value="unpaid">Unpaid Leave</option>
                </select>
              </div>
              <div>
                <label className="label">Start Date</label>
                <input
                  type="date"
                  className="input"
                  value={form.start_date}
                  onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="label">End Date</label>
                <input
                  type="date"
                  className="input"
                  value={form.end_date}
                  onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                  min={form.start_date}
                  required
                />
              </div>
            </div>
            <div>
              <label className="label">Remarks (optional)</label>
              <textarea
                className="input"
                rows={3}
                value={form.remarks}
                onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                placeholder="Reason for leave..."
              />
            </div>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </form>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="stat-card">
          <span className="stat-label">Pending</span>
          <span className="stat-value text-amber-600">{leaves.filter(l => l.status === 'pending').length}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Approved</span>
          <span className="stat-value text-emerald-600">{leaves.filter(l => l.status === 'approved').length}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Rejected</span>
          <span className="stat-value text-red-600">{leaves.filter(l => l.status === 'rejected').length}</span>
        </div>
      </div>

      {/* Leave History */}
      <div className="card">
        <div className="p-4 border-b border-surface-200">
          <h2 className="font-semibold text-surface-900">Leave History</h2>
        </div>
        {leaves.length === 0 ? (
          <div className="text-center py-12 text-surface-400">
            <p className="text-3xl mb-2">🏖️</p>
            <p className="text-sm">No leave requests yet</p>
          </div>
        ) : (
          <div className="divide-y divide-surface-100">
            {leaves.map(leave => (
              <div key={leave.id} className="p-4 hover:bg-surface-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-surface-900">{leaveTypeLabel(leave.leave_type)}</span>
                      <span className={statusBadge(leave.status)}>{leave.status}</span>
                    </div>
                    <p className="text-sm text-surface-500">
                      {new Date(leave.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} — {new Date(leave.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    {leave.remarks && (
                      <p className="text-sm text-surface-600 italic">&ldquo;{leave.remarks}&rdquo;</p>
                    )}
                    {leave.admin_comment && (
                      <p className="text-xs text-primary-600 mt-1">
                        <span className="font-medium">HR Comment:</span> {leave.admin_comment}
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-surface-400">
                    {new Date(leave.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
