import { Badge } from '@/components/shadcn/badge';
import { TableCell, TableRow } from '@/components/shadcn/table';
import { format } from 'date-fns';
import {
  siteTransferStatusBadgeColors,
  siteTransferStatusLabels,
  type SiteTransfer,
} from '@tornotron/echno-core/site-transfers/types';

interface TransferRowProps {
  transfer: SiteTransfer;
  onClick: () => void;
}

/**
 * A single site-transfer table row. The whole row acts as a button: click,
 * Enter, or Space calls `onClick`, typically to open the transfer detail page.
 *
 * @param props.transfer - The site transfer to render.
 * @param props.onClick - Invoked when the row is activated.
 */
export function TransferRow({ transfer, onClick }: TransferRowProps) {
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
      <TableCell className="pl-6 font-medium">
        {transfer.transferNumber}
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {format(new Date(transfer.issueDate), 'MMM dd, yyyy')}
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {transfer.sendingPerson.name}
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {transfer.sendingProjectName ?? '—'}
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {transfer.receivingProjectName ?? '—'}
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {transfer.items.length}
      </TableCell>
      <TableCell className="pr-6">
        <Badge className={siteTransferStatusBadgeColors[transfer.status]}>
          {siteTransferStatusLabels[transfer.status]}
        </Badge>
      </TableCell>
    </TableRow>
  );
}
