import { Badge } from '@/components/shadcn/badge';
import { Checkbox } from '@/components/shadcn/checkbox';
import { TableCell, TableRow } from '@/components/shadcn/table';
import { PhoneDisplay } from '@/components/shadcn/phone-input';
import { User } from 'lucide-react';
import {
  EmploymentType,
  LabourStatus,
  SkillLevel,
  type Labour,
} from '@tornotron/echno-core/labour/types';

const typeLabels: Record<EmploymentType, string> = {
  [EmploymentType.DAILY_WAGE]: 'Daily Wage',
  [EmploymentType.MONTHLY]: 'Monthly',
  [EmploymentType.CONTRACT]: 'Contract',
  [EmploymentType.PIECE_RATE]: 'Piece Rate',
};

const statusBadgeClasses: Record<LabourStatus, string> = {
  [LabourStatus.ACTIVE]:
    'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  [LabourStatus.INACTIVE]:
    'bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300',
  [LabourStatus.ON_LEAVE]:
    'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  [LabourStatus.TERMINATED]:
    'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
};

const statusLabels: Record<LabourStatus, string> = {
  [LabourStatus.ACTIVE]: 'Active',
  [LabourStatus.INACTIVE]: 'Inactive',
  [LabourStatus.ON_LEAVE]: 'On Leave',
  [LabourStatus.TERMINATED]: 'Terminated',
};

const skillLevelLabels: Record<SkillLevel, string> = {
  [SkillLevel.UNSKILLED]: 'Unskilled',
  [SkillLevel.SEMI_SKILLED]: 'Semi-Skilled',
  [SkillLevel.SKILLED]: 'Skilled',
  [SkillLevel.HIGHLY_SKILLED]: 'Highly Skilled',
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
          aria-label={`Select ${labour.fullName}`}
        />
      </TableCell>
      <TableCell>
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-orange-500 to-orange-600">
            <User className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-medium text-zinc-900 dark:text-zinc-100">
              {labour.fullName}
            </p>
            <PhoneDisplay
              value={labour.phoneNumber}
              className="text-zinc-500 dark:text-zinc-500"
            />
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div>
          <div>{labour.specialization}</div>
          <div className="text-xs text-zinc-500">
            {labour.skillLevel ? skillLevelLabels[labour.skillLevel] : '—'}
          </div>
        </div>
      </TableCell>
      <TableCell>
        {labour.employmentType ? (
          <Badge variant="outline">{typeLabels[labour.employmentType]}</Badge>
        ) : (
          '—'
        )}
      </TableCell>
      <TableCell>
        {labour.dailyRate
          ? `₹${labour.dailyRate}/day`
          : labour.monthlyRate
            ? `₹${labour.monthlyRate.toLocaleString()}/mo`
            : '—'}
      </TableCell>
      <TableCell>
        <div className="text-sm">{labour.currentProjectName}</div>
        {labour.contractorName && (
          <div className="text-xs text-zinc-500">{labour.contractorName}</div>
        )}
      </TableCell>
      <TableCell>
        {labour.status ? (
          <Badge className={statusBadgeClasses[labour.status]}>
            {statusLabels[labour.status]}
          </Badge>
        ) : (
          '—'
        )}
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
