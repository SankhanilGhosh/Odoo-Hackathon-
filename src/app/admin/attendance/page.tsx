'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminAttendancePage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<any[]>([]);
  const [todayRecords, setTodayRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ present: 0, absent: 0, halfDay: 0, leave: 0 });

  useEffect(() => {
    fetchEmployees();
    fetchTodayOverview();
  }, []);

  useEffect(() => {
    if (selectedEmployee) fetchEmployeeAttendance();
  }, [selectedEmployee, currentMonth]);

  async function fetchEmployees() {
    const { data } = await supabase
      .from('employee_profiles')
      .select('id, full_name, employee_id, department')
      .order('employee_id');
    setEmployees(data || []);
    setLoading(false);
  }

  async function fetchTodayOverview() {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('attendance')
      .select('*, employee_profiles(full_name, employee_id, department)')
      .eq('date', today)
      .order('check_in', { ascending: false });
    setTodayRecords(data || []);
  }

  async function fetchEmployeeAttendance() {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const startDate = new Date(year, month, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

    const { data: records } = await supabase
      .from('attendance')
      .select('*')
      .eq('employee_id', selectedEmployee)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date');

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: any[] = [];
    let present = 0, absent = 0, halfDay = 0, leave = 0;

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const record = records?.find(r => r.date === dateStr);
      days.push({ date: dateStr, status: record?.status || null, checkIn: record?.check_in, checkOut: record?.check_out });
      if (record) {
        if (record.status === 'present') present++;
        else if (record.status === 'absent') absent++;
        else if (record.status === 'half-day') halfDay++;
        else if (record.status === 'leave') leave++;
      }
    }
    setCalendarDays(days);
    setStats({ present, absent, halfDay, leave });
  }

  const statusColor = (status: string | null) => {
    const map: Record<string, string> = {
      present: 'bg-emerald-100 text-emerald-700 border-emerald-300',
      absent: 'bg-red-100 text-red-700 border-red-300',
      'half-day': 'bg-amber-100 text-amber-700 border-amber-300',
      leave: 'bg-blue-100 text-blue-700 border-blue-300',
    };
    return status ? map[status] || '' : '';
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date().toISOString().split('T')[0];

  if (loading) {
    return <div className="space-y-6 animate-pulse"><div className="skeleton h-8 w-48"></div><div className="skeleton h-96 rounded-xl"></div></div>;
  }

  return (
    <div className="page-enter space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Attendance Management</h1>
        <p className="text-surface-500 text-sm mt-1">Organization-wide attendance tracking</p>
      </div>

      {/* Today's Overview */}
      <div className="card">
        <div className="p-4 border-b border-surface-200">
          <h2 className="font-semibold text-surface-900">Today&apos;s Attendance — {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</h2>
        </div>
        {todayRecords.length === 0 ? (
          <div className="text-center py-8 text-surface-400 text-sm">No attendance records for today yet</div>
        ) : (
          <div className="table-container border-0">
            <table className="table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Status</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                </tr>
              </thead>
              <tbody>
                {todayRecords.map(rec => (
                  <tr key={rec.id}>
                    <td>
                      <div>
                        <p className="font-medium text-surface-900">{rec.employee_profiles?.full_name}</p>
                        <p className="text-xs text-surface-500">{rec.employee_profiles?.department}</p>
                      </div>
                    </td>
                    <td><span className={`badge ${statusColor(rec.status)} border`}>{rec.status}</span></td>
                    <td className="text-sm">{rec.check_in ? new Date(rec.check_in).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                    <td className="text-sm">{rec.check_out ? new Date(rec.check_out).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Employee Calendar View */}
      <div className="card card-body">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <h2 className="font-semibold text-surface-900">Individual Employee View</h2>
          <select
            className="input w-auto"
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
          >
            <option value="">Select an employee...</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>
                {emp.full_name} ({emp.employee_id})
              </option>
            ))}
          </select>
        </div>

        {selectedEmployee ? (
          <>
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))} className="btn-ghost btn-sm">← Prev</button>
              <h3 className="font-medium text-surface-700">
                {currentMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
              </h3>
              <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))} className="btn-ghost btn-sm">Next →</button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-3 mb-4">
              <div className="text-center p-2 bg-emerald-50 rounded-lg"><p className="text-xs text-surface-500">Present</p><p className="font-bold text-emerald-600">{stats.present}</p></div>
              <div className="text-center p-2 bg-red-50 rounded-lg"><p className="text-xs text-surface-500">Absent</p><p className="font-bold text-red-600">{stats.absent}</p></div>
              <div className="text-center p-2 bg-amber-50 rounded-lg"><p className="text-xs text-surface-500">Half Day</p><p className="font-bold text-amber-600">{stats.halfDay}</p></div>
              <div className="text-center p-2 bg-blue-50 rounded-lg"><p className="text-xs text-surface-500">Leave</p><p className="font-bold text-blue-600">{stats.leave}</p></div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {dayNames.map(d => (
                <div key={d} className="text-center text-xs font-semibold text-surface-500 py-2">{d}</div>
              ))}
              {Array.from({ length: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay() }).map((_, i) => (
                <div key={`e-${i}`} className="aspect-square"></div>
              ))}
              {calendarDays.map(day => {
                const isToday = day.date === today;
                const isWeekend = [0, 6].includes(new Date(day.date).getDay());
                return (
                  <div
                    key={day.date}
                    className={`aspect-square rounded-lg border flex flex-col items-center justify-center text-xs transition-all
                      ${isToday ? 'ring-2 ring-primary-500 ring-offset-1' : ''}
                      ${day.status ? statusColor(day.status) : isWeekend ? 'bg-surface-50 text-surface-400 border-surface-200' : 'bg-white text-surface-600 border-surface-200'}
                    `}
                  >
                    <span className="font-medium">{parseInt(day.date.split('-')[2])}</span>
                    {day.status && <span className="text-[9px] mt-0.5 uppercase font-semibold">{day.status === 'half-day' ? 'Half' : day.status.slice(0, 3)}</span>}
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-surface-400 text-sm">
            <p className="text-2xl mb-2">👆</p>
            Select an employee to view their attendance calendar
          </div>
        )}
      </div>
    </div>
  );
}
