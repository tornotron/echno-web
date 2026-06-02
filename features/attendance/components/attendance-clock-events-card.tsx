'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
import {
  Clock,
  MapPin,
  Camera,
  CheckCircle,
  XCircle,
  Coffee,
  LogIn,
  LogOut,
  PlayCircle,
} from 'lucide-react';
import { getClockEventLabel, ClockEventType } from '@/types/attendance';
import type { Attendance } from '@/types/attendance';
import { format } from 'date-fns';

interface Props {
  attendance: Attendance;
}

const colorMap = {
  green: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    icon: 'text-green-600 dark:text-green-400',
  },
  red: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    icon: 'text-red-600 dark:text-red-400',
  },
  blue: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    icon: 'text-blue-600 dark:text-blue-400',
  },
  orange: {
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    icon: 'text-orange-600 dark:text-orange-400',
  },
};

export function AttendanceClockEventsCard({ attendance }: Props) {
  const clockEvents = [
    {
      event: attendance.morningClockIn,
      type: ClockEventType.morningClockIn,
      icon: LogIn,
      color: 'green' as const,
    },
    {
      event: attendance.lunchBreakStart,
      type: ClockEventType.lunchBreakStart,
      icon: Coffee,
      color: 'orange' as const,
    },
    {
      event: attendance.lunchBreakEnd,
      type: ClockEventType.lunchBreakEnd,
      icon: PlayCircle,
      color: 'blue' as const,
    },
    {
      event: attendance.eveningClockOut,
      type: ClockEventType.eveningClockOut,
      icon: LogOut,
      color: 'red' as const,
    },
  ].filter((item) => item.event);

  if (clockEvents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Clock Events Timeline</CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center">
          <Clock className="mx-auto mb-3 h-8 w-8 text-zinc-400" />
          <p className="text-zinc-500 dark:text-zinc-400">
            No clock events recorded
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Clock Events Timeline</CardTitle>
        <CardDescription>
          All clock-in and clock-out events for this day
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {clockEvents.map(({ event, type, icon: Icon, color }, index) => {
            if (!event) return null;
            const colors = colorMap[color] ?? colorMap.orange;
            return (
              <div
                key={index}
                className="relative border-l-2 border-zinc-200 pb-4 pl-8 last:border-l-0 last:pb-0 dark:border-zinc-800"
              >
                <div
                  className={`absolute top-0 left-0 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full ${colors.bg}`}
                >
                  <Icon className={`h-3 w-3 ${colors.icon}`} />
                </div>

                <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-900/50">
                  <div className="mb-3 flex items-start justify-between">
                    <div>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">
                        {getClockEventLabel(type)}
                      </p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        {format(event.timestamp, 'h:mm:ss a')}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {event.isWithinGeofence ? (
                        <div className="flex items-center space-x-1 text-green-600 dark:text-green-400">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-xs">Within Geofence</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1 text-red-600 dark:text-red-400">
                          <XCircle className="h-4 w-4" />
                          <span className="text-xs">Outside Geofence</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-4 sm:flex-row">
                    {/* Selfie photo (large) — timestamp + GPS are already
                        watermarked into the image at capture time. */}
                    <SelfiePreview photoUrl={event.photoUrl} />

                    {/* Meta column */}
                    <div className="flex-1 space-y-3 text-sm">
                      <div className="flex items-start space-x-2 text-zinc-600 dark:text-zinc-400">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs">Location</p>
                          <p className="font-mono text-xs">
                            {event.location.latitude.toFixed(6)},{' '}
                            {event.location.longitude.toFixed(6)}
                          </p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-500">
                            {event.distanceFromProject}m from project
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-2 text-zinc-600 dark:text-zinc-400">
                        <Camera className="mt-0.5 h-4 w-4 shrink-0" />
                        <div>
                          <p className="text-xs">Captured on</p>
                          <p className="text-xs text-zinc-700 dark:text-zinc-300">
                            {event.deviceInfo?.platform || 'Web'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {event.remarks && (
                    <div className="mt-3 border-t border-zinc-200 pt-3 dark:border-zinc-800">
                      <p className="text-xs text-zinc-600 dark:text-zinc-400">
                        <span className="font-medium">Remarks:</span>{' '}
                        {event.remarks}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Selfie preview ───────────────────────────────────────────────────────────
// Uses a plain <img> rather than next/image so the photo renders regardless of
// where the backend stores the file (S3, DigitalOcean Spaces, etc.) without
// needing each host added to next.config.ts.

function SelfiePreview({ photoUrl }: { photoUrl: string | undefined }) {
  const [failed, setFailed] = useState(false);

  const sizeClasses = 'h-48 w-48 sm:h-56 sm:w-56 shrink-0';

  if (!photoUrl || failed) {
    return (
      <div
        className={`${sizeClasses} flex items-center justify-center rounded-lg border-2 border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800`}
      >
        <Camera className="h-10 w-10 text-zinc-400" />
      </div>
    );
  }

  return (
    <a
      href={photoUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Open selfie in new tab"
      className={`relative block overflow-hidden rounded-lg border-2 border-zinc-200 transition-colors hover:border-blue-400 dark:border-zinc-700 dark:hover:border-blue-500 ${sizeClasses}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photoUrl}
        alt="Employee selfie"
        className="absolute inset-0 h-full w-full object-cover"
        onError={() => setFailed(true)}
      />
    </a>
  );
}
