"use client"

import { SidebarProvider, useSidebar } from "@/components/providers/sidebar-provider"
import { Sidebar } from "@/components/common/sidebar"
import { Footer } from "@/components/common/footer"
import { UserMenu } from "@/components/common/user-menu"
import { Breadcrumbs } from "@/components/common/breadcrumbs"
import { cn } from "@/lib/utils/tailwind-utils"

interface AppLayoutProps {
  children: React.ReactNode
  title?: string
}

function AppLayoutContent({ children, title }: AppLayoutProps) {
  const { collapsed } = useSidebar()

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <Sidebar />
      
      {/* Main Content */}
      <div className={cn(
        "transition-all duration-300 ease-in-out min-h-screen flex flex-col",
        collapsed ? "md:pl-16" : "md:pl-64"
      )}>
        {/* Header */}
        <header className="bg-white dark:bg-black border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex justify-between items-center h-16 px-4">
            <div className="flex items-center">
              <Breadcrumbs />
            </div>
            <div className="flex items-center gap-4">
              <UserMenu />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1">
          {children}
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  )
}

export function AppLayout({ children, title }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <AppLayoutContent title={title}>
        {children}
      </AppLayoutContent>
    </SidebarProvider>
  )
}
