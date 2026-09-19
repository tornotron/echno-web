'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { getErrorMessage } from '@tornotron/echno-core';
import { useToolboxTalk } from '@tornotron/echno-core/toolbox-talks/hooks';
import { ToolboxTalkStatus } from '@tornotron/echno-core/toolbox-talks/types';
import { PageHeader } from '@/components/common/page-header';
import { Skeleton } from '@/components/shadcn/skeleton';
import { ToolboxTalksForm } from '@/features/toolbox-talks';
import { routes } from '@/nav';

export default function EditToolboxTalkPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: talk, isPending, isError, error } = useToolboxTalk(id);
  const detail = routes.toolboxTalks.detail(id).href;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Edit Toolbox Talk" description={talk?.topic} />
      <div className="max-w-3xl">
        {isPending && <Skeleton className="h-64 w-full" />}
        {isError && (
          <p role="alert" className="text-destructive text-sm">
            {getErrorMessage(error)}
          </p>
        )}
        {talk && talk.status !== ToolboxTalkStatus.DRAFT && (
          <p className="text-muted-foreground text-sm">
            This talk has been recorded and no longer changes.
          </p>
        )}
        {talk && talk.status === ToolboxTalkStatus.DRAFT && (
          <ToolboxTalksForm
            talk={talk}
            onSaved={() => router.push(detail)}
            onCancel={() => router.push(detail)}
          />
        )}
      </div>
    </div>
  );
}
