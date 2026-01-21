'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, ChevronRight, Shield, Blocks, UserCog } from 'lucide-react';
import Link from 'next/link';
import { format, formatDistanceToNow } from 'date-fns';
import {
  AccessRequest,
  AccessRequestType,
  getStatusLabel,
  getStatusColor,
  getPriorityLabel,
  getPriorityColor,
  getRequestSummary,
} from '@/types/access-request';
import { AccessRequestStatusBadge } from './access-request-status-badge';

interface AccessRequestCardProps {
  request: AccessRequest;
  variant?: 'default' | 'compact' | 'detailed';
  showActions?: boolean;
  href?: string;
}

const typeIcons: Record<
  AccessRequestType,
  React.ComponentType<{ className?: string }>
> = {
  [AccessRequestType.RESOURCE]: Shield,
  [AccessRequestType.MODULE]: Blocks,
  [AccessRequestType.ROLE]: UserCog,
};

export function AccessRequestCard({
  request,
  variant = 'default',
  showActions = true,
  href,
}: AccessRequestCardProps) {
  const TypeIcon = typeIcons[request.type];
  const linkHref = href || `/users/dashboard/access-requests/${request.id}`;

  if (variant === 'compact') {
    return (
      <Link href={linkHref}>
        <Card className="hover:bg-accent/50 cursor-pointer transition-colors">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
              <TypeIcon className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-zinc-900 dark:text-zinc-100">
                {getRequestSummary(request)}
              </p>
              <p className="truncate text-sm text-zinc-500">
                {formatDistanceToNow(request.createdAt, { addSuffix: true })}
              </p>
            </div>
            <AccessRequestStatusBadge status={request.status} size="sm" />
            <ChevronRight className="h-5 w-5 text-zinc-400" />
          </CardContent>
        </Card>
      </Link>
    );
  }

  if (variant === 'detailed') {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                <TypeIcon className="h-6 w-6 text-zinc-600 dark:text-zinc-400" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {getRequestSummary(request)}
                </h3>
                <p className="mt-1 text-sm text-zinc-500">{request.reason}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <AccessRequestStatusBadge status={request.status} />
                  <Badge className={getPriorityColor(request.priority)}>
                    {getPriorityLabel(request.priority)}
                  </Badge>
                  <span className="flex items-center gap-1 text-xs text-zinc-500">
                    <Clock className="h-3 w-3" />
                    {request.submittedAt
                      ? format(request.submittedAt, 'dd MMM yyyy')
                      : format(request.createdAt, 'dd MMM yyyy')}
                  </span>
                </div>
              </div>
            </div>
            {showActions && (
              <Link href={linkHref}>
                <Button variant="outline" size="sm">
                  View Details
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>

          {/* Reviewer comments if any */}
          {request.reviewerComments && (
            <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-800/50">
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Reviewer Response
              </p>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                {request.reviewerComments}
              </p>
              {request.reviewerName && (
                <p className="mt-2 text-xs text-zinc-500">
                  — {request.reviewerName}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Default variant
  return (
    <Link href={linkHref}>
      <Card className="hover:bg-accent/50 cursor-pointer transition-colors">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
              <TypeIcon className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-medium text-zinc-900 dark:text-zinc-100">
                  {getRequestSummary(request)}
                </h3>
                <AccessRequestStatusBadge
                  status={request.status}
                  size="sm"
                  showIcon={false}
                />
              </div>
              <p className="mt-1 line-clamp-2 text-sm text-zinc-500">
                {request.reason}
              </p>
              <div className="mt-2 flex items-center gap-3 text-xs text-zinc-500">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(request.createdAt, { addSuffix: true })}
                </span>
                <Badge
                  variant="outline"
                  className={`${getPriorityColor(request.priority)} text-xs`}
                >
                  {getPriorityLabel(request.priority)}
                </Badge>
              </div>
            </div>
            <ChevronRight className="mt-2 h-5 w-5 shrink-0 text-zinc-400" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
