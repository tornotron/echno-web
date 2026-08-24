'use client';

import { useMemo } from 'react';
import { Card } from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';
import { Badge } from '@/components/shadcn/badge';
import { Skeleton } from '@/components/shadcn/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/shadcn/table';
import { RotateCcw, Loader2 } from 'lucide-react';
import {
  usePostingAccountMappings,
  useFinanceAccountTree,
  useUpsertPostingAccountMapping,
  useDeletePostingAccountMapping,
} from '@tornotron/echno-core/finance/hooks';
import {
  postingRoleLabels,
  PostingAccountSource,
  type PostingRole,
} from '@tornotron/echno-core/finance/types';
import { getErrorMessage, getErrorTitle } from '@tornotron/echno-core';
import { toast } from '@/lib/styles/toast-styles';
import { collectPostableAccounts } from '@/features/chart-of-accounts/utils/account-tree';
import { AccountCombobox } from './account-combobox';

export function PostingAccountsPanel() {
  const {
    data: mappings = [],
    isLoading,
    isError,
  } = usePostingAccountMappings();
  const { data: tree = [] } = useFinanceAccountTree();
  const upsert = useUpsertPostingAccountMapping();
  const remove = useDeletePostingAccountMapping();

  const postableAccounts = useMemo(() => collectPostableAccounts(tree), [tree]);

  function handleSelect(role: PostingRole, accountId: string) {
    upsert.mutate(
      { role, data: { accountId } },
      {
        onSuccess: () =>
          toast.success('Posting account updated', {
            description: postingRoleLabels[role],
          }),
        onError: (error) =>
          toast.error(getErrorTitle(error, 'Update failed'), {
            description: getErrorMessage(error),
          }),
      }
    );
  }

  function handleReset(role: PostingRole) {
    remove.mutate(
      { role },
      {
        onSuccess: () =>
          toast.success('Reset to default', {
            description: postingRoleLabels[role],
          }),
        onError: (error) =>
          toast.error(getErrorTitle(error, 'Reset failed'), {
            description: getErrorMessage(error),
          }),
      }
    );
  }

  return (
    <Card className="space-y-4 p-6">
      <div>
        <h2 className="text-lg font-semibold">Posting accounts</h2>
        <p className="text-muted-foreground text-sm">
          The control accounts the ledger posts to when invoices and payments
          are recorded. Leave a role on its default account, or map it to a
          specific account in your chart.
        </p>
      </div>

      {isLoading && (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      )}

      {isError && (
        <p className="text-destructive text-sm">
          Failed to load posting-account mappings. Please try again.
        </p>
      )}

      {!isLoading && !isError && (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[180px]">Role</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Source</TableHead>
                <TableHead className="min-w-[300px]">Map to</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mappings.map((mapping) => {
                const rowUpserting =
                  upsert.isPending && upsert.variables?.role === mapping.role;
                const rowResetting =
                  remove.isPending && remove.variables?.role === mapping.role;
                const isDefault =
                  mapping.source === PostingAccountSource.DEFAULT;

                return (
                  <TableRow key={mapping.role}>
                    <TableCell className="font-medium">
                      {postingRoleLabels[mapping.role]}
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">
                        {mapping.accountCode}
                      </span>{' '}
                      <span className="text-muted-foreground text-sm">
                        {mapping.accountName}
                      </span>
                    </TableCell>
                    <TableCell>
                      {isDefault ? (
                        <Badge variant="outline">Default</Badge>
                      ) : (
                        <Badge variant="secondary">Mapped</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <AccountCombobox
                          accounts={postableAccounts}
                          value={mapping.accountId}
                          disabled={rowUpserting || rowResetting}
                          onSelect={(accountId) =>
                            handleSelect(mapping.role, accountId)
                          }
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 shrink-0"
                          title="Reset to default"
                          disabled={isDefault || rowUpserting || rowResetting}
                          onClick={() => handleReset(mapping.role)}
                        >
                          {rowResetting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RotateCcw className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </Card>
  );
}
