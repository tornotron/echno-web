"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Home } from "lucide-react"

interface BreadcrumbConfig {
  [key: string]: string
}

// Map of route segments to display names
const breadcrumbNameMap: BreadcrumbConfig = {
  dashboard: "Dashboard",
  profile: "Profile",
  login: "Login",
  settings: "Settings",
  users: "Users",
  admin: "Admin",
}

export function Breadcrumbs() {
  const pathname = usePathname()

  // Don't show breadcrumbs on home page or login page
  if (pathname === "/" || pathname === "/login") {
    return null
  }

  const pathSegments = pathname.split("/").filter((segment) => segment !== "")

  // If we're on dashboard, show just "Dashboard"
  if (pathname === "/dashboard") {
    return (
      <Breadcrumb className="text-base">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>Dashboard</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    )
  }

  // Build breadcrumb items starting with Dashboard
  const breadcrumbItems = pathSegments.map((segment, index) => {
    const href = "/" + pathSegments.slice(0, index + 1).join("/")
    const isLast = index === pathSegments.length - 1
    const label = breadcrumbNameMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)

    return {
      href,
      label,
      isLast,
    }
  })

  return (
    <Breadcrumb className="text-base">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/dashboard">Dashboard</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        {breadcrumbItems.map((item, index) => (
          <div key={item.href} className="flex items-center gap-1.5">
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {item.isLast ? (
                <BreadcrumbPage>{item.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link href={item.href}>{item.label}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </div>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
