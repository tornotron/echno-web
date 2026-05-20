'use client';

import { useState } from 'react';
import { Button } from '@/components/shadcn/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { routes } from '@/nav';
import { PageHeader } from '@/components/common';
import { useVendorsPaginated } from '@/hooks/vendors';
import { VendorListView } from '@/features/vendor';

const PAGE_SIZE = 10;

export default function VendorsPage() {
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
          <Button size="sm" asChild>
            <Link href={routes.thirdParty.vendors.new}>
              <Plus className="mr-2 h-4 w-4" />
              Add Vendor
            </Link>
          </Button>
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
