import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'HRMS — Human Resource Management',
  description: 'Modern HR Management System for employee management, attendance tracking, leave management, and payroll.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen">
        {children}
        <div id="toast-root" className="toast-container"></div>
      </body>
    </html>
  );
}
