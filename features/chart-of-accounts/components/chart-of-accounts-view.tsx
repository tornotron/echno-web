'use client';

import { useRef, useState } from 'react';
import { Card } from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';
import { Skeleton } from '@/components/shadcn/skeleton';
import {
  Plus,
  Download,
  Upload,
  Sparkles,
  BookOpen,
  Loader2,
  FolderTree,
} from 'lucide-react';
import {
  useFinanceAccountTree,
  useDeactivateAccount,
  useImportChartOfAccounts,
} from '@tornotron/echno-core/finance/hooks';
import {
  financeAccountService,
  financeJournalService,
} from '@tornotron/echno-core';
import { getErrorMessage, getErrorTitle } from '@tornotron/echno-core';
import type {
  AccountTreeNode,
  CoaImportSummary,
} from '@tornotron/echno-core/finance/types';
import { useAuthorization } from '@/hooks/use-authorization';
import { toast } from '@/lib/styles/toast-styles';
import { triggerBlobDownload } from '@/lib/utils/download';
import { AccountTreeView } from './account-tree-view';
import { AccountFormDialog } from './account-form-dialog';
import { DeactivateAccountDialog } from './deactivate-account-dialog';
import { ImportSummaryDialog } from './import-summary-dialog';
import { useSeedDefaultChart } from '../hooks/use-seed-default-chart';
import { findParentId } from '../utils/account-tree';

export function ChartOfAccountsView() {
  const { isSystemAdmin } = useAuthorization();
  const { data: tree = [], isLoading, isError } = useFinanceAccountTree();

  const deactivateAccount = useDeactivateAccount();
  const importChart = useImportChartOfAccounts();
  const seedDefaults = useSeedDefaultChart();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExportingCoa, setIsExportingCoa] = useState(false);
  const [isExportingJournal, setIsExportingJournal] = useState(false);

  // Create / edit dialog state.
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AccountTreeNode | null>(null);
  const [defaultParentId, setDefaultParentId] = useState<string | null>(null);

  // Deactivate dialog state.
  const [deactivateTarget, setDeactivateTarget] =
    useState<AccountTreeNode | null>(null);

  // Import summary dialog state.
  const [summary, setSummary] = useState<CoaImportSummary | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(false);

  function openCreate() {
    setEditTarget(null);
    setDefaultParentId(null);
    setFormOpen(true);
  }

  function openAddChild(node: AccountTreeNode) {
    setEditTarget(null);
    setDefaultParentId(node.id);
    setFormOpen(true);
  }

  function openEdit(node: AccountTreeNode) {
    setEditTarget(node);
    setDefaultParentId(findParentId(tree, node.id));
    setFormOpen(true);
  }

  function confirmDeactivate() {
    if (!deactivateTarget) return;
    const target = deactivateTarget;
    deactivateAccount.mutate(target.id, {
      onSuccess: () => {
        toast.success('Account deactivated', {
          description: `${target.code} · ${target.name}`,
        });
        setDeactivateTarget(null);
      },
      onError: (error) =>
        toast.error(getErrorTitle(error, 'Deactivation failed'), {
          description: getErrorMessage(error),
        }),
    });
  }

  function handleSeedDefaults() {
    seedDefaults.mutate(undefined, {
      onSuccess: (result) => {
        toast.success(
          result.created > 0
            ? `Seeded ${result.created} default accounts`
            : 'Chart already seeded',
          {
            description:
              result.created > 0
                ? 'The default chart of accounts is ready.'
                : 'This organization already has a chart of accounts.',
          }
        );
      },
      onError: (error) =>
        toast.error(getErrorTitle(error, 'Seeding failed'), {
          description: getErrorMessage(error),
        }),
    });
  }

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  function handleFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Allow re-selecting the same file later by clearing the input value.
    event.target.value = '';
    if (!file) return;

    importChart.mutate(file, {
      onSuccess: (result) => {
        setSummary(result);
        setSummaryOpen(true);
        toast.success('Import complete', {
          description: `${result.created} created, ${result.updated} updated`,
        });
      },
      onError: (error) =>
        toast.error(getErrorTitle(error, 'Import failed'), {
          description: getErrorMessage(error),
        }),
    });
  }

  async function handleExportCoa() {
    setIsExportingCoa(true);
    try {
      const blob = await financeAccountService.exportChartOfAccounts();
      triggerBlobDownload(blob, 'chart-of-accounts.csv');
    } catch (error) {
      toast.error(getErrorTitle(error, 'Export failed'), {
        description: getErrorMessage(error),
      });
    } finally {
      setIsExportingCoa(false);
    }
  }

  async function handleExportJournal() {
    setIsExportingJournal(true);
    try {
      const blob = await financeJournalService.exportJournalEntries();
      triggerBlobDownload(blob, 'journal-entries.csv');
    } catch (error) {
      toast.error(getErrorTitle(error, 'Export failed'), {
        description: getErrorMessage(error),
      });
    } finally {
      setIsExportingJournal(false);
    }
  }

  const isEmpty = !isLoading && !isError && tree.length === 0;

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={handleFileSelected}
      />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          New account
        </Button>
        {isSystemAdmin && (
          <Button
            variant="outline"
            onClick={handleSeedDefaults}
            disabled={seedDefaults.isPending}
          >
            {seedDefaults.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            Seed defaults
          </Button>
        )}
        <Button
          variant="outline"
          onClick={handleImportClick}
          disabled={importChart.isPending}
        >
          {importChart.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Upload className="mr-2 h-4 w-4" />
          )}
          Import CSV
        </Button>
        <Button
          variant="outline"
          onClick={handleExportCoa}
          disabled={isExportingCoa}
        >
          {isExportingCoa ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Export CSV
        </Button>
        <Button
          variant="outline"
          onClick={handleExportJournal}
          disabled={isExportingJournal}
        >
          {isExportingJournal ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <BookOpen className="mr-2 h-4 w-4" />
          )}
          Export journal (CSV)
        </Button>
      </div>

      {isLoading && (
        <Card className="p-6">
          <div className="space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        </Card>
      )}

      {isError && (
        <Card className="p-6">
          <p className="text-destructive text-sm">
            Failed to load the chart of accounts. Please try again.
          </p>
        </Card>
      )}

      {isEmpty && (
        <Card className="flex flex-col items-center justify-center gap-3 p-10 text-center">
          <FolderTree className="text-muted-foreground h-10 w-10" />
          <div>
            <p className="font-medium">No accounts yet</p>
            <p className="text-muted-foreground text-sm">
              {isSystemAdmin
                ? 'Seed the default chart of accounts to get started, or add accounts manually.'
                : 'Add your first ledger account to get started.'}
            </p>
          </div>
          <div className="flex gap-2">
            {isSystemAdmin && (
              <Button
                variant="outline"
                onClick={handleSeedDefaults}
                disabled={seedDefaults.isPending}
              >
                {seedDefaults.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                Seed defaults
              </Button>
            )}
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              New account
            </Button>
          </div>
        </Card>
      )}

      {!isLoading && !isError && tree.length > 0 && (
        <AccountTreeView
          tree={tree}
          onEdit={openEdit}
          onAddChild={openAddChild}
          onDeactivate={setDeactivateTarget}
        />
      )}

      <AccountFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        tree={tree}
        account={editTarget}
        defaultParentId={defaultParentId}
      />

      <DeactivateAccountDialog
        open={deactivateTarget !== null}
        onOpenChange={(next) => {
          if (!next) setDeactivateTarget(null);
        }}
        accountLabel={
          deactivateTarget
            ? `${deactivateTarget.code} · ${deactivateTarget.name}`
            : ''
        }
        isPending={deactivateAccount.isPending}
        onConfirm={confirmDeactivate}
      />

      <ImportSummaryDialog
        open={summaryOpen}
        onOpenChange={setSummaryOpen}
        summary={summary}
      />
    </div>
  );
}
