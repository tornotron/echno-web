'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/shadcn/card';
import { Badge } from '@/components/shadcn/badge';
import { Button } from '@/components/shadcn/button';
import { Separator } from '@/components/shadcn/separator';
import { LeaveRequest, LeaveStatus } from '@/types/leave';
import { LeaveStatusBadge } from './leave-status-badge';
import {
  Calendar,
  Clock,
  User,
  Eye,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { useLeaveRole } from '@/hooks/leave/use-leave-role';
import { useCurrentUserEmployee } from '@/hooks/employee';
import { cn } from '@/lib/utils';

interface LeaveRequestCardProps {
  request: LeaveRequest;
  showActions?: boolean;
  showEmployeeName?: boolean;
  from?: string;
  onViewDetails?: () => void;
  onApprove?: (requestId: number) => void;
  onReject?: (requestId: number) => void;
}

export function LeaveRequestCard({
  request,
  showActions = true,
  showEmployeeName = true,
  from,
  onViewDetails,
  onApprove,
  onReject,
}: LeaveRequestCardProps) {
  const router = useRouter();
  const { canApprove } = useLeaveRole();
  const { data: employee } = useCurrentUserEmployee();
  const [isExpanded, setIsExpanded] = useState(false);

  const isPending = request.status === LeaveStatus.PENDING_APPROVAL;
  const isDraft = request.status === LeaveStatus.DRAFT;
  const isOwnRequest = request.employeeId === employee?.id;

  // Calculate urgency (days until leave starts)
  const daysUntilStart = differenceInDays(request.startDate, new Date());
  const isUrgent = isPending && daysUntilStart >= 0 && daysUntilStart <= 3;

  const detailUrl = `/users/dashboard/workforce/leaves/manage/requests/${request.id}${from ? `?from=${from}` : ''}`;

  const handleCardClick = () => {
    if (onViewDetails) {
      onViewDetails();
    } else {
      router.push(detailUrl);
    }
  };

  const handleApprove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onApprove) {
      onApprove(request.id);
    } else {
      router.push(detailUrl);
    }
  };

  const handleReject = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onReject) {
      onReject(request.id);
    } else {
      router.push(detailUrl);
    }
  };

  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:shadow-md',
        isUrgent && 'border-orange-500/50 bg-orange-500/5'
      )}
      onClick={handleCardClick}
    >
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header Section */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1 space-y-3">
              {/* Badges Row */}
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="font-medium">
                  {request.leaveTypeName}
                </Badge>
                <LeaveStatusBadge status={request.status} />
                <Badge variant="secondary" className="font-mono text-xs">
                  {request.requestNumber}
                </Badge>
                {isUrgent && (
                  <Badge variant="destructive" className="animate-pulse">
                    <AlertCircle className="mr-1 h-3 w-3" />
                    Starts in {daysUntilStart}{' '}
                    {daysUntilStart === 1 ? 'day' : 'days'}
                  </Badge>
                )}
              </div>

              {/* Date Info */}
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="text-muted-foreground h-4 w-4" />
                  <span className="text-muted-foreground">From:</span>
                  <span className="font-medium">
                    {format(request.startDate, 'MMM dd, yyyy')}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="text-muted-foreground h-4 w-4" />
                  <span className="text-muted-foreground">To:</span>
                  <span className="font-medium">
                    {format(request.endDate, 'MMM dd, yyyy')}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="text-muted-foreground h-4 w-4" />
                  <span className="text-primary font-semibold">
                    {request.totalDays}{' '}
                    {request.totalDays === 1 ? 'day' : 'days'}
                  </span>
                </div>
              </div>

              {/* Employee Name */}
              {showEmployeeName && request.employeeName && (
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                  <User className="h-4 w-4" />
                  <span className="font-medium">{request.employeeName}</span>
                </div>
              )}

              {/* Reason Preview */}
              {request.reason && (
                <div className="flex items-start gap-2 text-sm">
                  <FileText className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
                  <p className="text-muted-foreground line-clamp-2">
                    {request.reason}
                  </p>
                </div>
              )}
            </div>

            {/* Actions Column */}
            {showActions && (
              <div className="flex flex-row gap-2 sm:shrink-0 sm:flex-col">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCardClick();
                  }}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View
                </Button>

                {/* Quick Approve/Reject for Managers/Admins */}
                {canApprove && isPending && !isOwnRequest && (
                  <>
                    <Button
                      size="sm"
                      variant="default"
                      onClick={handleApprove}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="mr-2 h-4 w-4" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={handleReject}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                  </>
                )}

                {/* Edit for Draft Requests */}
                {isDraft && isOwnRequest && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(
                        `/users/dashboard/workforce/leaves/manage/requests/new?edit=${request.id}`
                      );
                    }}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Expandable Details Section */}
          {(request.contactDuringLeave || request.handoverToName) && (
            <>
              <Separator />
              <div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between"
                  onClick={handleToggleExpand}
                >
                  <span className="text-sm font-medium">
                    {isExpanded ? 'Hide' : 'Show'} Additional Details
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>

                {isExpanded && (
                  <div className="mt-3 space-y-3 text-sm">
                    {request.contactDuringLeave && (
                      <div>
                        <p className="text-muted-foreground mb-1 font-medium">
                          Contact During Leave:
                        </p>
                        <p>{request.contactDuringLeave}</p>
                      </div>
                    )}
                    {request.handoverToName && (
                      <div>
                        <p className="text-muted-foreground mb-1 font-medium">
                          Handover To:
                        </p>
                        <p>{request.handoverToName}</p>
                        {request.handoverNotes && (
                          <p className="text-muted-foreground mt-1">
                            {request.handoverNotes}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
