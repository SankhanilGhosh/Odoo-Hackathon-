'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { showToast } from '@/components/ui/toast';

export default function AdminPayrollPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ base_salary: 0, allowances: 0, deductions: 0 });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayroll();
  }, []);

  async function fetchPayroll() {
    const { data } = await supabase
      .from('salary_structures')
      .select('*, employee_profiles(full_name, employee_id, department, job_title)')
      .order('updated_at', { ascending: false });
    setEmployees(data || []);
    setLoading(false);
  }

  function startEdit(emp: any) {
    setEditingId(emp.id);
    setEditData({
      base_salary: Number(emp.base_salary),
      allowances: Number(emp.allowances),
      deductions: Number(emp.deductions),
    });
  }

  async function handleSave(salaryId: string) {
    setSaving(true);
    const { error } = await supabase
      .from('salary_structures')
      .update({
        base_salary: editData.base_salary,
        allowances: editData.allowances,
        deductions: editData.deductions,
        updated_at: new Date().toISOString(),
      })
      .eq('id', salaryId);

    if (error) {
      showToast('Failed to update salary', 'error');
    } else {
      showToast('Salary updated successfully', 'success');
      setEditingId(null);
      fetchPayroll();
    }
    setSaving(false);
  }

  const fmt = (n: number) => `₹${n.toLocaleString('en-IN')}`;

  if (loading) {
    return <div className="space-y-6 animate-pulse"><div className="skeleton h-8 w-48"></div><div className="skeleton h-96 rounded-xl"></div></div>;
  }

  return (
    <div className="page-enter space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Payroll Management</h1>
        <p className="text-surface-500 text-sm mt-1">Manage salary structures for all employees</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="stat-card">
          <span className="stat-label">Total Monthly Payroll</span>
          <span className="stat-value text-primary-700">
            {fmt(employees.reduce((sum, e) => sum + Number(e.net_salary), 0))}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Avg. Net Salary</span>
          <span className="stat-value text-surface-700">
            {employees.length > 0 ? fmt(Math.round(employees.reduce((sum, e) => sum + Number(e.net_salary), 0) / employees.length)) : '₹0'}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Employees on Payroll</span>
          <span className="stat-value text-blue-600">{employees.length}</span>
        </div>
      </div>

      {/* Payroll Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Employee</th>
              <th className="text-right">Base Salary</th>
              <th className="text-right">Allowances</th>
              <th className="text-right">Deductions</th>
              <th className="text-right">Net Salary</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {employees.map(emp => (
              <tr key={emp.id}>
                <td>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {emp.employee_profiles?.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-surface-900">{emp.employee_profiles?.full_name}</p>
                      <p className="text-xs text-surface-500">{emp.employee_profiles?.department} • {emp.employee_profiles?.job_title}</p>
                    </div>
                  </div>
                </td>
                {editingId === emp.id ? (
                  <>
                    <td className="text-right">
                      <input type="number" className="input w-28 text-right text-sm" value={editData.base_salary} onChange={(e) => setEditData({ ...editData, base_salary: Number(e.target.value) })} />
                    </td>
                    <td className="text-right">
                      <input type="number" className="input w-28 text-right text-sm" value={editData.allowances} onChange={(e) => setEditData({ ...editData, allowances: Number(e.target.value) })} />
                    </td>
                    <td className="text-right">
                      <input type="number" className="input w-28 text-right text-sm" value={editData.deductions} onChange={(e) => setEditData({ ...editData, deductions: Number(e.target.value) })} />
                    </td>
                    <td className="text-right font-semibold text-primary-700">
                      {fmt(editData.base_salary + editData.allowances - editData.deductions)}
                    </td>
                    <td>
                      <div className="flex gap-1">
                        <button onClick={() => handleSave(emp.id)} disabled={saving} className="btn-success btn-sm">
                          {saving ? '...' : '✓'}
                        </button>
                        <button onClick={() => setEditingId(null)} className="btn-ghost btn-sm">✕</button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="text-right text-sm">{fmt(Number(emp.base_salary))}</td>
                    <td className="text-right text-sm text-emerald-600">+{fmt(Number(emp.allowances))}</td>
                    <td className="text-right text-sm text-red-600">-{fmt(Number(emp.deductions))}</td>
                    <td className="text-right font-semibold text-primary-700">{fmt(Number(emp.net_salary))}</td>
                    <td>
                      <button onClick={() => startEdit(emp)} className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                        Edit
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
