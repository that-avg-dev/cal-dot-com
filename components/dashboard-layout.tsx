"use client"

import { DashboardSidebar } from "./dashboard-sidebar"

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <DashboardSidebar />
      <main className="flex-1 bg-background min-w-0">
        <div className="p-4 sm:p-6 md:p-8">{children}</div>
      </main>
    </div>
  )
}
