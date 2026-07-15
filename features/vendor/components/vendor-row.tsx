import { Badge } from '@/components/shadcn/badge';
import { TableCell, TableRow } from '@/components/shadcn/table';
import { getVendorTypeLabel } from '@tornotron/echno-core/vendor/types';
import type { Vendor } from '@tornotron/echno-core/vendor/types';
import { VendorAvatar } from './vendor-avatar';
import { VendorStatusBadge } from './vendor-status-badge';

interface VendorRowProps {
  vendor: Vendor;
  onClick: () => void;
}

export function VendorRow({ vendor, onClick }: VendorRowProps) {
  return (
    <TableRow
      role="button"
      tabIndex={0}
      className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === ' ') {
          e.preventDefault();
          onClick();
        } else if (e.key === 'Enter') onClick();
      }}
    >
      <TableCell>
        <div className="flex items-center gap-3">
          <VendorAvatar name={vendor.name} />
          <div>
            <p className="font-medium">{vendor.name}</p>
            <p className="text-sm text-zinc-500">
              {vendor.contactPerson ?? vendor.email}
            </p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        {vendor.type ? (
          <Badge variant="outline">{getVendorTypeLabel(vendor.type)}</Badge>
        ) : (
          <span className="text-zinc-400">—</span>
        )}
      </TableCell>
      <TableCell>
        {vendor.totalPurchaseValue ? (
          <span className="font-semibold text-blue-600 dark:text-blue-400">
            ₹{(vendor.totalPurchaseValue / 100_000).toFixed(1)}L
          </span>
        ) : (
          <span className="text-zinc-500">—</span>
        )}
        <div className="text-xs text-zinc-500">
          {vendor.totalOrders ?? 0} orders
        </div>
      </TableCell>
      <TableCell>
        {vendor.totalOutstanding && vendor.totalOutstanding > 0 ? (
          <span className="font-semibold text-orange-600 dark:text-orange-400">
            ₹{(vendor.totalOutstanding / 1000).toFixed(0)}K
          </span>
        ) : (
          <span className="text-zinc-500">—</span>
        )}
      </TableCell>
      <TableCell>
        <VendorStatusBadge status={vendor.status} />
      </TableCell>
    </TableRow>
  );
}
