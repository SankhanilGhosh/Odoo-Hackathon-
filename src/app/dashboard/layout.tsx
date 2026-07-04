'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/sidebar';
import { ToastProvider } from '@/components/ui/toast';
import { supabase } from '@/lib/supabase';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [userName, setUserName] = useState('');

  useEffect(() => {
    async function fetchUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('employee_profiles')
          .select('full_name')
          .eq('user_id', user.id)
          .single();
        if (profile) setUserName(profile.full_name);
      }
    }
    fetchUser();
  }, []);

  return (
    <div className="flex h-screen bg-surface-50">
      <Sidebar role="employee" userName={userName} />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
      <ToastProvider />
    </div>
  );
}
