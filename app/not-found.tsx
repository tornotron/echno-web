import Link from 'next/link';
import { Button } from '@/components/shadcn/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
import { Home, Search } from 'lucide-react';
import { routes } from '@/nav';

export default function NotFound() {
  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <div className="bg-muted mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
            <Search className="text-muted-foreground h-8 w-8" />
          </div>
          <CardTitle className="text-3xl">404 - Page Not Found</CardTitle>
          <CardDescription className="text-base">
            The page you&apos;re looking for doesn&apos;t exist or has been
            moved.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="text-muted-foreground text-center text-sm">
            <p>This could be because:</p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-left">
              <li>The URL was typed incorrectly</li>
              <li>The page has been removed or renamed</li>
              <li>You don&apos;t have permission to access this page</li>
            </ul>
          </div>

          <div className="flex flex-col gap-2 pt-4">
            <Button asChild className="w-full">
              <Link href={routes.href} className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                Go to Dashboard
              </Link>
            </Button>
          </div>

          <div className="text-muted-foreground pt-4 text-center text-xs">
            <p>
              Need help? Contact{' '}
              <a
                href="mailto:support@echnoai.com"
                className="text-primary hover:underline"
              >
                support@echnoai.com
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
