'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [departments, setDepartments] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    let result = employees;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(e =>
        e.full_name.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        e.employee_id.toLowerCase().includes(q)
      );
    }
    if (deptFilter) {
      result = result.filter(e => e.department === deptFilter);
    }
    setFiltered(result);
  }, [search, deptFilter, employees]);

  async function fetchEmployees() {
    const { data } = await supabase
      .from('employee_profiles')
      .select('*')
      .order('employee_id');

    if (data) {
      setEmployees(data);
      setFiltered(data);
      const depts = [...new Set(data.map(e => e.department))];
      setDepartments(depts);
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="skeleton h-8 w-48"></div>
        <div className="skeleton h-12 rounded-xl"></div>
        <div className="skeleton h-96 rounded-xl"></div>
      </div>
    );
  }

  return (
    <div className="page-enter space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Employees</h1>
        <p className="text-surface-500 text-sm mt-1">{employees.length} total employees</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <input
            type="text"
            className="input"
            placeholder="Search by name, email, or employee ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input w-auto"
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
        >
          <option value="">All Departments</option>
          {departments.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {/* Employee Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>ID</th>
              <th>Department</th>
              <th>Job Title</th>
              <th>Role</th>
              <th>Joined</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-surface-400">
                  No employees found
                </td>
              </tr>
            ) : (
              filtered.map(emp => (
                <tr key={emp.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {emp.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-surface-900">{emp.full_name}</p>
                        <p className="text-xs text-surface-500">{emp.email}</p>
                      </div>
                    </div>
                  </td>
                  <td><span className="badge-neutral">{emp.employee_id}</span></td>
                  <td>{emp.department}</td>
                  <td>{emp.job_title}</td>
                  <td>
                    <span className={emp.role === 'admin' ? 'badge-info' : 'badge-neutral'}>
                      {emp.role}
                    </span>
                  </td>
                  <td className="text-sm text-surface-500">
                    {new Date(emp.date_joined).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td>
                    <Link href={`/admin/employees/${emp.id}`} className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                      View →
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
