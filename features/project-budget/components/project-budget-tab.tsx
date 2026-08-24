'use client';

import { Wallet } from 'lucide-react';
import { CostControlTable } from './cost-control-table';
import { BudgetAllocationPanel } from './budget-allocation-panel';

interface ProjectBudgetTabProps {
  projectId: number;
}

export function ProjectBudgetTab({ projectId }: ProjectBudgetTabProps) {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          <Wallet className="h-5 w-5" />
          Budget &amp; cost control
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Allocate the project budget across cost categories, then track
          committed and spent amounts against it.
        </p>
      </div>

      <CostControlTable projectId={projectId} />
      <BudgetAllocationPanel projectId={projectId} />
    </div>
  );
}
