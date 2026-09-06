'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
import type { Attendance } from '@tornotron/echno-core/attendance/types';
import { getClockEventLabel } from '@tornotron/echno-core/attendance/types';
import { geofenceExceptionEvents } from '@/features/attendance/lib/geofence-exceptions';
import { MapPin } from 'lucide-react';

interface Props {
  attendance: Attendance;
}

/**
 * Why this day is waiting on a decision.
 *
 * An approver seeing only a pending record and an Approve button is being asked
 * to agree to something the screen has not told them. This is what they are
 * agreeing to: the employee marked attendance away from the site, this is how
 * far away they were, this is the boundary that applied, and this is what they
 * said about it.
 *
 * The distance and the radius are read off the punch rather than recomputed.
 * The project's coordinates and the site radius can both be edited afterwards,
 * so a figure derived now is not necessarily the one that applied at the time.
 */
export function AttendanceGeofenceExceptionCard({ attendance }: Props) {
  const exceptions = geofenceExceptionEvents(attendance);
  if (exceptions.length === 0) return null;

  return (
    <Card className="border-amber-200 dark:border-amber-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-amber-600" />
          Marked away from site
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {exceptions.map((event) => (
          <div key={event.id} className="space-y-1">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {getClockEventLabel(event.eventType)}
              {event.distanceFromProject !== undefined && (
                <>
                  {' · '}
                  {Math.round(event.distanceFromProject)} m from site
                  {event.geofenceRadiusMeters !== undefined &&
                    `, boundary ${event.geofenceRadiusMeters} m`}
                </>
              )}
            </p>
            <p className="font-medium text-zinc-900 dark:text-zinc-100">
              {event.geofenceExceptionReason}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
