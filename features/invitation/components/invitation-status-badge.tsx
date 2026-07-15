import { Badge } from '@/components/shadcn/badge';
import { Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { InvitationStatus } from '@tornotron/echno-core/invitation/types';
import { cn } from '@/lib/utils';

const STATUS_CONFIG: Record<
  InvitationStatus,
  { label: string; className: string; icon: React.ElementType }
> = {
  [InvitationStatus.pending]: {
    label: 'Pending',
    className:
      'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300',
    icon: Clock,
  },
  [InvitationStatus.accepted]: {
    label: 'Accepted',
    className:
      'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300',
    icon: CheckCircle,
  },
  [InvitationStatus.rejected]: {
    label: 'Rejected',
    className: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300',
    icon: XCircle,
  },
  [InvitationStatus.expired]: {
    label: 'Expired',
    className: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
    icon: AlertCircle,
  },
};

interface InvitationStatusBadgeProps {
  status: InvitationStatus;
  className?: string;
}

export function InvitationStatusBadge({
  status,
  className,
}: InvitationStatusBadgeProps) {
  const config =
    STATUS_CONFIG[status] ?? STATUS_CONFIG[InvitationStatus.pending];
  const Icon = config.icon;

  return (
    <Badge className={cn(config.className, className)}>
      <Icon className="mr-1 h-3 w-3" />
      {config.label}
    </Badge>
  );
}
