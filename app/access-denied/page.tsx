'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';
import { ShieldX, ArrowLeft, Home, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { routes } from '@/nav';

function AccessDeniedContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const resource = searchParams.get('resource') || '';
  const scope = searchParams.get('scope') || '';
  const moduleName = searchParams.get('module') || '';
  const path = searchParams.get('path') || '';
  const message =
    searchParams.get('message') ||
    "You don't have permission to access this resource.";

  const getPermissionDescription = () => {
    if (moduleName) {
      return `${moduleName} Module`;
    }
    if (resource && scope) {
      const scopeMap: Record<string, string> = {
        create: 'Create',
        read: 'Read',
        update: 'Update',
        delete: 'Delete',
        list: 'Read',
        view: 'Read',
      };
      const permission = scopeMap[scope.toLowerCase()] || scope;
      return `${permission} permission for ${resource}`;
    }
    if (resource) {
      return resource;
    }
    if (path) {
      return path;
    }
    return 'this resource';
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4 dark:bg-zinc-900">
      <div className="w-full max-w-lg">
        <Card className="mb-4">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
              <ShieldX className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <CardTitle className="text-2xl">Access Denied</CardTitle>
            <CardDescription className="mt-2 text-base">
              {message}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-800/50">
              <p className="mb-1 text-sm text-zinc-500 dark:text-zinc-400">
                Required Permission
              </p>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">
                {getPermissionDescription()}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
              <Link href={routes.href} className="w-full">
                <Button variant="outline" className="w-full">
                  <Home className="mr-2 h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
          If you believe this is an error, please contact your system
          administrator.
        </p>
      </div>
    </div>
  );
}

export default function AccessDeniedPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
        </div>
      }
    >
      <AccessDeniedContent />
    </Suspense>
  );
}
