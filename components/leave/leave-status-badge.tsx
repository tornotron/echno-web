import { Badge } from '@/components/ui/badge';
import { LeaveStatus, getLeaveStatusLabel } from '@/types/leave';
import { CheckCircle2, Clock, XCircle, Ban, RotateCcw } from 'lucide-react';

interface LeaveStatusBadgeProps {
  status: LeaveStatus;
}

const statusConfig: Record<
  LeaveStatus,
  {
    variant: 'default' | 'secondary' | 'destructive';
    icon: typeof Clock;
    className: string;
  }
> = {
  [LeaveStatus.DRAFT]: {
    variant: 'secondary',
    icon: Clock,
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
  },
  [LeaveStatus.PENDING_APPROVAL]: {
    variant: 'secondary',
    icon: Clock,
    className:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  },
  [LeaveStatus.APPROVED]: {
    variant: 'default',
    icon: CheckCircle2,
    className:
      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  },
  [LeaveStatus.REJECTED]: {
    variant: 'destructive',
    icon: XCircle,
    className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  },
  [LeaveStatus.CANCELLED]: {
    variant: 'secondary',
    icon: Ban,
    className:
      'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  },
  [LeaveStatus.WITHDRAWN]: {
    variant: 'secondary',
    icon: RotateCcw,
    className: 'bg-zinc-100 text-zinc-800 dark:bg-zinc-900 dark:text-zinc-300',
  },
};

export function getLeaveStatusClasses(status: LeaveStatus): string {
  return statusConfig[status]?.className ?? '';
}

export function LeaveStatusBadge({ status }: LeaveStatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={config.className}>
      <Icon className="mr-1 h-3 w-3" />
      {getLeaveStatusLabel(status)}
    </Badge>
  );
}
