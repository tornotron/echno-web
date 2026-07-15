import type { Employee } from '@tornotron/echno-core/employee/types';

export type TreeNode = Employee & { children: TreeNode[] };

export function buildTree(employees: Employee[]): TreeNode[] {
  const nodeMap = new Map<number, TreeNode>();
  for (const emp of employees) {
    if (emp.id !== undefined) nodeMap.set(emp.id, { ...emp, children: [] });
  }
  const roots: TreeNode[] = [];
  for (const node of nodeMap.values()) {
    if (node.managerId !== undefined && nodeMap.has(node.managerId)) {
      nodeMap.get(node.managerId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}
