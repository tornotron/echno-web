'use client';

import { useState } from 'react';
import { Button } from '@/components/shadcn/button';
import { Badge } from '@/components/shadcn/badge';
import { Checkbox } from '@/components/shadcn/checkbox';
import { Input } from '@/components/shadcn/input';
import { Label } from '@/components/shadcn/label';
import { Textarea } from '@/components/shadcn/textarea';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/shadcn/dialog';
import { CheckCircle, XCircle, AlertTriangle, FileEdit } from 'lucide-react';
import {
  useRequestRegularization,
  useProcessRegularization,
} from '@/hooks/attendance-regularization';
import { useAttendanceRole } from '@/hooks/attendance';
import { useCurrentUserEmployee } from '@/hooks/employee';
import { toast } from '@/lib/styles/toast-styles';
import {
  getClockEventLabel,
  ClockEventType,
  AttendanceStatus,
} from '@/types/attendance';
import type { Attendance } from '@/types/attendance';
import { format } from 'date-fns';

interface Props {
  attendance: Attendance;
}

export function AttendanceRegularizationCard({ attendance }: Props) {
  const { canApprove } = useAttendanceRole();
  const { data: currentEmployee } = useCurrentUserEmployee();
  const currentUserIdentifier =
    currentEmployee?.name ?? currentEmployee?.employeeId ?? '';

  const requestMutation = useRequestRegularization();
  const processMutation = useProcessRegularization();

  // Request dialog state
  const [regDialogOpen, setRegDialogOpen] = useState(false);
  const [regReason, setRegReason] = useState('');
  const [regMissingEvents, setRegMissingEvents] = useState<ClockEventType[]>(
    []
  );
  const [regCorrectedTimes, setRegCorrectedTimes] = useState<
    Record<string, string>
  >({});

  // Reject dialog state
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const isOwnRecord = currentEmployee?.id === attendance.employeeId;

  const canRequestRegularization =
    isOwnRecord &&
    (!attendance.regularization ||
      attendance.regularization.status === 'rejected') &&
    (attendance.status === AttendanceStatus.pendingRegularization ||
      !attendance.eveningClockOut ||
      !attendance.morningClockIn);

  function openRequestDialog() {
    const missing: ClockEventType[] = [];
    if (!attendance.morningClockIn) missing.push(ClockEventType.morningClockIn);
    if (!attendance.lunchBreakStart)
      missing.push(ClockEventType.lunchBreakStart);
    if (!attendance.lunchBreakEnd) missing.push(ClockEventType.lunchBreakEnd);
    if (!attendance.eveningClockOut)
      missing.push(ClockEventType.eveningClockOut);
    setRegMissingEvents(missing);
    setRegReason('');
    setRegCorrectedTimes({});
    setRegDialogOpen(true);
  }

  function handleSubmitRequest() {
    if (!regReason.trim()) {
      toast.error('Please provide a reason');
      return;
    }
    if (regMissingEvents.length === 0) {
      toast.error('Please select at least one missing event');
      return;
    }
    const dateStr = format(attendance.date, 'yyyy-MM-dd');
    requestMutation.mutate(
      {
        req: {
          attendanceId: attendance.id,
          reason: regReason.trim(),
          missingEvents: regMissingEvents,
          correctedEvents: regMissingEvents
            .filter((e) => regCorrectedTimes[e])
            .map((e) => ({
              eventType: e,
              eventTimestamp: new Date(`${dateStr}T${regCorrectedTimes[e]}`),
              projectId: attendance.projectId,
            })),
        },
        requestedBy: currentUserIdentifier,
      },
      {
        onSuccess: () => {
          toast.success('Regularization request submitted');
          setRegDialogOpen(false);
        },
        onError: () => toast.error('Failed to submit regularization request'),
      }
    );
  }

  function handleApproveRegularization() {
    if (!attendance.regularization) return;
    processMutation.mutate(
      {
        id: attendance.regularization.id,
        status: 'APPROVED',
        approvedBy: currentUserIdentifier,
      },
      {
        onSuccess: () => toast.success('Regularization approved'),
        onError: () => toast.error('Failed to approve regularization'),
      }
    );
  }

  function handleRejectRegularization() {
    if (!attendance.regularization) return;
    processMutation.mutate(
      {
        id: attendance.regularization.id,
        status: 'REJECTED',
        approvedBy: currentUserIdentifier,
        rejectionReason: rejectReason || undefined,
      },
      {
        onSuccess: () => {
          toast.success('Regularization rejected');
          setRejectDialogOpen(false);
          setRejectReason('');
        },
        onError: () => toast.error('Failed to reject regularization'),
      }
    );
  }

  return (
    <>
      {/* Request Regularization prompt */}
      {canRequestRegularization && (
        <Card className="border-orange-200 dark:border-orange-800">
          <CardContent className="flex items-center justify-between py-5">
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">
                Missing clock events detected
              </p>
              <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
                Submit a regularization request to correct this record
              </p>
            </div>
            <Button onClick={openRequestDialog} size="sm">
              <FileEdit className="mr-2 h-4 w-4" />
              Request Regularization
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Existing regularization */}
      {attendance.regularization && (
        <Card className="border-amber-200 dark:border-amber-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2 text-amber-700 dark:text-amber-400">
                <AlertTriangle className="h-5 w-5" />
                <span>Regularization Request</span>
              </CardTitle>
              {canApprove && attendance.regularization.status === 'pending' && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400"
                    onClick={() => {
                      setRejectReason('');
                      setRejectDialogOpen(true);
                    }}
                    disabled={processMutation.isPending}
                  >
                    <XCircle className="mr-1 h-3.5 w-3.5" />
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    className="bg-green-600 text-white hover:bg-green-700"
                    onClick={handleApproveRegularization}
                    disabled={processMutation.isPending}
                  >
                    <CheckCircle className="mr-1 h-3.5 w-3.5" />
                    Approve
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="mb-1 text-sm text-zinc-600 dark:text-zinc-400">
                Reason
              </p>
              <p className="text-zinc-900 dark:text-zinc-100">
                {attendance.regularization.reason}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="mb-1 text-sm text-zinc-600 dark:text-zinc-400">
                  Requested By
                </p>
                <p className="text-zinc-900 dark:text-zinc-100">
                  {attendance.regularization.requestedBy}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-500">
                  {format(
                    attendance.regularization.requestedAt,
                    'MMM d, yyyy h:mm a'
                  )}
                </p>
              </div>

              <div>
                <p className="mb-1 text-sm text-zinc-600 dark:text-zinc-400">
                  Status
                </p>
                <Badge
                  variant={
                    ({
                      approved: 'default',
                      rejected: 'destructive',
                      pending: 'outline',
                    }[attendance.regularization.status] || 'outline') as
                      | 'default'
                      | 'destructive'
                      | 'outline'
                  }
                >
                  {attendance.regularization.status.charAt(0).toUpperCase() +
                    attendance.regularization.status.slice(1)}
                </Badge>
                {attendance.regularization.rejectionReason && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    {attendance.regularization.rejectionReason}
                  </p>
                )}
              </div>
            </div>

            <div>
              <p className="mb-1 text-sm text-zinc-600 dark:text-zinc-400">
                Missing Events
              </p>
              <div className="flex flex-wrap gap-2">
                {attendance.regularization.missingEvents.map((event, index) => (
                  <Badge key={index} variant="outline">
                    {event}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Request Regularization Dialog */}
      <Dialog open={regDialogOpen} onOpenChange={setRegDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileEdit className="h-5 w-5 text-amber-600" />
              Request Regularization
            </DialogTitle>
            <DialogDescription>
              Explain what was missed and provide corrected times where
              possible.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="reg-reason">Reason *</Label>
              <Textarea
                id="reg-reason"
                placeholder="Explain why the clock events were missed…"
                rows={3}
                value={regReason}
                onChange={(e) => setRegReason(e.target.value)}
              />
            </div>

            <div className="space-y-3">
              <Label>Missing Events *</Label>
              {(
                [
                  ClockEventType.morningClockIn,
                  ClockEventType.lunchBreakStart,
                  ClockEventType.lunchBreakEnd,
                  ClockEventType.eveningClockOut,
                ] as ClockEventType[]
              ).map((evt) => {
                const checked = regMissingEvents.includes(evt);
                return (
                  <div key={evt} className="flex items-center gap-3">
                    <Checkbox
                      id={`evt-${evt}`}
                      checked={checked}
                      onCheckedChange={(v) => {
                        setRegMissingEvents((prev) =>
                          v ? [...prev, evt] : prev.filter((e) => e !== evt)
                        );
                        if (!v) {
                          setRegCorrectedTimes((prev) => {
                            const next = { ...prev };
                            delete next[evt];
                            return next;
                          });
                        }
                      }}
                    />
                    <Label
                      htmlFor={`evt-${evt}`}
                      className="flex-1 cursor-pointer font-normal"
                    >
                      {getClockEventLabel(evt)}
                    </Label>
                    {checked && (
                      <Input
                        type="time"
                        className="w-32"
                        placeholder="Corrected time"
                        value={regCorrectedTimes[evt] ?? ''}
                        onChange={(e) =>
                          setRegCorrectedTimes((prev) => ({
                            ...prev,
                            [evt]: e.target.value,
                          }))
                        }
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRegDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitRequest}
              disabled={requestMutation.isPending}
            >
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Regularization Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              Reject Regularization
            </DialogTitle>
            <DialogDescription>
              Provide an optional reason for the employee.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Textarea
              placeholder="Rejection reason (optional)…"
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectRegularization}
              disabled={processMutation.isPending}
            >
              Confirm Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
