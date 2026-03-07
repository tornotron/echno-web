'use client';

import { OrganizationProvider } from '@/components/providers/organization-provider';
import { AppSidebar } from '@/features/common/components/sidebar';
import { Footer } from '@/components/common/footer';
import { UserMenu } from '@/features/common/components/user-menu';
import { Breadcrumbs } from '@/features/common/components/breadcrumbs';
import {
  SidebarProvider,
  SidebarInset,
  useSidebar,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
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
          className="fixed top-16 z-50 flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-gray-300 bg-gray-400 shadow-md transition-all duration-300 hover:scale-110 hover:bg-gray-500 active:scale-95"
          aria-label="Toggle sidebar"
          style={{
            left:
              state === 'expanded'
                ? 'var(--sidebar-width)'
                : 'var(--sidebar-width-icon)',
          }}
        >
          {state === 'expanded' ? (
            <ChevronLeft className="h-3 w-3 text-white" />
          ) : (
            <ChevronRight className="h-3 w-3 text-white" />
          )}
        </button>
      )}

      <SidebarInset>
        {/* Header */}
        <header className="bg-background sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b px-4">
          {/* Mobile Sidebar Toggle */}
          {isMobile && <SidebarTrigger />}

          <div className="flex flex-1 items-center justify-between">
            <Breadcrumbs
              employees={breadcrumbData.employees}
              projects={breadcrumbData.projects}
              organizations={breadcrumbData.organizations}
              leaveRequest={breadcrumbData.leaveRequest}
              task={breadcrumbData.task}
              issue={breadcrumbData.issue}
              chatRoom={breadcrumbData.chatRoom}
            />
            <div className="flex items-center gap-2 sm:gap-4">
              <Button variant="outline" asChild>
                <Link
                  href="/users/dashboard/organizations"
                  className="flex items-center gap-2"
                >
                  <Building className="h-4 w-4" />
                  <span className="hidden sm:inline">Organizations</span>
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

        {/* Main Content */}
        <main className="flex-1 p-3 sm:p-4 lg:p-6">{children}</main>

        {/* Footer */}
        <Footer />

        {/* Floating Chat — injected via prop to keep this component feature-agnostic */}
        {floatingChat}
      </SidebarInset>
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
