import { Badge } from '@/components/shadcn/badge';
import { Checkbox } from '@/components/shadcn/checkbox';
import { TableCell, TableRow } from '@/components/shadcn/table';
import { AlertCircle, Clock, User } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import type { SubContract } from '@/types/third-party/sub-contract';

const typeLabels: Record<string, string> = {
  lumpsum: 'Lump Sum',
  itemRate: 'Item Rate',
  timeAndMaterial: 'Time & Material',
  costPlus: 'Cost Plus',
  unitPrice: 'Unit Price',
};

const statusColors: Record<string, string> = {
  draft: 'zinc',
  active: 'green',
  onHold: 'orange',
  completed: 'blue',
  terminated: 'red',
  expired: 'red',
};

const statusLabels: Record<string, string> = {
  draft: 'Draft',
  active: 'Active',
  onHold: 'On Hold',
  completed: 'Completed',
  terminated: 'Terminated',
  expired: 'Expired',
};

const paymentStatusColors: Record<string, string> = {
  notStarted: 'zinc',
  inProgress: 'blue',
  fullyPaid: 'green',
  overdue: 'red',
};

const paymentStatusLabels: Record<string, string> = {
  notStarted: 'Not Started',
  inProgress: 'In Progress',
  fullyPaid: 'Fully Paid',
  overdue: 'Overdue',
};

const getProgressColor = (percentage: number) => {
  if (percentage === 100) return 'bg-green-500';
  if (percentage >= 75) return 'bg-blue-500';
  if (percentage >= 50) return 'bg-yellow-500';
  return 'bg-orange-500';
};

interface SubContractRowProps {
  contract: SubContract;
  onClick: () => void;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
}

export function SubContractRow({
  contract,
  onClick,
  isSelected,
  onSelect,
}: SubContractRowProps) {
  const daysRemaining = differenceInDays(contract.endDate, new Date());
  const isNearDeadline = daysRemaining > 0 && daysRemaining <= 30;

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
          aria-label={`Select ${contract.contractId}`}
        />
      </TableCell>
      <TableCell>
        <div>
          <div className="font-medium">{contract.contractName}</div>
          <div className="text-sm text-zinc-500">{contract.projectName}</div>
          <div className="mt-1 flex items-center space-x-1 text-xs text-zinc-400">
            <Clock className="h-3 w-3" />
            <span>{format(contract.endDate, 'MMM d, yyyy')}</span>
            {isNearDeadline && (
              <AlertCircle className="ml-1 h-3 w-3 text-orange-500" />
            )}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-blue-600">
            <User className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-medium text-zinc-900 dark:text-zinc-100">
              {contract.contractorName}
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-500">
              {contract.contactPerson}
            </p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline">{typeLabels[contract.type]}</Badge>
      </TableCell>
      <TableCell>
        <div className="w-full">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-sm font-medium">
              {contract.completionPercentage}%
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-zinc-200 dark:bg-zinc-700">
            <div
              className={`h-2 rounded-full ${getProgressColor(contract.completionPercentage)}`}
              style={{ width: `${contract.completionPercentage}%` }}
            />
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="font-semibold text-blue-600 dark:text-blue-400">
          ₹{(contract.contractValue / 100_000).toFixed(1)}L
        </div>
        <div className="text-xs text-zinc-500">
          Paid: ₹{(contract.totalPaid / 100_000).toFixed(1)}L
        </div>
      </TableCell>
      <TableCell>
        {contract.totalDue > 0 ? (
          <span className="font-semibold text-orange-600 dark:text-orange-400">
            ₹{(contract.totalDue / 100_000).toFixed(1)}L
          </span>
        ) : (
          <span className="text-green-600 dark:text-green-400">Paid</span>
        )}
      </TableCell>
      <TableCell>
        <div className="space-y-1">
          <Badge
            className={`bg-${statusColors[contract.status]}-100 text-${statusColors[contract.status]}-700 dark:bg-${statusColors[contract.status]}-900 dark:text-${statusColors[contract.status]}-300`}
          >
            {statusLabels[contract.status]}
          </Badge>
          <div>
            <Badge
              variant="outline"
              className={`text-xs bg-${paymentStatusColors[contract.paymentStatus]}-50 border-${paymentStatusColors[contract.paymentStatus]}-200`}
            >
              {paymentStatusLabels[contract.paymentStatus]}
            </Badge>
          </div>
        </div>
      </TableCell>
    </TableRow>
  );
}
