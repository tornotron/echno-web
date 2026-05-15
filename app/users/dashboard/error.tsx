'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/shadcn/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
import { AlertTriangle, Home, RotateCcw } from 'lucide-react';
import { logger } from '@/lib/logger';
import { routes } from '@/nav';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error('Dashboard error caught', error, {
      digest: error.digest,
      message: error.message,
      stack: error.stack,
      location: 'dashboard',
    });
  }, [error]);

  return (
    <div className="flex min-h-[calc(100vh-12rem)] items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <div className="bg-destructive/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
            <AlertTriangle className="text-destructive h-8 w-8" />
          </div>
          <CardTitle className="text-3xl">Oops! Something Went Wrong</CardTitle>
          <CardDescription className="text-base">
            We encountered an error while loading this page. Don&apos;t worry,
            your data is safe.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {process.env.NODE_ENV === 'development' && (
            <div className="bg-muted rounded-lg p-4">
              <p className="text-destructive mb-2 text-sm font-medium">
                Error Details (Development Only):
              </p>
              <pre className="text-muted-foreground max-h-32 overflow-auto text-xs">
                {error.message}
              </pre>
              {error.digest && (
                <p className="text-muted-foreground mt-2 text-xs">
                  Error ID: {error.digest}
                </p>
              )}
            </div>
          )}

          <div className="text-muted-foreground text-center text-sm">
            <p>What you can do:</p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-left">
              <li>Try refreshing the page</li>
              <li>Go back to the dashboard home</li>
              <li>Check your internet connection</li>
              <li>Contact support if the problem persists</li>
            </ul>
          </div>

          <div className="flex flex-col gap-2 pt-4">
            <Button onClick={reset} className="flex w-full items-center gap-2">
              <RotateCcw className="h-4 w-4" />
              Try Again
            </Button>

            <Button variant="outline" asChild className="w-full">
              <Link href={routes.href} className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                Go to Dashboard Home
              </Link>
            </Button>
          </div>

          <div className="text-muted-foreground pt-4 text-center text-xs">
            <p>
              Still having issues? Email{' '}
              <a
                href="mailto:support@echnoai.com"
                className="text-primary hover:underline"
              >
                support@echnoai.com
              </a>
            </p>
            {error.digest && (
              <p className="mt-1 font-mono">Reference: {error.digest}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
