import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AppLayout } from '@/components/common/app-layout';
import { Search, Home, ArrowLeft } from 'lucide-react';

/**
 * Dashboard Not Found Page (404)
 *
 * Displayed when a user navigates to a non-existent dashboard route
 * Uses the AppLayout for a consistent user experience
 */
export default function DashboardNotFound() {
  return (
    <AppLayout>
      <div className="flex min-h-[calc(100vh-12rem)] items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-2 text-center">
            <div className="bg-muted mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
              <Search className="text-muted-foreground h-8 w-8" />
            </div>
            <CardTitle className="text-3xl">Page Not Found</CardTitle>
            <CardDescription className="text-base">
              This dashboard page doesn&apos;t exist or you don&apos;t have
              access to it.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="text-muted-foreground text-center text-sm">
              <p>Common reasons:</p>
              <ul className="mt-2 list-inside list-disc space-y-1 text-left">
                <li>The resource was moved or deleted</li>
                <li>You don&apos;t have permission to view this page</li>
                <li>The link you followed is outdated</li>
                <li>There&apos;s a typo in the URL</li>
              </ul>
            </div>

            <div className="flex flex-col gap-2 pt-4">
              <Button asChild className="w-full">
                <Link
                  href="/users/dashboard"
                  className="flex items-center gap-2"
                >
                  <Home className="h-4 w-4" />
                  Go to Dashboard Home
                </Link>
              </Button>

              <Button
                variant="outline"
                onClick={() => globalThis.history.back()}
                className="flex w-full items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Go Back
              </Button>
            </div>

            <div className="text-muted-foreground pt-4 text-center text-xs">
              <p>
                Lost? Check out{' '}
                <Link
                  href="/users/dashboard/projects"
                  className="text-primary hover:underline"
                >
                  your projects
                </Link>{' '}
                or{' '}
                <Link
                  href="/users/dashboard/organizations"
                  className="text-primary hover:underline"
                >
                  organizations
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
