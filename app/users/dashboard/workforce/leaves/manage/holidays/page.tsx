/**
 * app/users/dashboard/workforce/leaves/manage/holidays/page.tsx
 *
 * Admin-only holiday calendar: the organisation's declared holidays by year
 * and its working week, next to the leave policies they are read with.
 */

'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/shadcn/button';
import { Badge } from '@/components/shadcn/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/shadcn/alert';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { HolidaysManager } from '@/features/leave/components/holidays-manager';
import { TableSkeleton } from '@/features/leave/components/skeletons';
import { useLeaveRole } from '@/hooks/leave/use-leave-role';
import { PageHeader } from '@/components/common';
import { routes } from '@/nav';

export default function HolidaysPage() {
  const router = useRouter();
  const { isAdmin, isLoading: roleLoading } = useLeaveRole();

  if (roleLoading) {
    return (
      <div className="container mx-auto p-6">
        <TableSkeleton statCount={2} />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You don&apos;t have permission to manage the holiday calendar. This
            feature is restricted to system administrators.
          </AlertDescription>
        </Alert>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push(routes.workforce.leaves.manage.href)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Holiday Calendar"
        description="Declared holidays and the working week, read when leave is charged"
        badge={
          <Badge variant="secondary" className="text-sm">
            Admin Only
          </Badge>
        }
      />
      <HolidaysManager />
    </div>
  );
}
