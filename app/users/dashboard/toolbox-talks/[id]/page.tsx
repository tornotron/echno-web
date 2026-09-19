'use client';

import { use } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { Button } from '@/components/shadcn/button';
import { ToolboxTalkDetail } from '@/features/toolbox-talks';
import { routes } from '@/nav';

export default function ToolboxTalkPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Toolbox Talk"
        actions={
          <Button asChild variant="outline">
            <Link href={routes.toolboxTalks.href}>
              <ArrowLeft className="size-4" />
              All talks
            </Link>
          </Button>
        }
      />
      <div className="max-w-3xl">
        <ToolboxTalkDetail talkId={id} />
      </div>
    </div>
  );
}
