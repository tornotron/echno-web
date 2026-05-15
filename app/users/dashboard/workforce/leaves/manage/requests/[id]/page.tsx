/**
 * app/users/dashboard/workforce/leaves/manage/requests/[id]/page.tsx
 *
 * Leave request details page with full information
 */

'use client';

import { use, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';
import { Badge } from '@/components/shadcn/badge';
import { Separator } from '@/components/shadcn/separator';
import { Textarea } from '@/components/shadcn/textarea';
import { Label } from '@/components/shadcn/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/shadcn/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/select';
import {
  Calendar,
  User,
  Clock,
  FileText,
  ArrowLeft,
  Check,
  X,
  Loader2,
  MessageSquare,
  Phone,
  UserCheck,
  AlertCircle,
  XCircle,
  Forward,
} from 'lucide-react';
import { format } from 'date-fns';
import { LeaveStatusBadge } from '@/features/leave/components/leave-status-badge';
import { PhoneDisplay } from '@/components/shadcn/phone-input';
import {
  useLeaveRequest,
  useEmployeeRequests,
  useCanApprove,
} from '@/hooks/leave/use-leave';
import {
  useApproveLeaveRequest,
  useRejectLeaveRequest,
  useCancelLeaveRequest,
  useDelegateApproval,
} from '@/hooks/leave/use-leave-mutations';
import { useManagers } from '@/hooks/employee';
import { useCurrentUserEmployee } from '@/hooks/employee';
import { LeaveStatus, ApprovalAction } from '@/types/leave';
import { toast } from '@/lib/styles/toast-styles';
import { useLeaveRole } from '@/hooks/leave/use-leave-role';
import { PageHeader } from '@/components/common';
import { routes } from '@/nav';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function LeaveRequestDetailsPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const requestId = Number.parseInt(resolvedParams.id);
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from');

  const backUrlMap: Record<string, string> = {
    'my-requests': `${routes.workforce.leaves.manage.requests.href}?tab=my`,
    'org-requests': `${routes.workforce.leaves.manage.requests.href}?tab=all`,
    approvals: `${routes.workforce.leaves.manage.requests.href}?tab=approvals`,
    'employee-dashboard': routes.workforce.leaves.manage.href,
    'manager-dashboard': routes.workforce.leaves.manage.href,
    'admin-dashboard': routes.workforce.leaves.manage.href,
  };
  const backUrl = from ? backUrlMap[from] : null;

  const { data: employee } = useCurrentUserEmployee();
  const { canApprove: hasApprovalPermission } = useLeaveRole();
  const employeeId = employee?.id || 0;

  // For normal employees, fetch from their own requests list (accessible endpoint)
  // For managers/admins, use the general request endpoint
  const { data: adminRequest, isLoading: adminRequestLoading } =
    useLeaveRequest(requestId, hasApprovalPermission);
  const { data: employeeRequests, isLoading: employeeRequestsLoading } =
    useEmployeeRequests(
      employeeId,
      undefined,
      undefined,
      !hasApprovalPermission
    );
  const employeeRequest = employeeRequests?.find((r) => r.id === requestId);

  const request = hasApprovalPermission ? adminRequest : employeeRequest;
  const requestLoading = hasApprovalPermission
    ? adminRequestLoading
    : employeeRequestsLoading;

  // Use approvals from the request object itself (available to all users)
  const approvalHistory = request?.approvals || [];

  const { data: canApproveData } = useCanApprove(
    requestId,
    employeeId,
    hasApprovalPermission
  );

  const [approveComments, setApproveComments] = useState('');
  const [rejectComments, setRejectComments] = useState('');
  const [delegateComments, setDelegateComments] = useState('');
  const [delegateToId, setDelegateToId] = useState('');
  const [showApproveForm, setShowApproveForm] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [showDelegateForm, setShowDelegateForm] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const approveMutation = useApproveLeaveRequest();
  const rejectMutation = useRejectLeaveRequest();
  const cancelMutation = useCancelLeaveRequest();
  const delegateMutation = useDelegateApproval();

  const { data: managers = [], isLoading: managersLoading } = useManagers();

  const isLoading = requestLoading;
  const canApproveRequest = hasApprovalPermission && canApproveData?.canApprove;

  const handleApprove = async () => {
    if (!request || !employeeId) return;

    try {
      await approveMutation.mutateAsync({
        requestId: request.id,
        dto: {
          approverId: employeeId,
          comments: approveComments || undefined,
        },
      });

      toast.success('Leave request approved successfully');
      setShowApproveForm(false);
      setApproveComments('');
      router.push(
        `${routes.workforce.leaves.manage.requests.href}?tab=approvals`
      );
    } catch (error) {
      toast.error('Failed to approve leave request');
      console.error('Approve error:', error);
    }
  };

  const handleReject = async () => {
    if (!request || !employeeId) return;

    if (!rejectComments.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    try {
      await rejectMutation.mutateAsync({
        requestId: request.id,
        dto: {
          approverId: employeeId,
          comments: rejectComments,
        },
      });

      toast.success('Leave request rejected');
      setShowRejectForm(false);
      setRejectComments('');
      router.push(
        `${routes.workforce.leaves.manage.requests.href}?tab=approvals`
      );
    } catch (error) {
      toast.error('Failed to reject leave request');
      console.error('Reject error:', error);
    }
  };

  const handleDelegate = async () => {
    if (!request || !employeeId || !delegateToId) return;

    try {
      await delegateMutation.mutateAsync({
        requestId: request.id,
        dto: {
          approverId: employeeId,
          comments: delegateComments || undefined,
          delegateToId: Number.parseInt(delegateToId),
        },
      });

      toast.success('Leave request delegated successfully');
      setShowDelegateForm(false);
      setDelegateComments('');
      setDelegateToId('');
      router.push(
        `${routes.workforce.leaves.manage.requests.href}?tab=approvals`
      );
    } catch (error) {
      toast.error('Failed to delegate leave request');
      console.error('Delegate error:', error);
    }
  };

  const handleCancelRequest = async () => {
    if (!request || !employeeId) return;

    try {
      await cancelMutation.mutateAsync({
        requestId: request.id,
        employeeId,
        reason: cancelReason || undefined,
      });

      toast.success('Leave request cancelled successfully');
      setShowCancelDialog(false);
      setCancelReason('');

      // Navigate back based on where user came from
      if (backUrl) {
        router.push(backUrl);
      } else {
        router.push(routes.workforce.leaves.manage.requests.href);
      }
    } catch (error) {
      toast.error('Failed to cancel leave request');
      console.error('Cancel error:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-red-500">Leave request not found</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => (backUrl ? router.push(backUrl) : router.back())}
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const isPending = request.status === LeaveStatus.PENDING_APPROVAL;
  const isDraft = request.status === LeaveStatus.DRAFT;
  const canEdit = isDraft && request.employeeId === employeeId;
  const canCancel =
    request.employeeId === employeeId &&
    (request.status === LeaveStatus.PENDING_APPROVAL ||
      request.status === LeaveStatus.APPROVED);

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Leave Request Details"
        description={`Request #${request.requestNumber}`}
        badge={<LeaveStatusBadge status={request.status} />}
        actions={
          canEdit && (
            <Button
              variant="outline"
              onClick={() =>
                router.push(
                  `${routes.workforce.leaves.manage.requests.new}?edit=${request.id}`
                )
              }
            >
              Edit Request
            </Button>
          )
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Leave Details Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">
                Leave Information
              </CardTitle>
              <CardDescription className="text-xs">
                Details about the leave request
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Employee Info */}
              <div className="flex items-center gap-3">
                <User className="text-muted-foreground h-5 w-5" />
                <div>
                  <p className="text-muted-foreground text-sm">Employee</p>
                  <p className="font-medium">{request.employeeName || 'N/A'}</p>
                </div>
              </div>

              <Separator />

              {/* Leave Type */}
              <div>
                <p className="text-muted-foreground mb-2 text-sm">Leave Type</p>
                <Badge variant="outline" className="text-xm">
                  {request.leaveTypeName || 'N/A'}
                </Badge>
              </div>

              <Separator />

              {/* Date Range */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-start gap-3">
                  <Calendar className="text-muted-foreground mt-0.5 h-5 w-5" />
                  <div>
                    <p className="text-muted-foreground text-sm">Start Date</p>
                    <p className="font-medium">
                      {format(request.startDate, 'MMMM dd, yyyy')}
                    </p>
                    {request.startHalfDayType && (
                      <Badge variant="secondary" className="mt-1">
                        {request.startHalfDayType}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="text-muted-foreground mt-0.5 h-5 w-5" />
                  <div>
                    <p className="text-muted-foreground text-sm">End Date</p>
                    <p className="font-medium">
                      {format(request.endDate, 'MMMM dd, yyyy')}
                    </p>
                    {request.endHalfDayType && (
                      <Badge variant="secondary" className="mt-1">
                        {request.endHalfDayType}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="text-muted-foreground h-5 w-5" />
                <div>
                  <p className="text-muted-foreground text-sm">
                    Total Duration
                  </p>
                  <p className="text-primary text-2xl font-bold">
                    {request.totalDays}{' '}
                    {request.totalDays === 1 ? 'day' : 'days'}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Reason */}
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <FileText className="text-muted-foreground h-4 w-4" />
                  <p className="text-sm font-medium">Reason for Leave</p>
                </div>
                <p className="text-muted-foreground text-sm whitespace-pre-wrap">
                  {request.reason || 'No reason provided'}
                </p>
              </div>

              {/* Contact Info */}
              {request.contactDuringLeave && (
                <>
                  <Separator />
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <Phone className="text-muted-foreground h-4 w-4" />
                      <p className="text-sm font-medium">
                        Contact During Leave
                      </p>
                    </div>
                    <PhoneDisplay
                      value={request.contactDuringLeave}
                      asLink
                      className="text-muted-foreground"
                    />
                  </div>
                </>
              )}

              {/* Handover Info */}
              {request.handoverToName && (
                <>
                  <Separator />
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <UserCheck className="text-muted-foreground h-4 w-4" />
                      <p className="text-sm font-medium">Handover To</p>
                    </div>
                    <p className="mb-2 font-medium">{request.handoverToName}</p>
                    {request.handoverNotes && (
                      <p className="text-muted-foreground text-sm whitespace-pre-wrap">
                        {request.handoverNotes}
                      </p>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Approval Actions - For Approvers Only */}
          {canApproveRequest && isPending && (
            <Card className="border-yellow-500/50 bg-yellow-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  Action Required
                </CardTitle>
                <CardDescription className="text-xs">
                  You can approve, reject, or delegate this leave request
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!showApproveForm && !showRejectForm && !showDelegateForm && (
                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      onClick={() => {
                        setShowApproveForm(true);
                        setShowRejectForm(false);
                        setShowDelegateForm(false);
                      }}
                    >
                      <Check className="mr-2 h-4 w-4" />
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => {
                        setShowRejectForm(true);
                        setShowApproveForm(false);
                        setShowDelegateForm(false);
                      }}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setShowDelegateForm(true);
                        setShowApproveForm(false);
                        setShowRejectForm(false);
                      }}
                    >
                      <Forward className="mr-2 h-4 w-4" />
                      Delegate
                    </Button>
                  </div>
                )}

                {showApproveForm && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="approve-comments">
                        Comments (Optional)
                      </Label>
                      <Textarea
                        id="approve-comments"
                        placeholder="Add any comments for approval..."
                        value={approveComments}
                        onChange={(e) => setApproveComments(e.target.value)}
                        rows={3}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleApprove}
                        disabled={approveMutation.isPending}
                      >
                        {approveMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Approving...
                          </>
                        ) : (
                          <>
                            <Check className="mr-2 h-4 w-4" />
                            Confirm Approval
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowApproveForm(false);
                          setApproveComments('');
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {showRejectForm && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="reject-comments">
                        Reason for Rejection *
                      </Label>
                      <Textarea
                        id="reject-comments"
                        placeholder="Please provide a reason for rejection..."
                        value={rejectComments}
                        onChange={(e) => setRejectComments(e.target.value)}
                        rows={3}
                        required
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="destructive"
                        onClick={handleReject}
                        disabled={
                          rejectMutation.isPending || !rejectComments.trim()
                        }
                      >
                        {rejectMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Rejecting...
                          </>
                        ) : (
                          <>
                            <X className="mr-2 h-4 w-4" />
                            Confirm Rejection
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowRejectForm(false);
                          setRejectComments('');
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {showDelegateForm && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="delegate-to">
                        Delegate To <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={delegateToId}
                        onValueChange={setDelegateToId}
                      >
                        <SelectTrigger id="delegate-to">
                          <SelectValue
                            placeholder={
                              managersLoading
                                ? 'Loading managers...'
                                : 'Select a manager'
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {managers
                            .filter((m) => m.id !== employeeId)
                            .map((manager) => (
                              <SelectItem
                                key={manager.id}
                                value={manager.id?.toString() || ''}
                              >
                                {manager.name} - {manager.designation}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="delegate-comments">
                        Comments (Optional)
                      </Label>
                      <Textarea
                        id="delegate-comments"
                        placeholder="Add optional comments for the delegated manager..."
                        value={delegateComments}
                        onChange={(e) => setDelegateComments(e.target.value)}
                        rows={3}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleDelegate}
                        disabled={delegateMutation.isPending || !delegateToId}
                      >
                        {delegateMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Delegating...
                          </>
                        ) : (
                          <>
                            <Forward className="mr-2 h-4 w-4" />
                            Confirm Delegation
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowDelegateForm(false);
                          setDelegateComments('');
                          setDelegateToId('');
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Request Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">
                Request Information
              </CardTitle>
              <CardDescription className="text-xs">
                Metadata about this leave request
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-muted-foreground text-sm">Request Number</p>
                <p className="font-mono font-medium">{request.requestNumber}</p>
              </div>
              <Separator />
              <div>
                <p className="text-muted-foreground text-sm">Status</p>
                <div className="mt-1">
                  <LeaveStatusBadge status={request.status} />
                </div>
              </div>
              {request.submittedAt && (
                <>
                  <Separator />
                  <div>
                    <p className="text-muted-foreground text-sm">Submitted</p>
                    <p className="text-sm font-medium">
                      {format(request.submittedAt, 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                </>
              )}
              {request.approvedAt && (
                <>
                  <Separator />
                  <div>
                    <p className="text-muted-foreground text-sm">Approved</p>
                    <p className="text-sm font-medium">
                      {format(request.approvedAt, 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                </>
              )}
              {request.rejectedAt && (
                <>
                  <Separator />
                  <div>
                    <p className="text-muted-foreground text-sm">Rejected</p>
                    <p className="text-sm font-medium">
                      {format(request.rejectedAt, 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Approval History Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">
                Approval History
              </CardTitle>
              <CardDescription className="text-xs">
                Timeline of approval actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {approvalHistory && approvalHistory.length > 0 ? (
                <div className="space-y-4">
                  {approvalHistory.map((approval, index) => (
                    <div key={approval.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div
                          className={`rounded-full p-2 ${
                            approval.action === ApprovalAction.APPROVED
                              ? 'bg-green-100'
                              : approval.action === ApprovalAction.REJECTED
                                ? 'bg-red-100'
                                : 'bg-yellow-100'
                          }`}
                        >
                          {approval.action === ApprovalAction.APPROVED ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : approval.action === ApprovalAction.REJECTED ? (
                            <X className="h-4 w-4 text-red-600" />
                          ) : (
                            <Clock className="h-4 w-4 text-yellow-600" />
                          )}
                        </div>
                        {index < approvalHistory.length - 1 && (
                          <div className="bg-border mt-2 h-full w-px" />
                        )}
                      </div>

                      <div className="flex-1 pb-4">
                        <div className="mb-1 flex items-center justify-between">
                          <p className="font-medium">
                            {approval.approverName || 'Unknown Approver'}
                          </p>
                          <Badge
                            variant={
                              approval.action === ApprovalAction.APPROVED
                                ? 'default'
                                : approval.action === ApprovalAction.REJECTED
                                  ? 'destructive'
                                  : 'secondary'
                            }
                          >
                            {approval.action}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground text-sm">
                          Level {approval.approvalLevel}
                          {approval.actionAt &&
                            ` • ${format(approval.actionAt, 'MMM dd, yyyy HH:mm')}`}
                        </p>
                        {approval.comments && (
                          <div className="bg-muted mt-2 rounded-lg p-3">
                            <div className="flex items-start gap-2">
                              <MessageSquare className="text-muted-foreground mt-0.5 h-4 w-4" />
                              <p className="text-sm">{approval.comments}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Clock className="text-muted-foreground mb-2 h-8 w-8" />
                  <p className="text-muted-foreground">
                    No approval history yet
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => router.back()}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
              {canEdit && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() =>
                    router.push(
                      `${routes.workforce.leaves.manage.requests.new}?edit=${request.id}`
                    )
                  }
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Edit Request
                </Button>
              )}
              {canCancel && (
                <Button
                  variant="destructive"
                  className="w-full justify-start"
                  onClick={() => setShowCancelDialog(true)}
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
              )}
            </CardContent>
          </Card>
        </div>
      </div>

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
