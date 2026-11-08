import { Badge } from '@/components/shadcn/badge';
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Ban,
  HelpCircle,
} from 'lucide-react';
import type { MemberInvitationStage } from '@tornotron/echno-core/member-invitations/types';
import { cn } from '@/lib/utils';
import { STAGE_LABEL } from '../lib/invitation-stage';

const STAGE_STYLE: Record<
  MemberInvitationStage,
  { className: string; icon: React.ElementType }
> = {
  PENDING: {
    className:
      'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300',
    icon: Clock,
  },
  ACCEPTED: {
    className:
      'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300',
    icon: CheckCircle,
  },
  ACCEPTED_BY_ANOTHER_ADDRESS: {
    className: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300',
    icon: XCircle,
  },
  EXPIRED: {
    className: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
    icon: AlertCircle,
  },
  REVOKED: {
    className: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
    icon: Ban,
  },
  UNKNOWN: {
    className: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
    icon: HelpCircle,
  },
};

interface InvitationStatusBadgeProps {
  status: MemberInvitationStage;
  className?: string;
}

export function InvitationStatusBadge({
  status,
  className,
}: InvitationStatusBadgeProps) {
  const style = STAGE_STYLE[status] ?? STAGE_STYLE.UNKNOWN;
  const Icon = style.icon;

  return (
    <Badge className={cn(style.className, className)}>
      <Icon className="mr-1 h-3 w-3" />
      {STAGE_LABEL[status] ?? STAGE_LABEL.UNKNOWN}
    </Badge>
  );
}
