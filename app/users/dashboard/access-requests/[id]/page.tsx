'use client';

import { useState, useEffect, use } from 'react';
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
import {
  Shield,
  Clock,
  User,
  Calendar,
  ArrowLeft,
  X,
  Edit,
  Send,
  Loader2,
  AlertCircle,
  MessageSquare,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  AccessRequest,
  AccessRequestStatus,
  getStatusLabel,
  getStatusColor,
  getPriorityLabel,
  getPriorityColor,
  getTypeLabel,
  getRequestSummary,
  canEditRequest,
  canCancelRequest,
  canSubmitRequest,
} from '@/types/access-request';
import { toast } from '@/lib/styles/toast-styles';
import { useSession } from 'next-auth/react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { mockAccessRequests } from '@/components/shared/data/access-requests';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AccessRequestDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { data: session } = useSession();
  const [request, setRequest] = useState<AccessRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [newComment, setNewComment] = useState('');

  const userId = session?.user?.id || '';

  // Load request from mock data
  useEffect(() => {
    const timer = setTimeout(() => {
      const foundRequest = mockAccessRequests.find((r) => r.id === id);
      if (foundRequest) {
        setRequest(foundRequest);
      } else {
        toast.error('Error', {
          description: 'Access request not found',
        });
        router.push('/users/dashboard/access-requests');
      }
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [id, router]);

  // Handle cancel request (simulated with mock data)
  const handleCancel = async () => {
    if (!request) return;

    setActionLoading(true);
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Update local state to simulate cancellation
    setRequest({
      ...request,
      status: AccessRequestStatus.CANCELLED,
      updatedAt: new Date(),
    });

    toast.success('Request Cancelled', {
      description: 'Your access request has been cancelled',
    });
    setActionLoading(false);
    router.push('/users/dashboard/access-requests');
  };

  // Handle submit draft (simulated with mock data)
  const handleSubmit = async () => {
    if (!request) return;

    setActionLoading(true);
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Update local state to simulate submission
    const now = new Date();
    setRequest({
      ...request,
      status: AccessRequestStatus.PENDING,
      submittedAt: now,
      updatedAt: now,
    });

    toast.success('Request Submitted', {
      description: 'Your access request has been submitted for review',
    });
    setActionLoading(false);
  };

  // Handle add comment (placeholder for future implementation)
  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    // TODO: Implement comment API
    toast.info('Coming Soon', {
      description: 'Comments feature will be available soon',
    });
    setNewComment('');
  };

  if (loading) {
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
        <Link href="/users/dashboard/access-requests">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Requests
          </Button>
        </Link>
      </div>
    );
  }

  const canEdit = canEditRequest(request, userId);
  const canCancel = canCancelRequest(request, userId);
  const canSubmitDraft = canSubmitRequest(request, userId);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/users/dashboard/access-requests">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="mb-1 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              Access Request
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {getRequestSummary(request)}
            </p>
          </div>
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
                <p className="whitespace-pre-wrap text-zinc-900 dark:text-zinc-100">
                  {request.reason}
                </p>
              </div>

              {/* Business Justification */}
              {request.businessJustification && (
                <div>
                  <p className="mb-2 text-sm text-zinc-500 dark:text-zinc-400">
                    Business Justification
                  </p>
                  <p className="whitespace-pre-wrap text-zinc-900 dark:text-zinc-100">
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

          {/* Comments Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Comments
              </CardTitle>
              <CardDescription>
                Add comments or questions about your request
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {request.comments && request.comments.length > 0 ? (
                <div className="space-y-4">
                  {request.comments
                    .filter((c) => !c.isInternal)
                    .map((comment) => (
                      <div
                        key={comment.id}
                        className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <span className="font-medium text-zinc-900 dark:text-zinc-100">
                            {comment.authorName}
                          </span>
                          <span className="text-sm text-zinc-500">
                            {format(comment.createdAt, 'dd MMM yyyy HH:mm')}
                          </span>
                        </div>
                        <p className="text-zinc-700 dark:text-zinc-300">
                          {comment.content}
                        </p>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="py-4 text-center text-sm text-zinc-500">
                  No comments yet
                </p>
              )}

              {/* Add Comment */}
              <div className="space-y-2">
                <Textarea
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    onClick={handleAddComment}
                    disabled={!newComment.trim()}
                  >
                    Add Comment
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Link href="/users/dashboard/access-requests">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </Link>

            {canEdit && (
              <Link href={`/users/dashboard/access-requests/${id}/edit`}>
                <Button variant="outline">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              </Link>
            )}

            {canSubmitDraft && (
              <Button onClick={handleSubmit} disabled={actionLoading}>
                <Send className="mr-2 h-4 w-4" />
                {actionLoading ? 'Submitting...' : 'Submit Request'}
              </Button>
            )}

            {canCancel && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    className="ml-auto"
                    disabled={actionLoading}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancel Request
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel Access Request?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to cancel this access request? This
                      action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep Request</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleCancel}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Cancel Request
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
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

          {/* Requester Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4" />
                Requester
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Name</p>
                <p className="font-medium text-zinc-900 dark:text-zinc-100">
                  {request.requesterName}
                </p>
              </div>
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Email
                </p>
                <p className="font-medium text-zinc-900 dark:text-zinc-100">
                  {request.requesterEmail}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Assigned To Card */}
          {request.assignedToName && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4" />
                  Assigned Reviewer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium text-zinc-900 dark:text-zinc-100">
                  {request.assignedToName}
                </p>
              </CardContent>
            </Card>
          )}

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
