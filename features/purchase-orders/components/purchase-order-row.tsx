import { Badge } from '@/components/shadcn/badge';
import { TableCell, TableRow } from '@/components/shadcn/table';
import { format } from 'date-fns';
import {
  purchaseOrderStatusBadgeColors,
  purchaseOrderStatusLabels,
  type PurchaseOrder,
} from '@/types/purchase-orders';

interface PurchaseOrderRowProps {
  order: PurchaseOrder;
  onClick: () => void;
}

export function PurchaseOrderRow({ order, onClick }: PurchaseOrderRowProps) {
  return (
    <TableRow
      role="button"
      tabIndex={0}
      className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === ' ') { e.preventDefault(); onClick(); }
        else if (e.key === 'Enter') onClick();
      }}
    >
      <TableCell className="pl-6 font-medium">{order.poNumber}</TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {order.vendorName}
      </TableCell>
      <TableCell>
        <Badge className={purchaseOrderStatusBadgeColors[order.status]}>
          {purchaseOrderStatusLabels[order.status]}
        </Badge>
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {order.projectName ?? '—'}
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {order.items.length}
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {order.expectedDeliveryDate
          ? format(new Date(order.expectedDeliveryDate), 'MMM dd, yyyy')
          : '—'}
      </TableCell>
      <TableCell className="text-muted-foreground pr-6 text-sm">
        {order.totalAmount == null
          ? '—'
          : `₹${order.totalAmount.toLocaleString('en-IN')}`}
      </TableCell>
    </TableRow>
  );
}
