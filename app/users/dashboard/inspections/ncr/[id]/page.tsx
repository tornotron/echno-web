'use client';

import { use } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/common';
import { Button } from '@/components/shadcn/button';
import { useNcrDefect } from '@/hooks/inspection';
import { routes } from '@/nav';
import { NcrDetail } from '@/features/inspections/components';

export default function NcrDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const ncrId = Number(id);
  const { data: defect } = useNcrDefect(ncrId);

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title={defect?.title ?? 'NCR'}
        description={defect?.ncrNumber}
        actions={
          <Button asChild variant="outline">
            <Link href={routes.inspections.ncr.href}>
              <ArrowLeft className="size-4" />
              All NCRs
            </Link>
          </Button>
        }
      />

      <div className="max-w-3xl">
        <NcrDetail ncrId={ncrId} />
      </div>
    </div>
  );
}
