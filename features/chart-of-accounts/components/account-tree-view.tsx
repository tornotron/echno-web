'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/shadcn/table';
import { Button } from '@/components/shadcn/button';
import { Badge } from '@/components/shadcn/badge';
import { Pencil, Plus, Ban } from 'lucide-react';
import type { AccountTreeNode } from '@tornotron/echno-core/finance/types';
import { flattenAccountTree } from '@/lib/finance/account-tree';

const TYPE_LABELS: Record<string, string> = {
  ASSET: 'Asset',
  LIABILITY: 'Liability',
  EQUITY: 'Equity',
  INCOME: 'Income',
  EXPENSE: 'Expense',
};

interface AccountTreeViewProps {
  tree: AccountTreeNode[];
  onEdit: (node: AccountTreeNode) => void;
  onAddChild: (node: AccountTreeNode) => void;
  onDeactivate: (node: AccountTreeNode) => void;
}

export function AccountTreeView({
  tree,
  onEdit,
  onAddChild,
  onDeactivate,
}: AccountTreeViewProps) {
  const rows = flattenAccountTree(tree);

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[280px]">Account</TableHead>
            <TableHead>Code</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(({ node, depth }) => (
            <TableRow key={node.id} className={node.active ? '' : 'opacity-60'}>
              <TableCell>
                <div
                  className="flex items-center gap-2"
                  style={{ paddingLeft: `${depth * 20}px` }}
                >
                  <span className="font-medium">{node.name}</span>
                  {node.postable && (
                    <Badge variant="secondary" className="text-[10px]">
                      Postable
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className="font-mono text-sm">{node.code}</TableCell>
              <TableCell>
                <span className="text-muted-foreground text-sm">
                  {TYPE_LABELS[node.type] ?? node.type}
                </span>
              </TableCell>
              <TableCell>
                {node.active ? (
                  <Badge variant="secondary">Active</Badge>
                ) : (
                  <Badge variant="outline">Inactive</Badge>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    title="Add sub-account"
                    onClick={() => onAddChild(node)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    title="Edit account"
                    onClick={() => onEdit(node)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive h-8 w-8"
                    title="Deactivate account"
                    disabled={!node.active}
                    onClick={() => onDeactivate(node)}
                  >
                    <Ban className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
