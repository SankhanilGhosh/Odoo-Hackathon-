'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { showToast } from '@/components/ui/toast';

export default function LeaveApprovalsPage() {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [filter, setFilter] = useState('pending');
  const [commentMap, setCommentMap] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaves();
  }, [filter]);

  async function fetchLeaves() {
    setLoading(true);
    let query = supabase
      .from('leave_requests')
      .select('*, employee_profiles(full_name, department, employee_id)')
      .order('created_at', { ascending: false });

    if (filter !== 'all') {
      query = query.eq('status', filter);
    }

    const { data } = await query;
    setLeaves(data || []);
    setLoading(false);
  }

  async function handleAction(leaveId: string, action: 'approved' | 'rejected') {
    setProcessing(leaveId);
    const comment = commentMap[leaveId] || null;

    const { error } = await supabase
      .from('leave_requests')
      .update({ status: action, admin_comment: comment })
      .eq('id', leaveId);

    if (error) {
      showToast(`Failed to ${action === 'approved' ? 'approve' : 'reject'} leave`, 'error');
    } else {
      showToast(`Leave request ${action}!`, action === 'approved' ? 'success' : 'info');

      // If approved, mark attendance as 'leave' for those dates
      if (action === 'approved') {
        const leave = leaves.find(l => l.id === leaveId);
        if (leave) {
          const start = new Date(leave.start_date);
          const end = new Date(leave.end_date);
          for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dayOfWeek = d.getDay();
            if (dayOfWeek === 0 || dayOfWeek === 6) continue; // skip weekends
            const dateStr = d.toISOString().split('T')[0];
            await supabase.from('attendance').upsert({
              employee_id: leave.employee_id,
              date: dateStr,
              status: 'leave',
            }, { onConflict: 'employee_id,date' });
          }
        }
      }

      fetchLeaves();
    }
    setProcessing(null);
  }

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending: 'badge-warning',
      approved: 'badge-success',
      rejected: 'badge-danger',
    };
    return map[status] || 'badge-neutral';
  };

  const getDayCount = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    return Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  };

  return (
    <div className="page-enter space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Leave Approvals</h1>
        <p className="text-surface-500 text-sm mt-1">Review and manage employee leave requests</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {['pending', 'approved', 'rejected', 'all'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost border border-surface-200'}`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f === 'pending' && leaves.length > 0 && filter === 'pending' && (
              <span className="ml-1 bg-white/20 px-1.5 py-0.5 rounded-full text-[10px]">{leaves.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Leave Requests */}
      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="skeleton h-32 rounded-xl"></div>)}
        </div>
      ) : leaves.length === 0 ? (
        <div className="card card-body text-center py-12 text-surface-400">
          <p className="text-3xl mb-2">{filter === 'pending' ? '✅' : '📋'}</p>
          <p className="text-sm">No {filter === 'all' ? '' : filter} leave requests</p>
        </div>
      ) : (
        <div className="space-y-4">
          {leaves.map(leave => (
            <div key={leave.id} className="card card-body animate-fade-in">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {leave.employee_profiles?.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-surface-900">{leave.employee_profiles?.full_name}</h3>
                      <span className={statusBadge(leave.status)}>{leave.status}</span>
                    </div>
                    <p className="text-sm text-surface-500">
                      {leave.employee_profiles?.employee_id} • {leave.employee_profiles?.department}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-surface-600">
                      <span className="badge-neutral">
                        {leave.leave_type === 'paid' ? '🏖️' : leave.leave_type === 'sick' ? '🤒' : '📋'} {leave.leave_type} leave
                      </span>
                      <span>
                        {new Date(leave.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} — {new Date(leave.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      <span className="text-surface-400">({getDayCount(leave.start_date, leave.end_date)} days)</span>
                    </div>
                    {leave.remarks && (
                      <p className="text-sm text-surface-600 italic mt-1">&ldquo;{leave.remarks}&rdquo;</p>
                    )}
                    {leave.admin_comment && leave.status !== 'pending' && (
                      <p className="text-xs text-primary-600 mt-1">
                        <span className="font-medium">Your comment:</span> {leave.admin_comment}
                      </p>
                    )}
                  </div>
                </div>

                {leave.status === 'pending' && (
                  <div className="flex flex-col gap-2 ml-14 md:ml-0 min-w-[200px]">
                    <input
                      className="input text-xs"
                      placeholder="Add comment (optional)"
                      value={commentMap[leave.id] || ''}
                      onChange={(e) => setCommentMap({ ...commentMap, [leave.id]: e.target.value })}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAction(leave.id, 'approved')}
                        disabled={processing === leave.id}
                        className="btn-success btn-sm flex-1"
                      >
                        ✓ Approve
                      </button>
                      <button
                        onClick={() => handleAction(leave.id, 'rejected')}
                        disabled={processing === leave.id}
                        className="btn-danger btn-sm flex-1"
                      >
                        ✕ Reject
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
