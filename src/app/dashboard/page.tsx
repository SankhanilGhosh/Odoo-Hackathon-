'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface QuickStat {
  label: string;
  value: string;
  icon: string;
  href: string;
  color: string;
}

interface ActivityItem {
  id: string;
  type: 'attendance' | 'leave';
  description: string;
  date: string;
  status: string;
}

export default function EmployeeDashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [stats, setStats] = useState<QuickStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkedIn, setCheckedIn] = useState(false);

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

    if (!prof) return;
    setProfile(prof);

    // Check if already checked in today
    const today = new Date().toISOString().split('T')[0];
    const { data: todayAtt } = await supabase
      .from('attendance')
      .select('*')
      .eq('employee_id', prof.id)
      .eq('date', today)
      .single();

    setCheckedIn(!!todayAtt?.check_in);

    // Fetch recent attendance
    const { data: recentAtt } = await supabase
      .from('attendance')
      .select('*')
      .eq('employee_id', prof.id)
      .order('date', { ascending: false })
      .limit(5);

    // Fetch recent leave requests
    const { data: recentLeave } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('employee_id', prof.id)
      .order('created_at', { ascending: false })
      .limit(5);

    // Count stats
    const { count: presentDays } = await supabase
      .from('attendance')
      .select('*', { count: 'exact', head: true })
      .eq('employee_id', prof.id)
      .eq('status', 'present');

    const { count: pendingLeaves } = await supabase
      .from('leave_requests')
      .select('*', { count: 'exact', head: true })
      .eq('employee_id', prof.id)
      .eq('status', 'pending');

    setStats([
      { label: 'Days Present', value: String(presentDays || 0), icon: '✅', href: '/dashboard/attendance', color: 'from-emerald-500 to-emerald-600' },
      { label: 'Pending Leaves', value: String(pendingLeaves || 0), icon: '⏳', href: '/dashboard/leave', color: 'from-amber-500 to-amber-600' },
      { label: 'Department', value: prof.department, icon: '🏢', href: '/dashboard/profile', color: 'from-blue-500 to-blue-600' },
      { label: 'Status', value: checkedIn ? 'Checked In' : 'Not Checked In', icon: checkedIn ? '🟢' : '🔴', href: '/dashboard/attendance', color: 'from-primary-500 to-primary-600' },
    ]);

    // Merge activities
    const acts: ActivityItem[] = [];
    recentAtt?.forEach(a => {
      acts.push({
        id: a.id,
        type: 'attendance',
        description: `Attendance marked as ${a.status}`,
        date: a.date,
        status: a.status,
      });
    });
    recentLeave?.forEach(l => {
      acts.push({
        id: l.id,
        type: 'leave',
        description: `${l.leave_type} leave request — ${l.status}`,
        date: l.created_at,
        status: l.status,
      });
    });
    acts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setActivities(acts.slice(0, 7));
    setLoading(false);
  }

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      present: 'badge-success',
      absent: 'badge-danger',
      'half-day': 'badge-warning',
      leave: 'badge-info',
      pending: 'badge-warning',
      approved: 'badge-success',
      rejected: 'badge-danger',
    };
    return map[status] || 'badge-neutral';
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="skeleton h-8 w-64"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="skeleton h-28 rounded-xl"></div>)}
        </div>
        <div className="skeleton h-64 rounded-xl"></div>
      </div>
    );
  }

  return (
    <div className="page-enter space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-surface-900">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {profile?.full_name?.split(' ')[0]} 👋
        </h1>
        <p className="text-surface-500 text-sm mt-1">Here&apos;s what&apos;s happening with your work today.</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <Link key={i} href={stat.href} className="card card-body group hover:scale-[1.02] transition-transform duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-surface-500">{stat.label}</p>
                <p className="text-xl font-bold text-surface-900 mt-1">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center text-xl shadow-md group-hover:scale-110 transition-transform`}>
                {stat.icon}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="card card-body space-y-3">
          <h2 className="font-semibold text-surface-900">Quick Actions</h2>
          <Link href="/dashboard/attendance" className="btn-primary w-full">
            📋 {checkedIn ? 'View Attendance' : 'Check In Now'}
          </Link>
          <Link href="/dashboard/leave" className="btn-secondary w-full">
            🏖️ Apply for Leave
          </Link>
          <Link href="/dashboard/profile" className="btn-ghost w-full border border-surface-200">
            👤 Edit Profile
          </Link>
          <Link href="/dashboard/payroll" className="btn-ghost w-full border border-surface-200">
            💰 View Payroll
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="card card-body lg:col-span-2">
          <h2 className="font-semibold text-surface-900 mb-4">Recent Activity</h2>
          {activities.length === 0 ? (
            <div className="text-center py-8 text-surface-400">
              <p className="text-3xl mb-2">📭</p>
              <p className="text-sm">No recent activity</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activities.map(act => (
                <div key={act.id} className="flex items-center justify-between py-2 border-b border-surface-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{act.type === 'attendance' ? '📋' : '🏖️'}</span>
                    <div>
                      <p className="text-sm text-surface-700">{act.description}</p>
                      <p className="text-xs text-surface-400">{new Date(act.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                  </div>
                  <span className={statusBadge(act.status)}>{act.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
