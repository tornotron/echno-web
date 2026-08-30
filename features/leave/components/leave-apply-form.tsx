'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';
import { Input } from '@/components/shadcn/input';
import { PhoneInput } from '@/components/shadcn/phone-input';
import { Label } from '@/components/shadcn/label';
import { Textarea } from '@/components/shadcn/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/select';
import { Separator } from '@/components/shadcn/separator';
import { Alert, AlertDescription } from '@/components/shadcn/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/shadcn/dialog';
import {
  Calendar,
  AlertCircle,
  Save,
  Send,
  Loader2,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import {
  useCreateLeaveRequest,
  useUpdateLeaveRequest,
  useSubmitLeaveRequest,
  useCancelLeaveRequest,
  useCalculateDays,
  useCheckConflicts,
} from '@/hooks/leave/use-leave-mutations';
import {
  HalfDayType,
  LeavePolicy,
  LeaveRequest,
  LeaveBalanceSummary,
} from '@/types/leave';
import { PageHeader } from '@/components/common';
import { BalanceCard } from '@/features/leave/components/balance-card';
import { FormSkeleton } from '@/features/leave/components/skeletons';
import { toast } from '@/lib/styles/toast-styles';
import { format } from 'date-fns';
import {
  RANGE_END_OPTIONS,
  RANGE_START_OPTIONS,
  SINGLE_DAY_OPTIONS,
  checkDurationAgainstPolicy,
  describeDuration,
  formatLeaveDays,
  isSingleDayRange,
  reconcileHalfDaySelection,
} from '@/features/leave/lib/leave-duration';
import { formatDayCount, formatDays } from '@/features/leave/lib/leave-days';
import { routes } from '@/nav';

interface LeaveApplyFormProps {
  employeeId: number;
  policies: LeavePolicy[];
  balanceSummary: LeaveBalanceSummary | undefined;
  existingRequest: LeaveRequest | undefined;
  isEditMode: boolean;
  editRequestId: string | null;
}

const LEAVE_FORM_ID = 'leave-apply-form';

const defaultFormData = {
  leavePolicyId: '',
  startDate: '',
  endDate: '',
  startHalfDayType: null as HalfDayType | null,
  endHalfDayType: null as HalfDayType | null,
  reason: '',
  contactDuringLeave: '',
  handoverToId: undefined as number | undefined,
  handoverNotes: '',
};

export function LeaveApplyForm({
  employeeId,
  policies,
  balanceSummary,
  existingRequest,
  isEditMode,
  editRequestId,
}: LeaveApplyFormProps) {
  const router = useRouter();

  const createMutation = useCreateLeaveRequest();
  const updateMutation = useUpdateLeaveRequest();
  const submitMutation = useSubmitLeaveRequest();
  const cancelMutation = useCancelLeaveRequest();
  const calculateDaysMutation = useCalculateDays();
  const checkConflictsMutation = useCheckConflicts();
  const calculateDays = calculateDaysMutation.mutate;
  const checkConflicts = checkConflictsMutation.mutate;

  const [formData, setFormData] = useState(defaultFormData);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [calculatedDays, setCalculatedDays] = useState(0);
  const [hasConflict, setHasConflict] = useState(false);
  const [conflictMessage, setConflictMessage] = useState('');

  // Track which request has been used to initialize the form (React-recommended pattern)
  const [initializedRequestId, setInitializedRequestId] = useState<
    number | null
  >(null);
  if (
    isEditMode &&
    existingRequest &&
    initializedRequestId !== existingRequest.id
  ) {
    setInitializedRequestId(existingRequest.id);
    setFormData({
      leavePolicyId: existingRequest.leavePolicyId.toString(),
      startDate: format(existingRequest.startDate, 'yyyy-MM-dd'),
      endDate: format(existingRequest.endDate, 'yyyy-MM-dd'),
      startHalfDayType: existingRequest.startHalfDayType || null,
      endHalfDayType: existingRequest.endHalfDayType || null,
      reason: existingRequest.reason || '',
      contactDuringLeave: existingRequest.contactDuringLeave || '',
      handoverToId: existingRequest.handoverToId,
      handoverNotes: existingRequest.handoverNotes || '',
    });
  }

  const isFormInitialized = !isEditMode || initializedRequestId !== null;

  const selectedPolicy = policies.find(
    (p) => p.id.toString() === formData.leavePolicyId
  );

  const selectedBalance = balanceSummary?.balances.find(
    (b) => b.leavePolicyId.toString() === formData.leavePolicyId
  );

  const isSingleDay = isSingleDayRange(formData.startDate, formData.endDate);

  const halfDaySelection = {
    startHalfDayType: formData.startHalfDayType,
    endHalfDayType: formData.endHalfDayType,
  };

  // A half-day choice can be invalidated by what the user does next: extending
  // the range, collapsing it back to one day, or switching to a leave type that
  // forbids halves. Rather than send a value the backend would reject or
  // silently ignore, the selection is reconciled whenever the dates or the
  // policy move.
  const updateDates = (startDate: string, endDate: string) => {
    setFormData((current) => ({
      ...current,
      startDate,
      endDate,
      ...reconcileHalfDaySelection(
        current,
        startDate,
        endDate,
        selectedPolicy?.allowHalfDay ?? true
      ),
    }));
  };

  const updatePolicy = (leavePolicyId: string) => {
    const policy = policies.find((p) => p.id.toString() === leavePolicyId);
    setFormData((current) => ({
      ...current,
      leavePolicyId,
      ...reconcileHalfDaySelection(
        current,
        current.startDate,
        current.endDate,
        policy?.allowHalfDay ?? true
      ),
    }));
  };

  const updateHalfDay = (
    field: 'startHalfDayType' | 'endHalfDayType',
    value: HalfDayType
  ) => {
    setFormData((current) => ({
      ...current,
      ...reconcileHalfDaySelection(
        { ...current, [field]: value },
        current.startDate,
        current.endDate,
        selectedPolicy?.allowHalfDay ?? true
      ),
    }));
  };

  const durationIssue = checkDurationAgainstPolicy(
    calculatedDays,
    halfDaySelection,
    selectedPolicy
  );

  useEffect(() => {
    if (formData.startDate && formData.endDate && employeeId) {
      calculateDays(
        {
          startDate: formData.startDate,
          endDate: formData.endDate,
          startHalfDayType: formData.startHalfDayType,
          endHalfDayType: formData.endHalfDayType,
        },
        {
          onSuccess: (data) => {
            setCalculatedDays(data.totalDays);
          },
        }
      );

      checkConflicts(
        {
          employeeId,
          startDate: formData.startDate,
          endDate: formData.endDate,
        },
        {
          onSuccess: (data) => {
            setHasConflict(data.hasConflict);
            if (data.hasConflict) {
              setConflictMessage(
                `You have ${data.conflictingRequests.length} conflicting request(s)`
              );
            } else {
              setConflictMessage('');
            }
          },
        }
      );
    }
  }, [
    formData.startDate,
    formData.endDate,
    formData.startHalfDayType,
    formData.endHalfDayType,
    employeeId,
    calculateDays,
    checkConflicts,
  ]);

  const validateForm = () => {
    if (!formData.leavePolicyId) {
      toast.error('Validation Error', {
        description: 'Please select a leave type',
      });
      return false;
    }
    if (!formData.startDate || !formData.endDate) {
      toast.error('Validation Error', {
        description: 'Please select from and to dates',
      });
      return false;
    }
    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      toast.error('Validation Error', {
        description: 'From date cannot be after to date',
      });
      return false;
    }
    if (!formData.reason.trim()) {
      toast.error('Validation Error', {
        description: 'Please provide a reason for leave',
      });
      return false;
    }
    if (formData.reason.trim().length < 10) {
      toast.error('Validation Error', {
        description: 'Reason must be at least 10 characters',
      });
      return false;
    }
    if (durationIssue) {
      toast.error('Duration Not Permitted', { description: durationIssue });
      return false;
    }
    if (selectedBalance && calculatedDays > selectedBalance.bookableBalance) {
      toast.error('Insufficient Balance', {
        description: `You only have ${formatDays(selectedBalance.bookableBalance)} available`,
      });
      return false;
    }
    if (hasConflict) {
      toast.error('Conflicting Requests', { description: conflictMessage });
      return false;
    }
    return true;
  };

  const isMutating =
    createMutation.isPending ||
    updateMutation.isPending ||
    submitMutation.isPending ||
    cancelMutation.isPending;

  const handleSaveDraft = () => {
    if (!formData.leavePolicyId || !formData.startDate || !formData.endDate) {
      toast.error('Validation Error', {
        description: 'Please fill in leave type and dates before saving draft',
      });
      return;
    }

    if (isEditMode && editRequestId) {
      updateMutation.mutate(
        {
          requestId: Number.parseInt(editRequestId),
          employeeId,
          dto: {
            startDate: formData.startDate,
            startHalfDayType: formData.startHalfDayType,
            endDate: formData.endDate,
            endHalfDayType: formData.endHalfDayType,
            reason: formData.reason || 'Draft',
            contactDuringLeave: formData.contactDuringLeave,
            handoverToId: formData.handoverToId,
            handoverNotes: formData.handoverNotes,
          },
        },
        {
          onSuccess: () => {
            toast.success('Draft Updated', {
              description: 'Your leave request has been updated',
            });
            router.push(routes.workforce.leaves.manage.requests.href);
          },
          onError: (error) => {
            toast.error('Error', {
              description: error.message || 'Failed to update draft',
            });
          },
        }
      );
    } else {
      createMutation.mutate(
        {
          employeeId,
          leavePolicyId: Number.parseInt(formData.leavePolicyId),
          startDate: formData.startDate,
          startHalfDayType: formData.startHalfDayType,
          endDate: formData.endDate,
          endHalfDayType: formData.endHalfDayType,
          reason: formData.reason || 'Draft',
          contactDuringLeave: formData.contactDuringLeave,
          handoverToId: formData.handoverToId,
          handoverNotes: formData.handoverNotes,
          submitImmediately: false,
        },
        {
          onSuccess: () => {
            toast.success('Draft Saved', {
              description: 'Your leave request has been saved as draft',
            });
            router.push(routes.workforce.leaves.manage.requests.href);
          },
          onError: (error) => {
            toast.error('Error', {
              description: error.message || 'Failed to save draft',
            });
          },
        }
      );
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (isEditMode && editRequestId) {
      updateMutation.mutate(
        {
          requestId: Number.parseInt(editRequestId),
          employeeId,
          dto: {
            startDate: formData.startDate,
            startHalfDayType: formData.startHalfDayType,
            endDate: formData.endDate,
            endHalfDayType: formData.endHalfDayType,
            reason: formData.reason,
            contactDuringLeave: formData.contactDuringLeave,
            handoverToId: formData.handoverToId,
            handoverNotes: formData.handoverNotes,
          },
        },
        {
          onSuccess: () => {
            submitMutation.mutate(
              { employeeId, requestId: Number.parseInt(editRequestId) },
              {
                onSuccess: () => {
                  toast.success('Leave Request Submitted', {
                    description: `Your leave request for ${calculatedDays} day(s) has been submitted`,
                  });
                  router.push(routes.workforce.leaves.manage.requests.href);
                },
                onError: (error) => {
                  toast.error('Error', {
                    description: error.message || 'Failed to submit request',
                  });
                },
              }
            );
          },
          onError: (error) => {
            toast.error('Error', {
              description: error.message || 'Failed to update request',
            });
          },
        }
      );
    } else {
      createMutation.mutate(
        {
          employeeId,
          leavePolicyId: Number.parseInt(formData.leavePolicyId),
          startDate: formData.startDate,
          startHalfDayType: formData.startHalfDayType,
          endDate: formData.endDate,
          endHalfDayType: formData.endHalfDayType,
          reason: formData.reason,
          contactDuringLeave: formData.contactDuringLeave,
          handoverToId: formData.handoverToId,
          handoverNotes: formData.handoverNotes,
          submitImmediately: false,
        },
        {
          onSuccess: (createdRequest) => {
            submitMutation.mutate(
              { employeeId, requestId: createdRequest.id },
              {
                onSuccess: () => {
                  toast.success('Leave Request Submitted', {
                    description: `Your leave request for ${calculatedDays} day(s) has been submitted`,
                  });
                  router.push(routes.workforce.leaves.manage.requests.href);
                },
                onError: (error) => {
                  toast.error('Error', {
                    description: error.message || 'Failed to submit request',
                  });
                },
              }
            );
          },
          onError: (error) => {
            toast.error('Error', {
              description: error.message || 'Failed to create request',
            });
          },
        }
      );
    }
  };

  const handleCancelRequest = () => {
    if (!editRequestId) return;

    cancelMutation.mutate(
      {
        requestId: Number.parseInt(editRequestId),
        employeeId,
        reason: cancelReason || undefined,
      },
      {
        onSuccess: () => {
          toast.success('Request Cancelled', {
            description: 'Your leave request has been cancelled',
          });
          setShowCancelDialog(false);
          setCancelReason('');
          router.push(routes.workforce.leaves.manage.requests.href);
        },
        onError: (error) => {
          toast.error('Error', {
            description: error.message || 'Failed to cancel request',
          });
        },
      }
    );
  };

  if (!isFormInitialized) {
    return <FormSkeleton />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        sticky
        title={isEditMode ? 'Edit Leave Request' : 'Apply for Leave'}
        description={
          isEditMode
            ? 'Update your leave request details'
            : 'Submit a new leave request'
        }
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isMutating}
            >
              Back
            </Button>
            {isEditMode && existingRequest && (
              <Button
                type="button"
                variant="destructive"
                onClick={() => setShowCancelDialog(true)}
                disabled={isMutating}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Cancel Request
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={handleSaveDraft}
              disabled={isMutating}
            >
              <Save className="mr-2 h-4 w-4" />
              Save as Draft
            </Button>
            <Button
              type="submit"
              form={LEAVE_FORM_ID}
              disabled={
                isMutating ||
                hasConflict ||
                !!durationIssue ||
                (selectedBalance
                  ? calculatedDays > selectedBalance.bookableBalance
                  : false)
              }
            >
              {isMutating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Submit Request
                </>
              )}
            </Button>
          </>
        }
      />

      <form id={LEAVE_FORM_ID} onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Leave Details
                </CardTitle>
                <CardDescription>
                  Provide information about your leave request
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="leaveType">
                    Leave Type <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    key={`leave-type-${formData.leavePolicyId || 'empty'}`}
                    value={formData.leavePolicyId}
                    onValueChange={updatePolicy}
                    disabled={isEditMode}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select leave type" />
                    </SelectTrigger>
                    <SelectContent>
                      {policies.map((policy) => {
                        const balance = balanceSummary?.balances.find(
                          (b) => b.leavePolicyId === policy.id
                        );
                        return (
                          <SelectItem
                            key={policy.id}
                            value={policy.id.toString()}
                          >
                            {policy.leaveTypeName} (
                            {formatDayCount(balance?.bookableBalance ?? 0)} days available)
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">
                      From Date <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) =>
                        updateDates(e.target.value, formData.endDate)
                      }
                      min={format(new Date(), 'yyyy-MM-dd')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">
                      To Date <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) =>
                        updateDates(formData.startDate, e.target.value)
                      }
                      min={
                        formData.startDate || format(new Date(), 'yyyy-MM-dd')
                      }
                    />
                  </div>
                </div>

                {selectedPolicy?.allowHalfDay && formData.startDate && (
                  <div className="grid gap-4 md:grid-cols-2">
                    {isSingleDay ? (
                      <div className="space-y-2">
                        <Label>Duration</Label>
                        <Select
                          value={
                            formData.startHalfDayType || HalfDayType.FULL_DAY
                          }
                          onValueChange={(value) =>
                            updateHalfDay(
                              'startHalfDayType',
                              value as HalfDayType
                            )
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SINGLE_DAY_OPTIONS.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-2">
                          <Label>First Day</Label>
                          <Select
                            value={
                              formData.startHalfDayType || HalfDayType.FULL_DAY
                            }
                            onValueChange={(value) =>
                              updateHalfDay(
                                'startHalfDayType',
                                value as HalfDayType
                              )
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {RANGE_START_OPTIONS.map((option) => (
                                <SelectItem
                                  key={option.value}
                                  value={option.value}
                                >
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Last Day</Label>
                          <Select
                            value={
                              formData.endHalfDayType || HalfDayType.FULL_DAY
                            }
                            onValueChange={(value) =>
                              updateHalfDay(
                                'endHalfDayType',
                                value as HalfDayType
                              )
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {RANGE_END_OPTIONS.map((option) => (
                                <SelectItem
                                  key={option.value}
                                  value={option.value}
                                >
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {calculatedDays > 0 && (
                  <Alert
                    className={
                      hasConflict ? 'border-destructive' : 'border-blue-500'
                    }
                  >
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="flex items-center justify-between">
                        <span>Total Leave:</span>
                        <span className="text-2xl font-bold">
                          {formatLeaveDays(calculatedDays)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                        Duration:{' '}
                        {describeDuration(halfDaySelection, isSingleDay)}
                      </p>
                      {durationIssue && (
                        <p className="text-destructive mt-2 text-sm">
                          {durationIssue}
                        </p>
                      )}
                      {hasConflict && (
                        <p className="text-destructive mt-2 text-sm">
                          {conflictMessage}
                        </p>
                      )}
                      {selectedBalance &&
                        calculatedDays > selectedBalance.bookableBalance && (
                          <p className="text-destructive mt-2 text-sm">
                            Insufficient balance. You have{' '}
                            {formatDays(selectedBalance.bookableBalance)}{' '}
                            available.
                          </p>
                        )}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="reason">
                    Reason for Leave <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="reason"
                    placeholder="Please provide a detailed reason..."
                    value={formData.reason}
                    onChange={(e) =>
                      setFormData({ ...formData, reason: e.target.value })
                    }
                    rows={4}
                  />
                  <p className="text-muted-foreground text-xs">
                    Minimum 10 characters ({formData.reason.length}/10)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact">Contact During Leave</Label>
                  <PhoneInput
                    id="contact"
                    placeholder="+1 (555) 000-0000"
                    value={formData.contactDuringLeave}
                    onChange={(value) =>
                      setFormData({
                        ...formData,
                        contactDuringLeave: value || '',
                      })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {selectedBalance && <BalanceCard balance={selectedBalance} />}

            {selectedPolicy && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Policy Rules</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Annual Quota</span>
                    <span className="font-medium">
                      {selectedPolicy.annualQuota} days
                    </span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Min Days</span>
                    <span className="font-medium">
                      {selectedPolicy.minDaysPerRequest}
                    </span>
                  </div>
                  <Separator />
                  {selectedPolicy.maxDaysPerRequest && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Max Days</span>
                        <span className="font-medium">
                          {selectedPolicy.maxDaysPerRequest}
                        </span>
                      </div>
                      <Separator />
                    </>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      Advance Notice
                    </span>
                    <span className="font-medium">
                      {selectedPolicy.advanceNoticeDays} days
                    </span>
                  </div>
                  <Separator />
                  <div className="flex items-center gap-2">
                    {selectedPolicy.allowHalfDay ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span>Half-day allowed</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="text-muted-foreground h-4 w-4" />
                        <span>Full days only</span>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </form>

      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Leave Request</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this leave request? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cancel-reason">Reason (Optional)</Label>
              <Textarea
                id="cancel-reason"
                placeholder="Provide a reason for cancelling this request..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCancelDialog(false);
                setCancelReason('');
              }}
              disabled={cancelMutation.isPending}
            >
              Keep Request
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelRequest}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelling...
                </>
              ) : (
                <>
                  <XCircle className="mr-2 h-4 w-4" />
                  Cancel Request
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
