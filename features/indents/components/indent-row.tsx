import { Badge } from '@/components/shadcn/badge';
import { TableCell, TableRow } from '@/components/shadcn/table';
import { FolderOpen } from 'lucide-react';
import { format } from 'date-fns';
import {
  indentStatusBadgeColors,
  indentStatusLabels,
  type IndentSummary,
} from '@tornotron/echno-core/indents/types';

interface IndentRowProps {
  /**
   * An indent summary: the indent without its lines, with `itemCount` and
   * `convertedItemCount` in their place. The row renders only counts.
   */
  indent: IndentSummary;
  onClick: () => void;
}

/**
 * A single indent table row. The whole row is keyboard-accessible and calls
 * `onClick` when activated, typically to open the indent detail page.
 *
 * @param props.indent - The indent to render.
 * @param props.onClick - Invoked when the row is activated.
 */
export function IndentRow({ indent, onClick }: IndentRowProps) {
  const convertedCount = indent.convertedItemCount;

  return (
    <TableRow
      role="link"
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
      <TableCell className="pl-6 font-medium">{indent.indentNumber}</TableCell>
      <TableCell>
        <Badge className={indentStatusBadgeColors[indent.status]}>
          {indentStatusLabels[indent.status]}
        </Badge>
      </TableCell>
      <TableCell>
        {indent.projectName ? (
          <span className="flex items-center gap-1.5 text-sm">
            <FolderOpen className="h-3.5 w-3.5 text-zinc-400" />
            {indent.projectName}
          </span>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        )}
      </TableCell>
      <TableCell>
        <span className="text-sm">
          {indent.itemCount}
          {convertedCount > 0 && (
            <span className="text-muted-foreground ml-1">
              ({convertedCount} converted)
            </span>
          )}
        </span>
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {indent.expectedOn
          ? format(new Date(indent.expectedOn), 'MMM dd, yyyy')
          : '—'}
      </TableCell>
      <TableCell className="text-muted-foreground pr-6 text-sm">
        {indent.createdBy.name}
      </TableCell>
    </TableRow>
  );
}
