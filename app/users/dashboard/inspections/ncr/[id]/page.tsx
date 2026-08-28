'use client';

import { use } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/common';
import { Button } from '@/components/ui/button';
import { useNcrById } from '@/hooks/inspection';
import { routes } from '@/nav';
import { NcrDetail } from '@/features/inspections/components/ncr-detail';

export default function NcrDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: ncr } = useNcrById(id);

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title={ncr?.title ?? 'NCR'}
        description={ncr?.ncrNumber}
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
        <NcrDetail ncrId={id} />
      </div>
    </div>
  );
}
