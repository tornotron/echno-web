'use client';

import { PageHeader } from '@/components/common/page-header';
import { ToolboxTalksList } from '@/features/toolbox-talks';

export default function ToolboxTalksPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Toolbox Talks"
        description="The daily safety briefings given on site, with who attended."
      />
      <ToolboxTalksList />
    </div>
  );
}
