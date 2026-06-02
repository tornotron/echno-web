'use client';

import { useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/common';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/shadcn/tabs';
import { UserCheck, Users } from 'lucide-react';
import {
  AttendanceHistory,
  MyHistoryStatsCard,
  TeamAttendanceHistory,
  TeamHistoryStatsCard,
} from '@/features/attendance/components';
import { useAttendanceRole } from '@/hooks/attendance';

export default function AttendanceHistoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { canViewTeamAttendance, isLoading: roleLoading } = useAttendanceRole();

  const tab = searchParams.get('tab') ?? 'my';

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === null || value === '') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  if (roleLoading) return null;

  // Employees lacking team-view permission see only their own history.
  if (!canViewTeamAttendance) {
    return <AttendanceHistory />;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Attendance History"
        description="Review your own attendance, or browse team records across projects"
      />

      {/* Status card sits above the tabs and switches with the active view. */}
      {tab === 'team' ? <TeamHistoryStatsCard /> : <MyHistoryStatsCard />}

      <Tabs value={tab} onValueChange={(v) => setParam('tab', v)}>
        <TabsList className="w-full">
          <TabsTrigger value="my" className="gap-2">
            <UserCheck className="h-4 w-4" />
            My History
          </TabsTrigger>
          <TabsTrigger value="team" className="gap-2">
            <Users className="h-4 w-4" />
            Team History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my" className="mt-4">
          <AttendanceHistory hideHeader hideStats />
        </TabsContent>

        <TabsContent value="team" className="mt-4">
          <TeamAttendanceHistory hideStats />
        </TabsContent>
      </Tabs>
    </div>
  );
}
