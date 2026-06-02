'use client';

import { useState } from 'react';
import { Button } from '@/components/shadcn/button';
import { Badge } from '@/components/shadcn/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/shadcn/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/shadcn/tooltip';
import {
  CheckCircle,
  Clock,
  MapPin,
  Navigation,
  Route,
  ShieldCheck,
  Loader2,
  Plus,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/lib/styles/toast-styles';
import { useAttendanceRole } from '@/hooks/attendance';
import { useMovementsByAttendance, useVerifyMovement } from '@/hooks/movement';
import {
  getMovementTypeLabel,
  getMovementTypeColor,
} from '@/types/attendance/movement-type';
import type { MovementRecord } from '@/types/attendance/movement';
import { MovementLogForm } from './movement-log-form';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MovementManagementProps {
  attendanceId: number;
  employeeId: number;
  /** Whether the current user can log new movements (employee/self view) */
  canLog?: boolean;
  /** Whether GPS is required (from attendance settings) */
  geolocationRequired?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MovementManagement({
  attendanceId,
  employeeId,
  canLog = false,
  geolocationRequired = false,
}: MovementManagementProps) {
  const { canApprove } = useAttendanceRole();
  const { data: movements = [], isLoading } =
    useMovementsByAttendance(attendanceId);
  const verifyMutation = useVerifyMovement();

  const [logFormOpen, setLogFormOpen] = useState(false);

  function handleVerify(movement: MovementRecord) {
    verifyMutation.mutate(
      { id: movement.id, verifiedBy: 'current-user' },
      {
        onSuccess: () => toast.success('Movement verified'),
        onError: () => toast.error('Failed to verify movement'),
      }
    );
  }

  // ── Summary calculations ───────────────────────────────────────────────────
  const totalDistance = movements.reduce(
    (sum, m) => sum + (m.distance || 0),
    0
  );
  const totalMinutes = movements.reduce(
    (sum, m) => sum + (m.durationMinutes || 0),
    0
  );
  const verifiedCount = movements.filter((m) => m.isVerified).length;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="mr-2 h-5 w-5 animate-spin text-zinc-400" />
          <p className="text-zinc-600 dark:text-zinc-400">Loading movements…</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Route className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <div>
                <CardTitle>Movement Records</CardTitle>
                <CardDescription>
                  {movements.length}{' '}
                  {movements.length === 1 ? 'movement' : 'movements'} recorded
                </CardDescription>
              </div>
            </div>
            {canLog && (
              <Button size="sm" onClick={() => setLogFormOpen(true)}>
                <Plus className="mr-1 h-4 w-4" />
                Log Movement
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {movements.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Route className="mb-3 h-10 w-10 text-zinc-300 dark:text-zinc-600" />
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                No movements recorded for this day.
              </p>
              {canLog && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => setLogFormOpen(true)}
                >
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  Log First Movement
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Summary strip */}
              <div className="mb-4 grid grid-cols-3 gap-3">
                <div className="rounded-lg bg-blue-50 p-3 text-center dark:bg-blue-900/20">
                  <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                    {totalDistance.toFixed(1)} km
                  </p>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    Total Distance
                  </p>
                </div>
                <div className="rounded-lg bg-purple-50 p-3 text-center dark:bg-purple-900/20">
                  <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                    {Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m
                  </p>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    Total Time
                  </p>
                </div>
                <div className="rounded-lg bg-green-50 p-3 text-center dark:bg-green-900/20">
                  <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                    {verifiedCount}/{movements.length}
                  </p>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    Verified
                  </p>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Route</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Distance</TableHead>
                      <TableHead>Purpose</TableHead>
                      <TableHead>Status</TableHead>
                      {canApprove && (
                        <TableHead className="text-right">Action</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movements.map((m) => (
                      <TableRow key={m.id}>
                        {/* Type */}
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={getMovementTypeColor(m.movementType)}
                          >
                            {getMovementTypeLabel(m.movementType)}
                          </Badge>
                        </TableCell>

                        {/* Route */}
                        <TableCell>
                          <div className="space-y-0.5 text-sm">
                            <div className="flex items-center space-x-1">
                              <MapPin className="h-3 w-3 shrink-0 text-green-500" />
                              <span className="text-zinc-700 dark:text-zinc-300">
                                {m.fromLocation}
                              </span>
                            </div>
                            {m.toLocation && (
                              <div className="flex items-center space-x-1">
                                <MapPin className="h-3 w-3 shrink-0 text-red-500" />
                                <span className="text-zinc-700 dark:text-zinc-300">
                                  {m.toLocation}
                                </span>
                              </div>
                            )}
                          </div>
                        </TableCell>

                        {/* Time */}
                        <TableCell>
                          <div className="flex items-center space-x-1 text-sm">
                            <Clock className="h-3 w-3 text-zinc-400" />
                            <span className="text-zinc-700 dark:text-zinc-300">
                              {format(m.startTime, 'h:mm a')}
                              {m.endTime && ` – ${format(m.endTime, 'h:mm a')}`}
                            </span>
                          </div>
                        </TableCell>

                        {/* Duration */}
                        <TableCell>
                          {m.durationMinutes == null ? (
                            <span className="text-xs text-zinc-400">—</span>
                          ) : (
                            <span className="text-sm text-zinc-700 dark:text-zinc-300">
                              {Math.floor(m.durationMinutes / 60)}h{' '}
                              {m.durationMinutes % 60}m
                            </span>
                          )}
                        </TableCell>

                        {/* Distance */}
                        <TableCell>
                          {m.distance ? (
                            <div className="flex items-center space-x-1 text-sm">
                              <Navigation className="h-3 w-3 text-zinc-400" />
                              <span className="text-zinc-700 dark:text-zinc-300">
                                {m.distance} km
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-zinc-400">—</span>
                          )}
                        </TableCell>

                        {/* Purpose */}
                        <TableCell>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <p className="max-w-[180px] cursor-default truncate text-sm text-zinc-700 dark:text-zinc-300">
                                  {m.purpose}
                                </p>
                              </TooltipTrigger>
                              <TooltipContent
                                side="bottom"
                                className="max-w-xs"
                              >
                                <p>{m.purpose}</p>
                                {m.remarks && (
                                  <p className="mt-1 text-xs text-zinc-400">
                                    {m.remarks}
                                  </p>
                                )}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          {m.isVerified ? (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge
                                    variant="outline"
                                    className="border-green-300 text-green-700 dark:border-green-700 dark:text-green-400"
                                  >
                                    <CheckCircle className="mr-1 h-3 w-3" />
                                    Verified
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {m.verifiedBy && <p>By {m.verifiedBy}</p>}
                                  {m.verifiedAt && (
                                    <p className="text-xs">
                                      {format(
                                        m.verifiedAt,
                                        'MMM d, yyyy h:mm a'
                                      )}
                                    </p>
                                  )}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : (
                            <Badge
                              variant="outline"
                              className="border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-400"
                            >
                              <Clock className="mr-1 h-3 w-3" />
                              Pending
                            </Badge>
                          )}
                        </TableCell>

                        {/* Action */}
                        {canApprove && (
                          <TableCell className="text-right">
                            {!m.isVerified && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-green-300 text-green-600 hover:bg-green-50 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-900/20"
                                onClick={() => handleVerify(m)}
                                disabled={verifyMutation.isPending}
                              >
                                <ShieldCheck className="mr-1 h-3.5 w-3.5" />
                                Verify
                              </Button>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Movement Log Form Dialog */}
      <MovementLogForm
        open={logFormOpen}
        onOpenChange={setLogFormOpen}
        attendanceId={attendanceId}
        employeeId={employeeId}
        geolocationRequired={geolocationRequired}
      />
    </>
  );
}
