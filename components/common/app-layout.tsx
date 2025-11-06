"use client"

import { OrganizationProvider } from "@/components/providers/organization-provider"
import { AppSidebar } from "@/components/common/sidebar"
import { Footer } from "@/components/common/footer"
import { UserMenu } from "@/components/common/user-menu"
import { OrganizationSelector } from "@/components/organization/organization-selector"
import { Breadcrumbs } from "@/components/common/breadcrumbs"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { useMemo } from "react"

const SIDEBAR_COOKIE_NAME = "sidebar_state"

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null
  return null
}

interface AppLayoutProps {
  children: React.ReactNode
  title?: string
}

function AppLayoutContent({ children, title }: AppLayoutProps) {
  return (
    <>
      <AppSidebar />
      <SidebarInset>
        {/* Header */}
        <header className="bg-background sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="flex flex-1 items-center justify-between">
            <Breadcrumbs />
            <div className="flex items-center gap-4">
              <OrganizationSelector />
              <UserMenu />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4">
          {children}
        </main>

        {/* Footer */}
        <Footer />
      </SidebarInset>
    </>
  )
}

export function AppLayout({ children, title }: AppLayoutProps) {
  // Read cookie value immediately (not in useEffect) to prevent flash
  const defaultOpen = useMemo(() => {
    const cookieValue = getCookie(SIDEBAR_COOKIE_NAME)
    // If cookie exists, use its value; otherwise default to true
    return cookieValue !== null ? cookieValue === 'true' : true
  }, [])

  return (
    <OrganizationProvider>
      <SidebarProvider defaultOpen={defaultOpen}>
        <AppLayoutContent title={title}>
          {children}
        </AppLayoutContent>
      </SidebarProvider>
    </OrganizationProvider>
  )
}
