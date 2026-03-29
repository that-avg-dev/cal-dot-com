"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Calendar, Clock, Settings, LinkIcon, Menu } from "lucide-react"
import { useIsMobile } from "@/components/ui/use-mobile"
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

const navItems = [
  { href: "/event-types", label: "Event Types", icon: LinkIcon },
  { href: "/availability", label: "Availability", icon: Clock },
  { href: "/bookings", label: "Bookings", icon: Calendar },
  { href: "/settings", label: "Settings", icon: Settings },
]

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()

  return (
    <>
      <div className="p-6 border-b border-border">
        <Link
          href="/event-types"
          className="flex items-center gap-2"
          onClick={onNavigate}
        >
          <div className="w-8 h-8 bg-foreground rounded-md flex items-center justify-center">
            <Calendar className="w-5 h-5 text-background" />
          </div>
          <span className="text-xl font-semibold">Cal Clone</span>
        </Link>
      </div>
      <nav className="p-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </>
  )
}

export function DashboardSidebar() {
  const isMobile = useIsMobile()
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // Close the sheet when the route changes on mobile
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  if (isMobile) {
    return (
      <>
        {/* Mobile top bar */}
        <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-border bg-card px-4 py-3">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button
                id="mobile-menu-toggle"
                aria-label="Open menu"
                className="inline-flex items-center justify-center rounded-md p-2 text-foreground hover:bg-secondary transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <SidebarContent onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
          <Link href="/event-types" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-foreground rounded-md flex items-center justify-center">
              <Calendar className="w-4 h-4 text-background" />
            </div>
            <span className="text-lg font-semibold">Cal Clone</span>
          </Link>
        </header>
      </>
    )
  }

  // Desktop sidebar
  return (
    <aside className="w-64 border-r border-border bg-card min-h-screen shrink-0">
      <SidebarContent />
    </aside>
  )
}
