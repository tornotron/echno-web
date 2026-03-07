import { Badge } from '@/components/ui/badge';
import { EmployeeStatus } from '@/types/employee';
import { cn } from '@/lib/utils';

const STATUS_STYLES: Record<string, string> = {
  [EmployeeStatus.active]:
    'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  [EmployeeStatus.inactive]:
    'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
  [EmployeeStatus.onLeave]:
    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
};

const STATUS_LABELS: Record<string, string> = {
  [EmployeeStatus.active]: 'Active',
  [EmployeeStatus.inactive]: 'Inactive',
  [EmployeeStatus.onLeave]: 'On Leave',
};

interface EmployeeStatusBadgeProps {
  status: string;
  className?: string;
}

export function EmployeeStatusBadge({
  status,
  className,
}: EmployeeStatusBadgeProps) {
  return (
    <Badge
      className={cn(
        STATUS_STYLES[status] ??
          'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400',
        className
      )}
    >
      {STATUS_LABELS[status] ?? status}
    </Badge>
  );
}
