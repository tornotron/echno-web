import { Badge } from '@/components/ui/badge';
import { VendorStatus, getVendorStatusLabel } from '@/types/vendor';
import { cn } from '@/lib/utils';

const STATUS_CLASSES: Record<VendorStatus, string> = {
  [VendorStatus.ACTIVE]:
    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  [VendorStatus.INACTIVE]:
    'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
  [VendorStatus.BLACKLISTED]:
    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

interface VendorStatusBadgeProps {
  status?: VendorStatus;
  className?: string;
}

export function VendorStatusBadge({
  status,
  className,
}: VendorStatusBadgeProps) {
  if (!status) return <span className="text-zinc-400">—</span>;

  return (
    <Badge className={cn(STATUS_CLASSES[status], className)}>
      {getVendorStatusLabel(status)}
    </Badge>
  );
}
