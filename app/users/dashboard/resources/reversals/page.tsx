'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Card } from '@/components/shadcn/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/shadcn/tabs';
import { PageHeader, Pagination } from '@/components/common';
import { useUser } from '@tornotron/echno-core/user/hooks';
import { DocumentReversalStatus } from '@tornotron/echno-core/document-reversals/types';
import { useDocumentReversalsPaginated } from '@tornotron/echno-core/document-reversals/hooks';
import { useAuthorization } from '@/hooks/use-authorization';
import {
  DecideReversalDialog,
  ReversalTable,
} from '@/features/document-reversals/components';
import { useReversalDecision } from '@/features/document-reversals/hooks';

const PAGE_SIZE = 20;

/**
 * Reversal requests: the pending queue an approver works through, and the
 * full history behind it. Sits beside stock adjustments because it is the
 * same kind of second-pair-of-eyes decision on a stock document.
 */
export default function ReversalsPage() {
  const [tab, setTab] = useState<'pending' | 'all'>('pending');
  const [pendingPage, setPendingPage] = useState(1);
  const [allPage, setAllPage] = useState(1);
  const { data: currentUser } = useUser();
  const { isSystemAdmin, isManagerOrAbove } = useAuthorization();
  const canDecide = isSystemAdmin || isManagerOrAbove;
  const decision = useReversalDecision();

  const pending = useDocumentReversalsPaginated(
    pendingPage - 1,
    PAGE_SIZE,
    DocumentReversalStatus.pending
  );
  const all = useDocumentReversalsPaginated(allPage - 1, PAGE_SIZE);

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Reversals"
        description="Requests to undo a site transfer, purchase order or goods receipt. A document is never deleted: its creator asks, an administrator or project manager decides, and on approval the stock goes back where it was."
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as 'pending' | 'all')}>
        <TabsList>
          <TabsTrigger value="pending">
            Awaiting decision
            {pending.data && pending.data.totalElements > 0 && (
              <span className="ml-1.5 rounded-full bg-amber-100 px-1.5 text-xs text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                {pending.data.totalElements}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="all">All requests</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card className="p-0">
            {pending.isLoading ? (
              <Loading />
            ) : (
              <ReversalTable
                reversals={pending.data?.content ?? []}
                canDecide={canDecide}
                currentUserId={currentUser?.id}
                onDecide={decision.open}
                emptyTitle="Nothing awaiting a decision"
                emptyDescription="A request appears here when the person who raised a transfer, order or receipt asks for it to be reversed."
              />
            )}
          </Card>
          {pending.data && pending.data.totalPages > 1 && (
            <div className="mt-4">
              <Pagination
                currentPage={pendingPage}
                totalPages={pending.data.totalPages}
                onPageChange={setPendingPage}
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="all">
          <Card className="p-0">
            {all.isLoading ? (
              <Loading />
            ) : (
              <ReversalTable
                reversals={all.data?.content ?? []}
                canDecide={canDecide}
                currentUserId={currentUser?.id}
                onDecide={decision.open}
                emptyTitle="No reversal requests yet"
                emptyDescription="Every request ever raised, approved, rejected or withdrawn will be listed here."
              />
            )}
          </Card>
          {all.data && all.data.totalPages > 1 && (
            <div className="mt-4">
              <Pagination
                currentPage={allPage}
                totalPages={all.data.totalPages}
                onPageChange={setAllPage}
              />
            </div>
          )}
        </TabsContent>
      </Tabs>

      <DecideReversalDialog
        reversal={decision.target}
        decision={decision.decision}
        onOpenChange={(open) => {
          if (!open) decision.close();
        }}
        onApprove={decision.onApprove}
        onReject={decision.onReject}
        isPending={decision.isPending}
      />
    </div>
  );
}

function Loading() {
  return (
    <div className="flex items-center justify-center p-12">
      <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
    </div>
  );
}
