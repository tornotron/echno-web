'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
import {
  CheckCircle,
  Route,
  Car,
  Users,
  Package,
  Home,
  MapPin,
  GraduationCap,
  Building,
  ClipboardCheck,
  ShoppingCart,
  Eye,
  MoreHorizontal,
  Navigation,
} from 'lucide-react';
import { getMovementTypeLabel, getMovementTypeIcon } from '@/types/attendance';
import type { Attendance } from '@/types/attendance';
import { format } from 'date-fns';

interface Props {
  attendance: Attendance;
}

const iconMap: Record<string, typeof Car> = {
  Car,
  Users,
  Package,
  Home,
  MapPin,
  GraduationCap,
  Building,
  ClipboardCheck,
  ShoppingCart,
  Eye,
  MoreHorizontal,
};

export function AttendanceDailyMovementsCard({ attendance }: Props) {
  const movements = attendance.movements;
  if (!movements || movements.length === 0) return null;

  const totalDistance = movements.reduce(
    (sum, m) => sum + (m.distance || 0),
    0
  );
  const totalMinutes = movements.reduce(
    (sum, m) => sum + (m.durationMinutes || 0),
    0
  );

  return (
    <Card className="border-blue-200 dark:border-blue-800">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-blue-700 dark:text-blue-400">
          <Route className="h-5 w-5" />
          <span>Daily Movements</span>
        </CardTitle>
        <CardDescription>
          {movements.length} {movements.length === 1 ? 'movement' : 'movements'}{' '}
          recorded
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {movements.map((movement, index) => {
          const MovementIcon =
            iconMap[getMovementTypeIcon(movement.movementType)] ?? Route;

          return (
            <div key={movement.id} className="relative">
              {index < movements.length - 1 && (
                <div className="absolute top-10 bottom-0 left-4 w-0.5 bg-zinc-200 dark:bg-zinc-700" />
              )}

              <div className="flex items-start space-x-3">
                <div className="relative z-10 shrink-0 rounded-lg border-2 border-blue-200 bg-white p-2 dark:border-blue-800 dark:bg-zinc-800">
                  <MovementIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>

                <div className="min-w-0 flex-1 pb-3">
                  <div className="mb-1 flex items-start justify-between">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {getMovementTypeLabel(movement.movementType)}
                    </p>
                    {movement.isVerified && (
                      <CheckCircle className="h-3 w-3 shrink-0 text-green-600 dark:text-green-400" />
                    )}
                  </div>

                  <p className="mb-2 text-xs text-zinc-600 dark:text-zinc-400">
                    {format(movement.startTime, 'h:mm a')}
                    {movement.endTime &&
                      ` – ${format(movement.endTime, 'h:mm a')}`}
                  </p>

                  <div className="space-y-1">
                    <div className="flex items-start space-x-1 text-xs">
                      <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-green-600 dark:text-green-400" />
                      <span className="truncate text-zinc-700 dark:text-zinc-300">
                        {movement.fromLocation}
                      </span>
                    </div>
                    {movement.toLocation && (
                      <div className="flex items-start space-x-1 text-xs">
                        <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-red-600 dark:text-red-400" />
                        <span className="truncate text-zinc-700 dark:text-zinc-300">
                          {movement.toLocation}
                        </span>
                      </div>
                    )}
                  </div>

                  {movement.distance && (
                    <div className="mt-2 flex items-center space-x-1">
                      <Navigation className="h-3 w-3 text-zinc-400" />
                      <span className="text-xs text-zinc-600 dark:text-zinc-400">
                        {movement.distance} km
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        <div className="space-y-2 border-t border-blue-200 pt-3 dark:border-blue-800">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-600 dark:text-zinc-400">
              Total Distance
            </span>
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              {totalDistance.toFixed(1)} km
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-600 dark:text-zinc-400">Total Time</span>
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              {Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
