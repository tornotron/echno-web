import { Badge } from '@/components/shadcn/badge';
import { TableCell, TableRow } from '@/components/shadcn/table';
import { format } from 'date-fns';
import {
  consumptionTypeLabels,
  ConsumptionType,
  type MaterialConsumption,
} from '@/types/materials';

const consumptionTypeBadgeColors: Record<ConsumptionType, string> = {
  [ConsumptionType.usedFromStock]:
    'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  [ConsumptionType.transferred]:
    'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
};

interface ConsumptionRowProps {
  consumption: MaterialConsumption;
  onClick: () => void;
}

export function ConsumptionRow({ consumption, onClick }: ConsumptionRowProps) {
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
      <TableCell className="text-muted-foreground pl-6 text-sm">
        {format(new Date(consumption.consumptionDate), 'MMM dd, yyyy')}
      </TableCell>
      <TableCell className="font-medium">{consumption.materialName}</TableCell>
      <TableCell>
        <Badge
          className={consumptionTypeBadgeColors[consumption.consumptionType]}
        >
          {consumptionTypeLabels[consumption.consumptionType]}
        </Badge>
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {consumption.quantity}
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {consumption.projectName ?? '—'}
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {consumption.taskTitle ?? '—'}
      </TableCell>
      <TableCell className="text-muted-foreground pr-6 text-sm">
        {consumption.createdBy.name}
      </TableCell>
    </TableRow>
  );
}
