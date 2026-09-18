import React from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#070d1e] text-slate-100 font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {children}
    </div>
  );
}
