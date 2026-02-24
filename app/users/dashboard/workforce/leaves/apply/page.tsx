'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  useLeavePoliciesByEmployee,
  useEmployeeBalanceSummary,
  useEmployeeRequests,
} from '@/hooks/leave/use-leave';
import {
  useCreateLeaveRequest,
  useUpdateLeaveRequest,
  useSubmitLeaveRequest,
  useCancelLeaveRequest,
  useCalculateDays,
  useCheckConflicts,
} from '@/hooks/leave/use-leave-mutations';
import { HalfDayType } from '@/types/leave';
import { BalanceCard } from '@/features/leave/components/balance-card';
import { toast } from '@/lib/styles/toast-styles';
import { format } from 'date-fns';
import { useCurrentUserEmployee } from '@/hooks/employee';
import { FormSkeleton } from '@/features/leave/components/skeletons';

export default function ApplyLeavePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editRequestId = searchParams.get('edit');
  const isEditMode = !!editRequestId;

  const { data: employee, isLoading: employeeLoading } =
    useCurrentUserEmployee();
  const employeeId = employee?.id;

  const { data: policies, isLoading: policiesLoading } =
    useLeavePoliciesByEmployee(employeeId || 0);
  const { data: balanceSummary } = useEmployeeBalanceSummary(employeeId || 0);
  // Use already-fetched employee requests to find the request for editing
  // instead of calling a separate endpoint (avoids exposing requestId-based access)
  const { data: employeeRequests, isLoading: requestsLoading } =
    useEmployeeRequests(employeeId || 0);
  const existingRequest = isEditMode
    ? employeeRequests?.find((r) => r.id === Number.parseInt(editRequestId!))
    : undefined;
  const requestLoading = isEditMode && (requestsLoading || !employeeId);

  const createMutation = useCreateLeaveRequest();
  const updateMutation = useUpdateLeaveRequest();
  const submitMutation = useSubmitLeaveRequest();
  const cancelMutation = useCancelLeaveRequest();
  const calculateDaysMutation = useCalculateDays();
  const checkConflictsMutation = useCheckConflicts();
  const calculateDays = calculateDaysMutation.mutate;
  const checkConflicts = checkConflictsMutation.mutate;

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

  const [formData, setFormData] = useState(defaultFormData);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

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

  const [calculatedDays, setCalculatedDays] = useState(0);
  const [hasConflict, setHasConflict] = useState(false);
  const [conflictMessage, setConflictMessage] = useState('');

  const selectedPolicy = policies?.find(
    (p) => p.id.toString() === formData.leavePolicyId
  );

  const selectedBalance = balanceSummary?.balances.find(
    (b) => b.leavePolicyId.toString() === formData.leavePolicyId
  );

  const isSingleDay =
    formData.startDate && formData.startDate === formData.endDate;

  // Calculate days whenever dates change
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

      // Check conflicts
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
    if (selectedBalance && calculatedDays > selectedBalance.bookableBalance) {
      toast.error('Insufficient Balance', {
        description: `You only have ${selectedBalance.bookableBalance} days available`,
      });
      return false;
    }
    if (hasConflict) {
      toast.error('Conflicting Requests', {
        description: conflictMessage,
      });
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
    if (!employeeId) {
      toast.error('Error', {
        description: 'Employee information not loaded',
      });
      return;
    }

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
          employeeId: employeeId!,
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
            router.push('/users/dashboard/workforce/leaves/requests');
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
            router.push('/users/dashboard/workforce/leaves');
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

    if (!employeeId) {
      toast.error('Error', {
        description: 'Employee information not loaded',
      });
      return;
    }

    if (!validateForm()) return;

    if (isEditMode && editRequestId) {
      // Edit mode: First update using PATCH, then submit
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
            // Then submit it for approval using the submit endpoint
            submitMutation.mutate(
              { employeeId, requestId: Number.parseInt(editRequestId) },
              {
                onSuccess: () => {
                  toast.success('Leave Request Submitted', {
                    description: `Your leave request for ${calculatedDays} day(s) has been submitted`,
                  });
                  router.push('/users/dashboard/workforce/leaves/requests');
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
      // Create mode: First create as draft, then submit
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
            // Then submit it for approval using the submit endpoint
            submitMutation.mutate(
              { employeeId, requestId: createdRequest.id },
              {
                onSuccess: () => {
                  toast.success('Leave Request Submitted', {
                    description: `Your leave request for ${calculatedDays} day(s) has been submitted`,
                  });
                  router.push('/users/dashboard/workforce/leaves');
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
    if (!employeeId || !editRequestId) return;

    cancelMutation.mutate(
      {
        requestId: Number.parseInt(editRequestId),
        employeeId: employeeId,
        reason: cancelReason || undefined,
      },
      {
        onSuccess: () => {
          toast.success('Request Cancelled', {
            description: 'Your leave request has been cancelled',
          });
          setShowCancelDialog(false);
          setCancelReason('');
          router.push('/users/dashboard/workforce/leaves/requests');
        },
        onError: (error) => {
          toast.error('Error', {
            description: error.message || 'Failed to cancel request',
          });
        },
      }
    );
  };

  if (employeeLoading || policiesLoading || (isEditMode && requestLoading)) {
    return <FormSkeleton />;
  }

  if (!employee) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-red-500">Employee profile not found</p>
          <p className="text-muted-foreground mt-2 text-sm">
            Please ensure your employee profile is set up correctly
          </p>
        </div>
      </div>
    );
  }

  // In edit mode, ensure we have loaded the existing request
  if (isEditMode && !existingRequest) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-red-500">Leave request not found</p>
          <p className="text-muted-foreground mt-2 text-sm">
            The leave request you&apos;re trying to edit could not be found
          </p>
        </div>
      </div>
    );
  }

  // Wait for form to be initialized in edit mode
  if (!isFormInitialized) {
    return <FormSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {isEditMode ? 'Edit Leave Request' : 'Apply for Leave'}
        </h1>
        <p className="text-muted-foreground">
          {isEditMode
            ? 'Update your leave request details'
            : 'Submit a new leave request'}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {/* Leave Details */}
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
                    onValueChange={(value) =>
                      setFormData({ ...formData, leavePolicyId: value })
                    }
                    disabled={isEditMode}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select leave type" />
                    </SelectTrigger>
                    <SelectContent>
                      {policies?.map((policy) => {
                        const balance = balanceSummary?.balances.find(
                          (b) => b.leavePolicyId === policy.id
                        );
                        return (
                          <SelectItem
                            key={policy.id}
                            value={policy.id.toString()}
                          >
                            {policy.leaveTypeName} (
                            {balance?.bookableBalance || 0} days available)
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
                        setFormData({ ...formData, startDate: e.target.value })
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
                        setFormData({ ...formData, endDate: e.target.value })
                      }
                      min={
                        formData.startDate || format(new Date(), 'yyyy-MM-dd')
                      }
                    />
                  </div>
                </div>

                {isSingleDay && selectedPolicy?.allowHalfDay && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Start Day Type</Label>
                      <Select
                        value={
                          formData.startHalfDayType || HalfDayType.FULL_DAY
                        }
                        onValueChange={(value) =>
                          setFormData({
                            ...formData,
                            startHalfDayType: value as HalfDayType,
                            endHalfDayType: value as HalfDayType,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={HalfDayType.FULL_DAY}>
                            Full Day
                          </SelectItem>
                          <SelectItem value={HalfDayType.FIRST_HALF}>
                            First Half
                          </SelectItem>
                          <SelectItem value={HalfDayType.SECOND_HALF}>
                            Second Half
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
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
                        <span>Total Leave Days:</span>
                        <span className="text-2xl font-bold">
                          {calculatedDays}
                        </span>
                      </div>
                      {hasConflict && (
                        <p className="text-destructive mt-2 text-sm">
                          {conflictMessage}
                        </p>
                      )}
                      {selectedBalance &&
                        calculatedDays > selectedBalance.bookableBalance && (
                          <p className="text-destructive mt-2 text-sm">
                            Insufficient balance. You have{' '}
                            {selectedBalance.bookableBalance} days available.
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
                  <Input
                    id="contact"
                    placeholder="+91-9876543210"
                    value={formData.contactDuringLeave}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contactDuringLeave: e.target.value,
                      })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-3">
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
                disabled={
                  isMutating ||
                  hasConflict ||
                  (selectedBalance
                    ? calculatedDays > selectedBalance.bookableBalance
                    : false)
                }
                className="ml-auto"
              >
                {isMutating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                {isMutating ? 'Submitting...' : 'Submit Request'}
              </Button>
            </div>
          </div>

          {/* Sidebar */}
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

      {/* Cancel Request Dialog */}
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
