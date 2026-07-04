'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ totalEmployees: 0, presentToday: 0, absentToday: 0, pendingLeaves: 0 });
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [heatmapData, setHeatmapData] = useState<any[]>([]);
  const [recentLeaves, setRecentLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    const today = new Date().toISOString().split('T')[0];

    // Total employees (excluding admins)
    const { count: totalEmployees } = await supabase
      .from('employee_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'employee');

    // Today's attendance
    const { data: todayAtt } = await supabase
      .from('attendance')
      .select('status')
      .eq('date', today);

    const presentToday = todayAtt?.filter(a => a.status === 'present' || a.status === 'half-day').length || 0;
    const absentToday = (totalEmployees || 0) - presentToday;

    // Pending leaves
    const { count: pendingLeaves } = await supabase
      .from('leave_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    setStats({
      totalEmployees: totalEmployees || 0,
      presentToday,
      absentToday,
      pendingLeaves: pendingLeaves || 0,
    });

    // Weekly attendance chart (last 5 working days)
    const weekData: any[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayOfWeek = d.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) continue; // skip weekends
      const dateStr = d.toISOString().split('T')[0];

      const { data: dayAtt } = await supabase
        .from('attendance')
        .select('status')
        .eq('date', dateStr);

      weekData.push({
        day: d.toLocaleDateString('en-IN', { weekday: 'short' }),
        present: dayAtt?.filter(a => a.status === 'present').length || 0,
        absent: dayAtt?.filter(a => a.status === 'absent').length || 0,
        halfDay: dayAtt?.filter(a => a.status === 'half-day').length || 0,
      });
    }
    setWeeklyData(weekData);

    // Department heatmap
    const { data: employees } = await supabase
      .from('employee_profiles')
      .select('id, department')
      .eq('role', 'employee');

    const deptMap: Record<string, { total: number; present: number }> = {};
    if (employees) {
      for (const emp of employees) {
        if (!deptMap[emp.department]) deptMap[emp.department] = { total: 0, present: 0 };
        deptMap[emp.department].total++;

        const { data: att } = await supabase
          .from('attendance')
          .select('status')
          .eq('employee_id', emp.id)
          .eq('date', today)
          .single();

        if (att && (att.status === 'present' || att.status === 'half-day')) {
          deptMap[emp.department].present++;
        }
      }
    }
    setHeatmapData(Object.entries(deptMap).map(([dept, data]) => ({
      department: dept,
      ...data,
      percentage: data.total > 0 ? Math.round((data.present / data.total) * 100) : 0,
    })));

    // Recent pending leave requests
    const { data: leaves } = await supabase
      .from('leave_requests')
      .select('*, employee_profiles(full_name, department)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(5);
    setRecentLeaves(leaves || []);

    setLoading(false);
  }

  const getHeatColor = (pct: number) => {
    if (pct >= 80) return 'from-emerald-500 to-emerald-600';
    if (pct >= 50) return 'from-amber-500 to-amber-600';
    return 'from-red-500 to-red-600';
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="skeleton h-8 w-64"></div>
        <div className="grid grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="skeleton h-28 rounded-xl"></div>)}
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div className="skeleton h-72 rounded-xl"></div>
          <div className="skeleton h-72 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-enter space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Admin Dashboard</h1>
        <p className="text-surface-500 text-sm mt-1">Organization overview and key metrics</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Employees', value: stats.totalEmployees, icon: '👥', color: 'from-blue-500 to-blue-600', href: '/admin/employees' },
          { label: 'Present Today', value: stats.presentToday, icon: '✅', color: 'from-emerald-500 to-emerald-600', href: '/admin/attendance' },
          { label: 'Absent Today', value: stats.absentToday, icon: '❌', color: 'from-red-500 to-red-600', href: '/admin/attendance' },
          { label: 'Pending Leaves', value: stats.pendingLeaves, icon: '⏳', color: 'from-amber-500 to-amber-600', href: '/admin/leave-approvals' },
        ].map((stat, i) => (
          <Link key={i} href={stat.href} className="card card-body group hover:scale-[1.02] transition-transform duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-surface-500">{stat.label}</p>
                <p className="text-3xl font-bold text-surface-900 mt-1">{stat.value}</p>
              </div>
              <div className={`w-14 h-14 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center text-2xl shadow-md group-hover:scale-110 transition-transform`}>
                {stat.icon}
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Attendance Chart */}
        <div className="card card-body">
          <h2 className="font-semibold text-surface-900 mb-4">Weekly Attendance</h2>
          {weeklyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{
                    background: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="present" fill="#10b981" radius={[4, 4, 0, 0]} name="Present" />
                <Bar dataKey="absent" fill="#ef4444" radius={[4, 4, 0, 0]} name="Absent" />
                <Bar dataKey="halfDay" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Half Day" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-surface-400 text-sm">No attendance data for this week</div>
          )}
        </div>

        {/* Department Heatmap */}
        <div className="card card-body">
          <h2 className="font-semibold text-surface-900 mb-4">Department Attendance Today</h2>
          {heatmapData.length > 0 ? (
            <div className="space-y-3">
              {heatmapData.map(dept => (
                <div key={dept.department} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-surface-700">{dept.department}</span>
                    <span className="text-surface-500">{dept.present}/{dept.total} ({dept.percentage}%)</span>
                  </div>
                  <div className="w-full bg-surface-100 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${getHeatColor(dept.percentage)} rounded-full transition-all duration-500`}
                      style={{ width: `${dept.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-surface-400 text-sm">No department data available</div>
          )}
        </div>
      </div>

      {/* Pending Leave Requests */}
      <div className="card">
        <div className="p-4 border-b border-surface-200 flex items-center justify-between">
          <h2 className="font-semibold text-surface-900">Pending Leave Requests</h2>
          <Link href="/admin/leave-approvals" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
            View All →
          </Link>
        </div>
        {recentLeaves.length === 0 ? (
          <div className="text-center py-8 text-surface-400 text-sm">
            <p className="text-2xl mb-1">✅</p>
            No pending requests
          </div>
        ) : (
          <div className="divide-y divide-surface-100">
            {recentLeaves.map(leave => (
              <div key={leave.id} className="p-4 flex items-center justify-between hover:bg-surface-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-semibold text-sm">
                    {leave.employee_profiles?.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <p className="font-medium text-surface-900 text-sm">{leave.employee_profiles?.full_name}</p>
                    <p className="text-xs text-surface-500">
                      {leave.leave_type} leave • {new Date(leave.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} - {new Date(leave.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                </div>
                <span className="badge-warning">Pending</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
