'use client';

import { useState, useEffect, use } from 'react';
import { useAuthorization } from '@/hooks/use-authorization';
import { redirect, useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Shield,
  Clock,
  User,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  MessageSquare,
  UserCog,
  Key,
  ChevronDown,
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  AccessRequest,
  AccessRequestStatus,
  AccessRequestType,
  getStatusLabel,
  getStatusColor,
  getPriorityLabel,
  getPriorityColor,
  getTypeLabel,
  getRequestSummary,
  canReviewRequest,
} from '@/types/access-request';
import { toast } from '@/lib/styles/toast-styles';
import { RESOURCES, RESOURCE_SCOPES } from '@/lib/rbac/resource-permissions';
import { mockAccessRequests } from '@/components/shared/data/access-requests';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AdminAccessRequestDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { isSystemAdmin, isLoading: authLoading } = useAuthorization();

  const [request, setRequest] = useState<AccessRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [reviewerComments, setReviewerComments] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [showApproveOptions, setShowApproveOptions] = useState(false);

  // Permission assignment state
  const [grantPermission, setGrantPermission] = useState(true);
  const [selectedResource, setSelectedResource] = useState('');
  const [selectedScope, setSelectedScope] = useState('');

  const resourceList = Object.values(RESOURCES).filter(
    (r) => r !== 'Default Resource'
  );
  const scopeList = Object.values(RESOURCE_SCOPES);

  // Redirect if not system admin
  if (!authLoading && !isSystemAdmin) {
    redirect('/users/dashboard');
  }

  // Load request from mock data
  useEffect(() => {
    if (authLoading || !isSystemAdmin) return;

    const timer = setTimeout(() => {
      const foundRequest = mockAccessRequests.find((r) => r.id === id);
      if (foundRequest) {
        setRequest(foundRequest);
        // Initialize permission fields based on request type
        if (
          foundRequest.type === AccessRequestType.RESOURCE &&
          foundRequest.resourceName
        ) {
          setSelectedResource(foundRequest.resourceName);
          setSelectedScope(foundRequest.resourceScope || 'read');
        }
      } else {
        toast.error('Error', {
          description: 'Access request not found',
        });
        router.push('/admin/access-requests');
      }
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [id, router, authLoading, isSystemAdmin]);

  // Handle approve (simulated with mock data)
  const handleApprove = async () => {
    if (!request) return;

    setActionLoading(true);
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    const successMessage =
      grantPermission && selectedResource && selectedScope
        ? `Request approved and ${selectedResource}:${selectedScope} permission granted`
        : 'The access request has been approved';

    // Update local state to simulate approval
    const now = new Date();
    setRequest({
      ...request,
      status: AccessRequestStatus.APPROVED,
      reviewedAt: now,
      reviewerName: 'Admin User',
      reviewedBy: '1',
      reviewerComments: reviewerComments || 'Request approved.',
      updatedAt: now,
    });

    toast.success('Request Approved', {
      description: successMessage,
    });

    setShowApproveOptions(false);
    setActionLoading(false);
  };

  // Handle reject (simulated with mock data)
  const handleReject = async () => {
    if (!request) return;

    if (!rejectReason.trim()) {
      toast.error('Validation Error', {
        description: 'Please provide a reason for rejection',
      });
      return;
    }

    setActionLoading(true);
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Update local state to simulate rejection
    const now = new Date();
    setRequest({
      ...request,
      status: AccessRequestStatus.REJECTED,
      reviewedAt: now,
      reviewerName: 'Admin User',
      reviewedBy: '1',
      reviewerComments: rejectReason,
      updatedAt: now,
    });

    toast.success('Request Rejected', {
      description: 'The access request has been rejected',
    });

    setShowRejectForm(false);
    setActionLoading(false);
    setRejectReason('');
  };

  // Cancel reject
  const handleCancelReject = () => {
    setShowRejectForm(false);
    setRejectReason('');
  };

  // Handle assign to self (simulated with mock data)
  const handleAssignToSelf = async () => {
    if (!request) return;

    setActionLoading(true);
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Update local state to simulate assignment
    setRequest({
      ...request,
      status: AccessRequestStatus.UNDER_REVIEW,
      assignedTo: '1',
      assignedToName: 'Admin User',
      updatedAt: new Date(),
    });

    toast.success('Request Assigned', {
      description: 'You have been assigned to review this request',
    });

    setActionLoading(false);
  };

  if (authLoading || loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4">
        <AlertCircle className="h-12 w-12 text-zinc-400" />
        <p className="text-zinc-500">Access request not found</p>
        <Link href="/admin/access-requests">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Requests
          </Button>
        </Link>
      </div>
    );
  }

  const canReview = canReviewRequest(request);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Review Access Request
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {getRequestSummary(request)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getStatusColor(request.status)}>
            {getStatusLabel(request.status)}
          </Badge>
          <Badge className={getPriorityColor(request.priority)}>
            {getPriorityLabel(request.priority)}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Request Details Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Request Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Type & Target */}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Request Type
                  </p>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">
                    {getTypeLabel(request.type)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Requested Access
                  </p>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">
                    {getRequestSummary(request)}
                  </p>
                </div>
              </div>

              {/* Duration */}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Duration
                  </p>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">
                    {request.requestedDuration === 'temporary'
                      ? 'Temporary'
                      : 'Permanent'}
                  </p>
                </div>
                {request.expiresAt && (
                  <div>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      Expires On
                    </p>
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                      {format(request.expiresAt, 'dd MMM yyyy')}
                    </p>
                  </div>
                )}
              </div>

              {/* Reason */}
              <div>
                <p className="mb-2 text-sm text-zinc-500 dark:text-zinc-400">
                  Reason
                </p>
                <p className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 whitespace-pre-wrap text-zinc-900 dark:border-zinc-800 dark:bg-zinc-800/50 dark:text-zinc-100">
                  {request.reason}
                </p>
              </div>

              {/* Business Justification */}
              {request.businessJustification && (
                <div>
                  <p className="mb-2 text-sm text-zinc-500 dark:text-zinc-400">
                    Business Justification
                  </p>
                  <p className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 whitespace-pre-wrap text-zinc-900 dark:border-zinc-800 dark:bg-zinc-800/50 dark:text-zinc-100">
                    {request.businessJustification}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Reviewer Response (if reviewed) */}
          {request.reviewerComments && (
            <Card
              className={
                request.status === AccessRequestStatus.APPROVED
                  ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                  : request.status === AccessRequestStatus.REJECTED
                    ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
                    : ''
              }
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <MessageSquare className="h-4 w-4" />
                  Reviewer Response
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 whitespace-pre-wrap">
                  {request.reviewerComments}
                </p>
                {request.reviewerName && request.reviewedAt && (
                  <p className="text-sm text-zinc-500">
                    — {request.reviewerName},{' '}
                    {format(request.reviewedAt, 'dd MMM yyyy HH:mm')}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Review Actions */}
          {canReview && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCog className="h-5 w-5" />
                  Review Decision
                </CardTitle>
                <CardDescription>
                  Approve or reject this access request
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Assign to self button */}
                {request.status === AccessRequestStatus.PENDING && (
                  <Button
                    variant="outline"
                    onClick={handleAssignToSelf}
                    disabled={actionLoading}
                    className="w-full"
                  >
                    <UserCog className="mr-2 h-4 w-4" />
                    {actionLoading
                      ? 'Assigning...'
                      : 'Take Ownership & Start Review'}
                  </Button>
                )}

                {/* Rejection Form (expandable) */}
                {showRejectForm ? (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
                    <h4 className="mb-3 flex items-center gap-2 font-medium text-red-800 dark:text-red-200">
                      <XCircle className="h-4 w-4" />
                      Reject Access Request
                    </h4>
                    <div className="mb-4 space-y-2">
                      <Label htmlFor="rejectReason">
                        Reason for Rejection{' '}
                        <span className="text-red-500">*</span>
                      </Label>
                      <Textarea
                        id="rejectReason"
                        placeholder="Explain why this request is being rejected..."
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        rows={3}
                        className="resize-none"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={handleCancelReject}
                        disabled={actionLoading}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleReject}
                        disabled={actionLoading || !rejectReason.trim()}
                        className="flex-1"
                      >
                        {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
                      </Button>
                    </div>
                  </div>
                ) : showApproveOptions ? (
                  /* Approval Options (expandable) */
                  <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
                    <h4 className="mb-3 flex items-center gap-2 font-medium text-green-800 dark:text-green-200">
                      <CheckCircle className="h-4 w-4" />
                      Approve Access Request
                    </h4>

                    {/* Permission Assignment */}
                    <div className="mb-4 rounded-lg border border-green-100 bg-white p-4 dark:border-green-800 dark:bg-zinc-900">
                      <div className="mb-3 flex items-center gap-2">
                        <Checkbox
                          id="grantPermission"
                          checked={grantPermission}
                          onCheckedChange={(checked) =>
                            setGrantPermission(checked as boolean)
                          }
                        />
                        <Label
                          htmlFor="grantPermission"
                          className="flex cursor-pointer items-center gap-2"
                        >
                          <Key className="h-4 w-4" />
                          Grant permission upon approval
                        </Label>
                      </div>

                      {grantPermission && (
                        <div className="mt-3 space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <Select
                              value={selectedResource}
                              onValueChange={setSelectedResource}
                            >
                              <SelectTrigger className="w-[160px]">
                                <SelectValue placeholder="Resource" />
                              </SelectTrigger>
                              <SelectContent>
                                {resourceList.map((resource) => (
                                  <SelectItem key={resource} value={resource}>
                                    {resource.charAt(0).toUpperCase() +
                                      resource.slice(1)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <span className="text-zinc-400">:</span>
                            <Select
                              value={selectedScope}
                              onValueChange={setSelectedScope}
                            >
                              <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="Scope" />
                              </SelectTrigger>
                              <SelectContent>
                                {scopeList.map((scope) => (
                                  <SelectItem key={scope} value={scope}>
                                    {scope.charAt(0).toUpperCase() +
                                      scope.slice(1)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          {selectedResource && selectedScope && (
                            <p className="text-xs text-green-700 dark:text-green-300">
                              Will grant{' '}
                              <code className="rounded bg-green-100 px-1 py-0.5 dark:bg-green-800">
                                {selectedResource}:{selectedScope}
                              </code>{' '}
                              permission to {request.requesterName}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Comments */}
                    <div className="mb-4 space-y-2">
                      <Label htmlFor="comments">Comments (Optional)</Label>
                      <Textarea
                        id="comments"
                        placeholder="Add any comments for the requester..."
                        value={reviewerComments}
                        onChange={(e) => setReviewerComments(e.target.value)}
                        rows={2}
                        className="resize-none"
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setShowApproveOptions(false)}
                        disabled={actionLoading}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleApprove}
                        disabled={
                          actionLoading ||
                          (grantPermission &&
                            (!selectedResource || !selectedScope))
                        }
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        {actionLoading ? 'Approving...' : 'Confirm Approval'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* Default Action Buttons */
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="comments">Comments (Optional)</Label>
                      <Textarea
                        id="comments"
                        placeholder="Add any comments for the requester..."
                        value={reviewerComments}
                        onChange={(e) => setReviewerComments(e.target.value)}
                        rows={3}
                        className="resize-none"
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button
                        variant="destructive"
                        className="flex-1"
                        onClick={() => setShowRejectForm(true)}
                        disabled={actionLoading}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Reject
                      </Button>
                      <Button
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        onClick={() => setShowApproveOptions(true)}
                        disabled={actionLoading}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Approve
                        <ChevronDown className="ml-1 h-4 w-4" />
                      </Button>
                    </div>

                    <p className="text-center text-xs text-zinc-500">
                      Click Approve to configure permission settings before
                      confirmation.
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Back Button */}
          <div className="flex gap-3">
            <Link href="/admin/access-requests">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Requests
              </Button>
            </Link>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Requester Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4" />
                Requester
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-linear-to-br from-zinc-400 to-zinc-600">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">
                    {request.requesterName}
                  </p>
                  <p className="text-sm text-zinc-500">
                    {request.requesterEmail}
                  </p>
                </div>
              </div>
              <div className="h-px bg-zinc-200 dark:bg-zinc-800" />
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  User ID
                </p>
                <code className="text-xs text-zinc-900 dark:text-zinc-100">
                  {request.requesterId}
                </code>
              </div>
            </CardContent>
          </Card>

          {/* Timeline Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1 h-2 w-2 rounded-full bg-zinc-300 dark:bg-zinc-600" />
                  <div>
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      Created
                    </p>
                    <p className="text-xs text-zinc-500">
                      {format(request.createdAt, 'dd MMM yyyy HH:mm')}
                    </p>
                  </div>
                </div>

                {request.submittedAt && (
                  <div className="flex items-start gap-3">
                    <div className="mt-1 h-2 w-2 rounded-full bg-blue-500" />
                    <div>
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        Submitted
                      </p>
                      <p className="text-xs text-zinc-500">
                        {format(request.submittedAt, 'dd MMM yyyy HH:mm')}
                      </p>
                    </div>
                  </div>
                )}

                {request.status === AccessRequestStatus.UNDER_REVIEW && (
                  <div className="flex items-start gap-3">
                    <div className="mt-1 h-2 w-2 rounded-full bg-yellow-500" />
                    <div>
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        Under Review
                      </p>
                      <p className="text-xs text-zinc-500">In progress</p>
                    </div>
                  </div>
                )}

                {request.reviewedAt && (
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-1 h-2 w-2 rounded-full ${
                        request.status === AccessRequestStatus.APPROVED
                          ? 'bg-green-500'
                          : request.status === AccessRequestStatus.REJECTED
                            ? 'bg-red-500'
                            : 'bg-yellow-500'
                      }`}
                    />
                    <div>
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {getStatusLabel(request.status)}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {format(request.reviewedAt, 'dd MMM yyyy HH:mm')}
                      </p>
                      {request.reviewerName && (
                        <p className="text-xs text-zinc-500">
                          by {request.reviewerName}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Request ID Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-500 dark:text-zinc-400">
                  Request ID
                </span>
                <code className="text-xs text-zinc-900 dark:text-zinc-100">
                  {request.id}
                </code>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
