'use client';

import { OrganizationProvider } from '@/components/providers/organization-provider';
import { AppSidebar } from '@/components/common/sidebar';
import { Footer } from '@/components/common/footer';
import { UserMenu } from '@/components/common/user-menu';
import { Breadcrumbs } from '@/components/common/breadcrumbs';
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
import { useEmployees } from '@/hooks/employee/use-employee';
import { useProjects } from '@/hooks/project/use-projects';
import { useOrganizations } from '@/hooks/organization/use-organizations';
import { useLeaveRequest } from '@/hooks/leave/use-leave';
import { useEffect } from 'react';

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
}

const ORGANIZATIONS_PATH = '/users/dashboard/organizations';

function AppLayoutContent({ children }: AppLayoutProps) {
  const { state, toggleSidebar, isMobile } = useSidebar();
  const pathname = usePathname();
  const router = useRouter();
  const { data: user, isLoading: userLoading } = useUser();

  // Fetch data for breadcrumbs
  const { data: employees } = useEmployees();
  const { data: projects } = useProjects();
  const { data: organizations } = useOrganizations();

  // Extract leave request ID from path if present
  const leaveRequestIdMatch = pathname.match(/\/leaves\/requests\/(\d+)/);
  const leaveRequestId = leaveRequestIdMatch
    ? Number.parseInt(leaveRequestIdMatch[1], 10)
    : undefined;
  const { data: leaveRequest } = useLeaveRequest(
    leaveRequestId ?? 0,
    !!leaveRequestId
  );

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
              employees={employees}
              projects={projects}
              organizations={organizations}
              leaveRequest={leaveRequest}
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
      </SidebarInset>
    </>
  );
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <OrganizationProvider>
      <SidebarProvider>
        <AppLayoutContent>{children}</AppLayoutContent>
      </SidebarProvider>
    </OrganizationProvider>
  );
}
