'use client';

import { OrganizationProvider } from '@/components/providers/organization-provider';
import { AppSidebar } from '@/features/common/components/sidebar';
import { MobileBottomNav } from '@/features/common/components/mobile-bottom-nav';
import { Footer } from '@/components/common/footer';
import { UserMenu } from '@/features/common/components/user-menu';
import { Breadcrumbs } from '@/features/common/components/breadcrumbs';
import {
  SidebarProvider,
  SidebarInset,
  useSidebar,
  SidebarTrigger,
} from '@/components/shadcn/sidebar';
import { Button } from '@/components/shadcn/button';
import { Settings, Building, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useUser } from '@/hooks/user/use-user';
import { useBreadcrumbData } from '@/hooks/use-breadcrumb-data';
import { useEffect } from 'react';

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  /** Slot for a floating chat widget — injected from the app layer to keep this component feature-agnostic. */
  floatingChat?: React.ReactNode;
}

const ORGANIZATIONS_PATH = '/users/dashboard/organizations';

function AppLayoutContent({ children, floatingChat }: AppLayoutProps) {
  const { state, toggleSidebar, isMobile } = useSidebar();
  const pathname = usePathname();
  const router = useRouter();
  const { data: user, isLoading: userLoading } = useUser();

  // Fetch data for breadcrumbs using custom hook
  const breadcrumbData = useBreadcrumbData();

  // Redirect to organizations page if user has no default organization
  useEffect(() => {
    if (userLoading || !user) return;
    if (
      !user.defaultOrganizationId &&
      !pathname.startsWith(ORGANIZATIONS_PATH)
    ) {
      router.replace(ORGANIZATIONS_PATH);
    }
  }, [user, userLoading, pathname, router]);

  return (
    <>
      <AppSidebar />

      {/* Floating Toggle Button - Fixed to Sidebar Border - Desktop Only */}
      {!isMobile && (
        <button
          onClick={toggleSidebar}
          className="fixed top-16 z-50 flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-stone-200 bg-white shadow-sm transition-all duration-200 hover:border-indigo-300 hover:bg-indigo-50 active:scale-95 dark:border-white/10 dark:bg-zinc-900 dark:hover:border-indigo-500/40 dark:hover:bg-indigo-500/10"
          aria-label="Toggle sidebar"
          style={{
            left:
              state === 'expanded'
                ? 'var(--sidebar-width)'
                : 'var(--sidebar-width-icon)',
          }}
        >
          {state === 'expanded' ? (
            <ChevronLeft className="h-3 w-3 text-zinc-500 dark:text-zinc-400" />
          ) : (
            <ChevronRight className="h-3 w-3 text-zinc-500 dark:text-zinc-400" />
          )}
        </button>
      )}

      <SidebarInset className="min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b bg-white px-4 dark:bg-zinc-900">
          {/* Mobile Sidebar Toggle — hidden on mobile (bottom nav handles navigation) */}
          {isMobile && <SidebarTrigger className="hidden" />}

          <div className="flex flex-1 items-center justify-between">
            <Breadcrumbs
              employees={breadcrumbData.employees}
              projects={breadcrumbData.projects}
              organizations={breadcrumbData.organizations}
              leaveRequest={breadcrumbData.leaveRequest}
              task={breadcrumbData.task}
              issue={breadcrumbData.issue}
              chatRoom={breadcrumbData.chatRoom}
              vendor={breadcrumbData.vendor}
              material={breadcrumbData.material}
              indent={breadcrumbData.indent}
              storageLocation={breadcrumbData.storageLocation}
              purchaseOrder={breadcrumbData.purchaseOrder}
            />
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Organizations — hidden on mobile to keep header clean */}
              <Button variant="outline" asChild className="hidden sm:flex">
                <Link
                  href="/users/dashboard/organizations"
                  className="flex items-center gap-2"
                >
                  <Building className="h-4 w-4" />
                  <span className="hidden md:inline">Organizations</span>
                </Link>
              </Button>
              <Button variant="ghost" size="icon" asChild>
                <Link href="/users/dashboard/settings">
                  <Settings className="h-5 w-5" />
                </Link>
              </Button>
              <UserMenu />
            </div>
          </div>
        </header>

        {/* Main Content — pb-16 on mobile so content isn't hidden behind bottom nav */}
        <main className="mx-auto w-full max-w-7xl flex-1 bg-slate-100 p-3 pb-20 sm:p-4 sm:pb-20 lg:p-6 lg:pb-6 dark:bg-slate-800/50">
          {children}
        </main>

        {/* Footer */}
        <Footer />

        {/* Floating Chat — injected via prop to keep this component feature-agnostic */}
        {floatingChat}
      </SidebarInset>

      {/* Mobile bottom navigation — replaces hamburger drawer pattern on small screens */}
      <MobileBottomNav />
    </>
  );
}

export function AppLayout({ children, floatingChat }: AppLayoutProps) {
  return (
    <OrganizationProvider>
      <SidebarProvider>
        <AppLayoutContent floatingChat={floatingChat}>
          {children}
        </AppLayoutContent>
      </SidebarProvider>
    </OrganizationProvider>
  );
}
