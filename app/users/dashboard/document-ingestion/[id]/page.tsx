'use client';

import { use } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { Button } from '@/components/shadcn/button';
import {
  IngestionGate,
  IngestPackageDetail,
} from '@/features/document-ingestion';
import { routes } from '@/nav';

export default function IngestPackagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Document package"
        actions={
          <Button asChild variant="outline">
            <Link href={routes.documentIngestion.href}>
              <ArrowLeft className="size-4" />
              All packages
            </Link>
          </Button>
        }
      />
      <IngestionGate>
        <IngestPackageDetail packageId={id} />
      </IngestionGate>
    </div>
  );
}
