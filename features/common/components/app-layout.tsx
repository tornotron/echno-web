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
  SidebarTrigger,
  useSidebar,
} from '@/components/shadcn/sidebar';
import { Button } from '@/components/shadcn/button';
import { Settings, Building } from 'lucide-react';
import { ThemeToggle } from '@/components/common/theme-toggle';
import { CommandPalette } from '@/features/common/components/command-palette';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useUser } from '@tornotron/echno-core/user/hooks';
import { useBreadcrumbData } from '@/hooks/use-breadcrumb-data';
import { Suspense, useEffect } from 'react';
import { useProjects } from '@tornotron/echno-core/project/hooks';
import { useTasks } from '@tornotron/echno-core/task/hooks';
import { useIssues } from '@tornotron/echno-core/issue/hooks';
import { routes } from '@/nav';

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  /** Slot for a floating chat widget — injected from the app layer to keep this component feature-agnostic. */
  floatingChat?: React.ReactNode;
}

const ORGANIZATIONS_PATH = routes.organizations.href;

function AppLayoutContent({ children, floatingChat }: AppLayoutProps) {
  const { isMobile, setOpen } = useSidebar();

  // TODO: re-enable toggle when collapse UX is ready
  useEffect(() => {
    if (!isMobile) setOpen(true);
  }, [isMobile, setOpen]);

  const pathname = usePathname();
  const router = useRouter();
  const { data: user, isLoading: userLoading } = useUser();
  const { data: projects = [] } = useProjects();
  const { data: tasks = [] } = useTasks();
  const { data: issues = [] } = useIssues();

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
      <CommandPalette
        projects={projects
          .filter((project) => Boolean(project.id))
          .slice(0, 30)
          .map((project) => ({
            id: String(project.id),
            name: project.projectName,
            href: routes.portfolio.projects.allProjects.detail(
              String(project.id)
            ).href,
          }))}
        tasks={tasks
          .filter((task) => Boolean(task.id) && Boolean(task.projectId))
          .slice(0, 40)
          .map((task) => ({
            id: String(task.id),
            name: task.title,
            href: routes.portfolio.projects.allProjects
              .detail(String(task.projectId))
              .tasks.detail(String(task.id)).href,
          }))}
        issues={issues
          .filter((issue) => Boolean(issue.id))
          .slice(0, 40)
          .map((issue) => ({
            id: String(issue.id),
            name: issue.title,
            href: routes.portfolio.projects.allIssues,
          }))}
      />
      <AppSidebar />

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
              labour={breadcrumbData.labour}
              siteTransfer={breadcrumbData.siteTransfer}
            />
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Organizations — hidden on mobile to keep header clean */}
              <Button variant="outline" asChild className="hidden sm:flex">
                <Link
                  href={routes.organizations.href}
                  className="flex items-center gap-2"
                >
                  <Building className="h-4 w-4" />
                  <span className="hidden md:inline">Organizations</span>
                </Link>
              </Button>
              <ThemeToggle />
              <Button variant="ghost" size="icon" asChild>
                <Link href={routes.settings}>
                  <Settings className="h-5 w-5" />
                </Link>
              </Button>
              <UserMenu />
            </div>
          </div>
        </header>

        {/* Main Content — pb-16 on mobile so content isn't hidden behind bottom nav */}
        <main className="flex-1 bg-slate-100 p-3 pb-20 sm:p-4 sm:pb-20 lg:p-6 lg:pb-6 dark:bg-slate-800/50">
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
        {/*
         * Suspense wraps the full AppLayoutContent (not just children) on
         * purpose: Breadcrumbs and useBreadcrumbData inside the chrome both
         * call useSearchParams, which suspends during prerender. Scoping the
         * boundary tighter breaks the static export of /profile/edit.
         */}
        <Suspense fallback={null}>
          <AppLayoutContent floatingChat={floatingChat}>
            {children}
          </AppLayoutContent>
        </Suspense>
      </SidebarProvider>
    </OrganizationProvider>
  );
}
