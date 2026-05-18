import { TableCell, TableRow } from '@/components/shadcn/table';
import { format } from 'date-fns';
import type { GoodsReceivedNote } from '@/types/grn';

interface GoodsReceiptRowProps {
  grn: GoodsReceivedNote;
  onClick: () => void;
}

export function GoodsReceiptRow({ grn, onClick }: GoodsReceiptRowProps) {
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
      <TableCell className="pl-6 font-medium">{grn.grnNumber}</TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {grn.vendorName}
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {format(new Date(grn.receivedOn), 'MMM dd, yyyy')}
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {grn.purchaseOrderNumber ?? '—'}
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {grn.projectName ?? '—'}
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {grn.items.length}
      </TableCell>
      <TableCell className="text-muted-foreground pr-6 text-sm">
        {grn.invoiceAmount == null
          ? '—'
          : `₹${grn.invoiceAmount.toLocaleString('en-IN')}`}
      </TableCell>
    </TableRow>
  );
}
