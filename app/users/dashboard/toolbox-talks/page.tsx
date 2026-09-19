'use client';

import { PageHeader } from '@/components/common/page-header';
import { ToolboxTalksList } from '@/features/toolbox-talks';

export default function ToolboxTalksPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Toolbox Talks" />
      <ToolboxTalksList />
    </div>
  );
}
