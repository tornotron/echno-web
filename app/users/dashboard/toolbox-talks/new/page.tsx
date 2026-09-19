'use client';

import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/common/page-header';
import { ToolboxTalksForm } from '@/features/toolbox-talks';
import { routes } from '@/nav';

export default function NewToolboxTalkPage() {
  const router = useRouter();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="New Toolbox Talk"
        description="Draft a talk, then record it once the crew has been marked."
      />
      <div className="max-w-3xl">
        <ToolboxTalksForm
          onSaved={(talk) =>
            router.push(routes.toolboxTalks.detail(talk.id).href)
          }
          onCancel={() => router.push(routes.toolboxTalks.href)}
        />
      </div>
    </div>
  );
}
