'use client';

import { OrganizationProvider } from '@/components/providers/organization-provider';
import { AppSidebar } from '@/components/common/sidebar';
import { Footer } from '@/components/common/footer';
import { UserMenu } from '@/components/common/user-menu';
import { Breadcrumbs } from '@/components/common/breadcrumbs';
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Settings, Building } from 'lucide-react';
import Link from 'next/link';

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
}

function AppLayoutContent({ children }: AppLayoutProps) {
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
              <Button variant="outline" asChild>
                <Link
                  href="/dashboard/organizations"
                  className="flex items-center gap-2"
                >
                  <Building className="h-4 w-4" />
                  Organizations
                </Link>
              </Button>
              <Button variant="ghost" size="icon" asChild>
                <Link href="/dashboard/settings">
                  <Settings className="h-5 w-5" />
                </Link>
              </Button>
              <UserMenu />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4">{children}</main>

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
