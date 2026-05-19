import { Badge } from '@/components/shadcn/badge';
import { Checkbox } from '@/components/shadcn/checkbox';
import { TableCell, TableRow } from '@/components/shadcn/table';
import { PhoneDisplay } from '@/components/shadcn/phone-input';
import { User } from 'lucide-react';
import type { Labour } from '@/types/third-party/labour';

const typeLabels: Record<string, string> = {
  daily: 'Daily Wage',
  monthly: 'Monthly',
  contract: 'Contract',
  piece: 'Piece Rate',
};

const statusColors: Record<string, string> = {
  active: 'green',
  inactive: 'zinc',
  onLeave: 'orange',
  terminated: 'red',
};

const statusLabels: Record<string, string> = {
  active: 'Active',
  inactive: 'Inactive',
  onLeave: 'On Leave',
  terminated: 'Terminated',
};

const skillLevelLabels: Record<string, string> = {
  unskilled: 'Unskilled',
  semiskilled: 'Semi-Skilled',
  skilled: 'Skilled',
  highlySkilled: 'Highly Skilled',
};

interface LabourRowProps {
  labour: Labour;
  onClick: () => void;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
}

export function LabourRow({
  labour,
  onClick,
  isSelected,
  onSelect,
}: LabourRowProps) {
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
      <TableCell onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) => onSelect(checked as boolean)}
          aria-label={`Select ${labour.name}`}
        />
      </TableCell>
      <TableCell>
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-orange-500 to-orange-600">
            <User className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-medium text-zinc-900 dark:text-zinc-100">
              {labour.name}
            </p>
            <PhoneDisplay
              value={labour.phone}
              className="text-zinc-500 dark:text-zinc-500"
            />
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div>
          <div>{labour.trade}</div>
          <div className="text-xs text-zinc-500">
            {skillLevelLabels[labour.skillLevel]}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline">{typeLabels[labour.type]}</Badge>
      </TableCell>
      <TableCell>
        {labour.dailyRate && `₹${labour.dailyRate}/day`}
        {labour.monthlyRate && `₹${labour.monthlyRate.toLocaleString()}/mo`}
      </TableCell>
      <TableCell>
        <div className="text-sm">{labour.currentProject}</div>
        {labour.contractorName && (
          <div className="text-xs text-zinc-500">{labour.contractorName}</div>
        )}
      </TableCell>
      <TableCell>
        <Badge
          className={`bg-${statusColors[labour.status]}-100 text-${statusColors[labour.status]}-700 dark:bg-${statusColors[labour.status]}-900 dark:text-${statusColors[labour.status]}-300`}
        >
          {statusLabels[labour.status]}
        </Badge>
      </TableCell>
      <TableCell>
        {labour.totalDue && labour.totalDue > 0 ? (
          <span className="font-semibold text-orange-600 dark:text-orange-400">
            ₹{labour.totalDue.toLocaleString()}
          </span>
        ) : (
          <span className="text-zinc-500">-</span>
        )}
      </TableCell>
    </TableRow>
  );
}
