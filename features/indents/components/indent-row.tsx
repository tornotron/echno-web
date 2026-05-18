import { Badge } from '@/components/shadcn/badge';
import { TableCell, TableRow } from '@/components/shadcn/table';
import { FolderOpen } from 'lucide-react';
import { format } from 'date-fns';
import {
  indentStatusBadgeColors,
  indentStatusLabels,
  type Indent,
} from '@/types/indents';

interface IndentRowProps {
  indent: Indent;
  onClick: () => void;
}

export function IndentRow({ indent, onClick }: IndentRowProps) {
  const convertedCount = indent.items.filter(
    (it) => it.convertedToPurchaseOrder
  ).length;

  return (
    <TableRow
      role="link"
      tabIndex={0}
      className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === ' ') { e.preventDefault(); onClick(); }
        else if (e.key === 'Enter') onClick();
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
          {indent.items.length}
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
