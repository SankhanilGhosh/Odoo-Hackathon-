'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { showToast } from '@/components/ui/toast';

type AttendanceStatus = 'present' | 'absent' | 'half-day' | 'leave';

interface DayData {
  date: string;
  status: AttendanceStatus | null;
  checkIn: string | null;
  checkOut: string | null;
}

export default function AttendancePage() {
  const [profile, setProfile] = useState<any>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<DayData[]>([]);
  const [todayRecord, setTodayRecord] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [stats, setStats] = useState({ present: 0, absent: 0, halfDay: 0, leave: 0 });

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (profile) fetchAttendance();
  }, [profile, currentMonth]);

  async function fetchProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('employee_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();
    setProfile(data);
  }

  async function fetchAttendance() {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const startDate = new Date(year, month, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

    const { data: records } = await supabase
      .from('attendance')
      .select('*')
      .eq('employee_id', profile.id)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date');

    // Build calendar
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: DayData[] = [];
    let present = 0, absent = 0, halfDay = 0, leave = 0;

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const record = records?.find(r => r.date === dateStr);
      days.push({
        date: dateStr,
        status: record?.status || null,
        checkIn: record?.check_in || null,
        checkOut: record?.check_out || null,
      });
      if (record) {
        if (record.status === 'present') present++;
        else if (record.status === 'absent') absent++;
        else if (record.status === 'half-day') halfDay++;
        else if (record.status === 'leave') leave++;
      }
    }

    setCalendarDays(days);
    setStats({ present, absent, halfDay, leave });

    // Check today's record
    const today = new Date().toISOString().split('T')[0];
    const todayRec = records?.find(r => r.date === today);
    setTodayRecord(todayRec || null);
    setLoading(false);
  }

  async function handleCheckIn() {
    setCheckingIn(true);
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toISOString();

    const { error } = await supabase
      .from('attendance')
      .upsert({
        employee_id: profile.id,
        date: today,
        status: 'present',
        check_in: now,
      }, { onConflict: 'employee_id,date' });

    if (error) {
      showToast('Failed to check in', 'error');
    } else {
      showToast('Checked in successfully!', 'success');
      fetchAttendance();
    }
    setCheckingIn(false);
  }

  async function handleCheckOut() {
    setCheckingIn(true);
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toISOString();

    const { error } = await supabase
      .from('attendance')
      .update({ check_out: now })
      .eq('employee_id', profile.id)
      .eq('date', today);

    if (error) {
      showToast('Failed to check out', 'error');
    } else {
      showToast('Checked out successfully!', 'success');
      fetchAttendance();
    }
    setCheckingIn(false);
  }

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));

  const statusColor = (status: AttendanceStatus | null) => {
    const map: Record<string, string> = {
      present: 'bg-emerald-100 text-emerald-700 border-emerald-300',
      absent: 'bg-red-100 text-red-700 border-red-300',
      'half-day': 'bg-amber-100 text-amber-700 border-amber-300',
      leave: 'bg-blue-100 text-blue-700 border-blue-300',
    };
    return status ? map[status] || '' : '';
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="skeleton h-8 w-48"></div>
        <div className="skeleton h-20 rounded-xl"></div>
        <div className="skeleton h-96 rounded-xl"></div>
      </div>
    );
  }

  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="page-enter space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Attendance</h1>
        <p className="text-surface-500 text-sm mt-1">Track your daily attendance and working hours</p>
      </div>

      {/* Check In/Out Card */}
      <div className="card card-body">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-sm text-surface-500">Today — {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
            {todayRecord?.check_in && (
              <p className="text-xs text-surface-400 mt-1">
                Checked in at {new Date(todayRecord.check_in).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                {todayRecord?.check_out && ` • Checked out at ${new Date(todayRecord.check_out).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            {!todayRecord?.check_in ? (
              <button onClick={handleCheckIn} disabled={checkingIn} className="btn-success btn-lg">
                {checkingIn ? '⏳ Processing...' : '🟢 Check In'}
              </button>
            ) : !todayRecord?.check_out ? (
              <button onClick={handleCheckOut} disabled={checkingIn} className="btn-danger btn-lg">
                {checkingIn ? '⏳ Processing...' : '🔴 Check Out'}
              </button>
            ) : (
              <span className="badge-success text-sm px-4 py-2">✅ Day Complete</span>
            )}
          </div>
        </div>
      </div>

      {/* Monthly Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <span className="stat-label">Present</span>
          <span className="stat-value text-emerald-600">{stats.present}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Absent</span>
          <span className="stat-value text-red-600">{stats.absent}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Half Days</span>
          <span className="stat-value text-amber-600">{stats.halfDay}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">On Leave</span>
          <span className="stat-value text-blue-600">{stats.leave}</span>
        </div>
      </div>

      {/* Calendar */}
      <div className="card card-body">
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="btn-ghost btn-sm">← Prev</button>
          <h2 className="font-semibold text-surface-900">
            {currentMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
          </h2>
          <button onClick={nextMonth} className="btn-ghost btn-sm">Next →</button>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {dayNames.map(d => (
            <div key={d} className="text-center text-xs font-semibold text-surface-500 py-2">{d}</div>
          ))}
          {/* Empty cells for first day offset */}
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square"></div>
          ))}
          {/* Calendar days */}
          {calendarDays.map((day) => {
            const isToday = day.date === today;
            const isWeekend = [0, 6].includes(new Date(day.date).getDay());
            return (
              <div
                key={day.date}
                className={`aspect-square rounded-lg border flex flex-col items-center justify-center text-xs transition-all
                  ${isToday ? 'ring-2 ring-primary-500 ring-offset-1' : ''}
                  ${day.status ? statusColor(day.status) : isWeekend ? 'bg-surface-50 text-surface-400 border-surface-200' : 'bg-white text-surface-600 border-surface-200'}
                `}
                title={day.status ? `${day.date}: ${day.status}` : day.date}
              >
                <span className="font-medium">{parseInt(day.date.split('-')[2])}</span>
                {day.status && (
                  <span className="text-[9px] mt-0.5 uppercase font-semibold tracking-wider">
                    {day.status === 'half-day' ? 'Half' : day.status.slice(0, 3)}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-surface-100">
          {[
            { label: 'Present', color: 'bg-emerald-100 border-emerald-300' },
            { label: 'Absent', color: 'bg-red-100 border-red-300' },
            { label: 'Half Day', color: 'bg-amber-100 border-amber-300' },
            { label: 'Leave', color: 'bg-blue-100 border-blue-300' },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded border ${l.color}`}></div>
              <span className="text-xs text-surface-500">{l.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
