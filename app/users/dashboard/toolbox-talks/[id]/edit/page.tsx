'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { useToolboxTalk } from '@tornotron/echno-core/toolbox-talks/hooks';
import { PageHeader } from '@/components/common/page-header';
import { ToolboxTalkEditPanel } from '@/features/toolbox-talks';
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
      <PageHeader title="Edit Toolbox Talk" />
      <div className="max-w-3xl">
        <ToolboxTalkEditPanel
          talk={talk}
          isPending={isPending}
          isError={isError}
          error={error}
          onSaved={() => router.push(detail)}
          onCancel={() => router.push(detail)}
        />
      </div>
    </div>
  );
}
