'use client';

import { useState } from 'react';
import { Button } from '@/components/shadcn/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { routes } from '@/nav';
import { PageHeader, AccessGate } from '@/components/common';
import { useVendorsPaginated } from '@tornotron/echno-core/vendor/hooks';
import { VendorListView } from '@/features/vendor';
import { useCan } from '@/hooks/use-can';
import { VENDOR_READ_ACCESS, VENDOR_WRITE_ACCESS } from '@/nav/access/roles';

const PAGE_SIZE = 10;

function VendorsPageContent() {
  // The store reads the register; adding to it is the administrator's
  // (echno-backend #853).
  const { allowed: canWrite } = useCan(VENDOR_WRITE_ACCESS);
  const [pageNo, setPageNo] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const {
    data: vendors = [],
    isLoading,
    error,
    isError,
    refetch,
  } = useVendorsPaginated(pageNo, PAGE_SIZE);

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Vendor Management"
        description="Manage suppliers and service providers"
        actions={
          canWrite ? (
            <Button size="sm" asChild>
              <Link href={routes.thirdParty.vendors.new}>
                <Plus className="mr-2 h-4 w-4" />
                Add Vendor
              </Link>
            </Button>
          ) : undefined
        }
      />

      <VendorListView
        vendors={vendors}
        isLoading={isLoading}
        isError={isError}
        error={error instanceof Error ? error : null}
        pageNo={pageNo}
        pageSize={PAGE_SIZE}
        onPageChange={setPageNo}
        onRetry={() => {
          refetch();
          setPageNo(0);
        }}
        search={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPageNo(0);
        }}
        statusFilter={statusFilter}
        onStatusFilterChange={(v) => {
          setStatusFilter(v);
          setPageNo(0);
        }}
        typeFilter={typeFilter}
        onTypeFilterChange={(v) => {
          setTypeFilter(v);
          setPageNo(0);
        }}
      />
    </div>
  );
}

export default function VendorsPage() {
  return (
    <AccessGate
      config={VENDOR_READ_ACCESS}
      subject="view vendors"
      allowed="system administrators and store keepers"
      backHref={routes.thirdParty.href}
      backLabel="Back to Third Party"
    >
      <VendorsPageContent />
    </AccessGate>
  );
}
