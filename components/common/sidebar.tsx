"use client"

import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils/tailwind-utils"
import {
  ChevronLeft,
  ChevronRight,
  Home,
  Users,
  Calendar,
  BarChart3,
  Settings,
  FileText,
  Clock,
  UserCheck,
  Menu,
  X,
  User
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSidebar } from "../providers/sidebar-provider"
import Image from "next/image"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Profile", href: "/profile", icon: User },
  { name: "Employees", href: "/dashboard/employees", icon: Users },
  { name: "Attendance", href: "/dashboard/attendance", icon: UserCheck },
  { name: "Time Tracking", href: "/dashboard/time-tracking", icon: Clock },
  { name: "Leave Requests", href: "/dashboard/leaves", icon: Calendar },
  { name: "Reports", href: "/dashboard/reports", icon: BarChart3 },
  { name: "Documents", href: "/dashboard/documents", icon: FileText },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
]

export function Sidebar() {
  const { data: session } = useSession()
  const { collapsed, setCollapsed, mobileOpen, setMobileOpen } = useSidebar()
  const pathname = usePathname()

  // Only show sidebar for authenticated users
  if (!session) {
    return null
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 h-8 w-8 p-0"
      >
        <Menu className="h-4 w-4" />
      </Button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div
        className={cn(
          "fixed left-0 top-0 z-40 h-screen bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 transition-all duration-300 ease-in-out",
          // Desktop: Always visible with collapse state
          collapsed ? "w-16" : "w-64",
          // Mobile: Only show when mobileOpen is true
          mobileOpen ? "block md:block" : "hidden md:block"
        )}
      >
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center space-x-2">
          {!collapsed && (
            <>
              <Image
                src="/echno.png"
                alt="Echno Logo"
                width={32}
                height={32}
                className="dark:invert"
              />
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">Echno</span>
            </>
          )}
          {collapsed && (
            <Image
              src="/echno.png"
              alt="Echno Logo"
              width={32}
              height={32}
              className="dark:invert mx-auto"
            />
          )}
        </div>
        {/* Mobile close button */}
        {mobileOpen && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMobileOpen(false)}
            className="h-8 w-8 p-0 hover:bg-zinc-100 dark:hover:bg-zinc-800 md:hidden ml-auto"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Desktop collapse button - On the border */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setCollapsed(!collapsed)}
        className="hidden md:flex absolute -right-3 top-20 h-6 w-6 p-0 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 shadow-sm z-50"
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </Button>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                collapsed ? "justify-center" : "space-x-3",
                isActive
                  ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100"
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          )
        })}
      </nav>

      {/* User Info */}
      {!collapsed && (
        <div className="border-t border-zinc-200 dark:border-zinc-800 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-linear-to-br from-zinc-400 to-zinc-600 rounded-full flex items-center justify-center">
              <span className="text-white font-medium text-sm">
                {session.user?.name?.charAt(0)?.toUpperCase() || "U"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                {session.user?.name || "User"}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                {session.user?.email || ""}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  )
}