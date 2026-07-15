import type { ReactNode } from 'react';
import { Badge } from '@/components/shadcn/badge';
import { Network, Users } from 'lucide-react';
import {
  Department,
  getDepartmentLabel,
} from '@tornotron/echno-core/employee/types';
import type { TreeNode } from '@/lib/utils/hierarchy';
import type { Employee } from '@tornotron/echno-core/employee/types';

interface OrganizationHierarchyTabProps {
  hierarchyDepartments: Department[];
  activeDept: Department | null;
  deptEmployees: Employee[];
  treeRoots: TreeNode[];
  onSelectDepartment: (dept: Department) => void;
  hierarchyEmployees: Employee[];
  renderNode: (node: TreeNode) => ReactNode;
}

export function OrganizationHierarchyTab({
  hierarchyDepartments,
  activeDept,
  deptEmployees,
  treeRoots,
  onSelectDepartment,
  hierarchyEmployees,
  renderNode,
}: OrganizationHierarchyTabProps) {
  if (hierarchyDepartments.length === 0) {
    return (
      <div className="py-16 text-center">
        <Network className="mx-auto mb-4 h-12 w-12 text-zinc-400" />
        <p className="text-zinc-600 dark:text-zinc-400">
          No hierarchy data available
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[500px] overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
      {/* Left — department sidebar */}
      <div className="w-56 shrink-0 border-r border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="p-3 text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
          Departments
        </div>
        <nav className="space-y-0.5 px-2 pb-4">
          {hierarchyDepartments.map((dept) => {
            const count = hierarchyEmployees.filter(
              (e) => e.department === dept
            ).length;
            const isActive = dept === activeDept;
            return (
              <button
                key={dept}
                type="button"
                onClick={() => onSelectDepartment(dept)}
                className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? 'bg-white font-medium text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-100'
                    : 'text-zinc-600 hover:bg-white/60 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-100'
                }`}
              >
                <span className="truncate">{getDepartmentLabel(dept)}</span>
                <Badge
                  variant={isActive ? 'default' : 'outline'}
                  className="ml-2 shrink-0 text-xs"
                >
                  {count}
                </Badge>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Right — hierarchy tree */}
      <div className="min-w-0 flex-1 overflow-y-auto bg-white p-6 dark:bg-zinc-950">
        {activeDept && (
          <>
            <div className="mb-4 flex items-center gap-2">
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                {getDepartmentLabel(activeDept)}
              </h3>
              <span className="text-sm text-zinc-400">
                · {deptEmployees.length}{' '}
                {deptEmployees.length === 1 ? 'employee' : 'employees'}
              </span>
            </div>

            {treeRoots.length > 0 ? (
              <div className="space-y-3">
                {treeRoots.map((root, index) => (
                  <div key={root.id ?? root.employeeId ?? index}>
                    {renderNode(root)}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <Users className="mx-auto mb-3 h-10 w-10 text-zinc-300 dark:text-zinc-600" />
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  No employees in this department
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
