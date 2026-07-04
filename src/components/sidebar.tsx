'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { UserRole } from '@/lib/types';

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

const employeeNav: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: '🏠' },
  { label: 'Profile', href: '/dashboard/profile', icon: '👤' },
  { label: 'Attendance', href: '/dashboard/attendance', icon: '📋' },
  { label: 'Leave', href: '/dashboard/leave', icon: '🏖️' },
  { label: 'Payroll', href: '/dashboard/payroll', icon: '💰' },
];

const adminNav: NavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: '📊' },
  { label: 'Employees', href: '/admin/employees', icon: '👥' },
  { label: 'Attendance', href: '/admin/attendance', icon: '📋' },
  { label: 'Leave Approvals', href: '/admin/leave-approvals', icon: '✅' },
  { label: 'Payroll', href: '/admin/payroll', icon: '💰' },
];

interface SidebarProps {
  role: UserRole;
  userName?: string;
}

export default function Sidebar({ role, userName }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const navItems = role === 'admin' ? adminNav : employeeNav;

  const handleLogout = async () => {
    setLoggingOut(true);
    await supabase.auth.signOut();
    document.cookie = 'hrms_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    router.push('/sign-in');
  };

  const isActive = (href: string) => {
    if (href === '/dashboard' || href === '/admin') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <aside className={`flex flex-col h-screen bg-white border-r border-surface-200 transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'} flex-shrink-0`}>
      {/* Logo / Header */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-surface-200">
        <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          H
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="font-bold text-surface-900 text-sm tracking-tight">HRMS</h1>
            <p className="text-[10px] text-surface-400 uppercase tracking-wider">
              {role === 'admin' ? 'Admin Panel' : 'Employee Portal'}
            </p>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto text-surface-400 hover:text-surface-600 transition-colors p-1"
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              isActive(item.href)
                ? 'bg-primary-50 text-primary-700 shadow-sm'
                : 'text-surface-600 hover:bg-surface-50 hover:text-surface-900'
            }`}
            title={collapsed ? item.label : undefined}
          >
            <span className="text-base flex-shrink-0">{item.icon}</span>
            {!collapsed && <span>{item.label}</span>}
          </Link>
        ))}
      </nav>

      {/* User / Logout */}
      <div className="p-3 border-t border-surface-200">
        {!collapsed && userName && (
          <div className="px-3 py-2 mb-2">
            <p className="text-xs text-surface-400">Logged in as</p>
            <p className="text-sm font-medium text-surface-700 truncate">{userName}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-all duration-200 ${
            collapsed ? 'justify-center' : ''
          }`}
          title="Logout"
        >
          <span className="text-base flex-shrink-0">🚪</span>
          {!collapsed && <span>{loggingOut ? 'Logging out...' : 'Logout'}</span>}
        </button>
      </div>
    </aside>
  );
}
