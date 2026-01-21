'use client';

import { Badge } from '@/components/ui/badge';
import {
  Clock,
  CheckCircle,
  XCircle,
  FileEdit,
  Eye,
  Ban,
  Timer,
} from 'lucide-react';
import {
  AccessRequestStatus,
  getStatusLabel,
  getStatusColor,
} from '@/types/access-request';

interface AccessRequestStatusBadgeProps {
  status: AccessRequestStatus;
  showIcon?: boolean;
  size?: 'sm' | 'default' | 'lg';
}

const statusIcons: Record<
  AccessRequestStatus,
  React.ComponentType<{ className?: string }>
> = {
  [AccessRequestStatus.DRAFT]: FileEdit,
  [AccessRequestStatus.PENDING]: Clock,
  [AccessRequestStatus.UNDER_REVIEW]: Eye,
  [AccessRequestStatus.APPROVED]: CheckCircle,
  [AccessRequestStatus.REJECTED]: XCircle,
  [AccessRequestStatus.CANCELLED]: Ban,
  [AccessRequestStatus.EXPIRED]: Timer,
};

export function AccessRequestStatusBadge({
  status,
  showIcon = true,
  size = 'default',
}: AccessRequestStatusBadgeProps) {
  const Icon = statusIcons[status];
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    default: 'text-sm px-2.5 py-0.5',
    lg: 'text-base px-3 py-1',
  };
  const iconSizeClasses = {
    sm: 'h-3 w-3',
    default: 'h-3.5 w-3.5',
    lg: 'h-4 w-4',
  };

  return (
    <Badge className={`${getStatusColor(status)} ${sizeClasses[size]} gap-1`}>
      {showIcon && Icon && <Icon className={iconSizeClasses[size]} />}
      {getStatusLabel(status)}
    </Badge>
  );
}
