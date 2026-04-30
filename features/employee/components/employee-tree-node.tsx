import { Badge } from '@/components/shadcn/badge';
import { EmployeeAvatar } from '@/components/shared/employee-avatar';
import type { TreeNode } from '@/lib/utils/hierarchy';

export function EmployeeTreeNode({ node }: { node: TreeNode }) {
  return (
    <div className="relative">
      <div className="flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
        <EmployeeAvatar employee={node} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {node.name}
          </p>
          <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
            {node.designation}
          </p>
        </div>
        {node.children.length > 0 && (
          <Badge variant="outline" className="shrink-0 text-xs">
            {node.children.length}{' '}
            {node.children.length === 1 ? 'report' : 'reports'}
          </Badge>
        )}
      </div>

      {node.children.length > 0 && (
        <div className="mt-1 ml-5 border-l-2 border-zinc-200 pl-4 dark:border-zinc-700">
          {node.children.map((child) => (
            <EmployeeTreeNode key={child.id ?? child.employeeId} node={child} />
          ))}
        </div>
      )}
    </div>
  );
}
