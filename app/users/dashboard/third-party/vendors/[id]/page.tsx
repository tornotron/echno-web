'use client';

import { use } from 'react';
import { routes } from '@/nav';
import Link from 'next/link';
import { Button } from '@/components/shadcn/button';
import { Badge } from '@/components/shadcn/badge';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/shadcn/tabs';
import { Edit, Building2, Loader2 } from 'lucide-react';
import {
  Empty,
  EmptyErrorMedia,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from '@/components/shadcn/empty';
import {
  useVendor,
  useVendorContacts,
  useVendorBankAccounts,
} from '@/hooks/vendors';
import { getVendorTypeLabel } from '@/types/vendor';
import {
  VendorStatusBadge,
  VendorOverviewTab,
  VendorContactsTab,
  VendorBankingTab,
  VendorTaxTab,
} from '@/features/vendor';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function VendorDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const vendorId = Number(id);

  const isValidId = Number.isFinite(vendorId) && vendorId > 0;

  const { data: vendor, isLoading, isError, error } = useVendor(vendorId);
  // Fetched here only for tab badge counts — tab components re-use the same cache
  const { data: contacts = [] } = useVendorContacts(vendorId);
  const { data: bankAccounts = [] } = useVendorBankAccounts(vendorId);

  if (!isValidId) {
    return (
      <Empty variant="default">
        <EmptyErrorMedia>
          <Building2 className="size-6" />
        </EmptyErrorMedia>
        <EmptyHeader>
          <EmptyTitle>Invalid vendor</EmptyTitle>
          <EmptyDescription>
            &quot;{id}&quot; is not a valid vendor identifier.
          </EmptyDescription>
        </EmptyHeader>
        <Button asChild>
          <Link href={routes.thirdParty.vendors.href}>Back to Vendors</Link>
        </Button>
      </Empty>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (isError || !vendor) {
    return (
      <Empty variant="default">
        <EmptyErrorMedia>
          <Building2 className="size-6" />
        </EmptyErrorMedia>
        <EmptyHeader>
          <EmptyTitle>Vendor not found</EmptyTitle>
          <EmptyDescription>
            {isError && error instanceof Error
              ? error.message
              : `Vendor #${id} could not be found.`}
          </EmptyDescription>
        </EmptyHeader>
        <Button asChild>
          <Link href={routes.thirdParty.vendors.href}>Back to Vendors</Link>
        </Button>
      </Empty>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            {vendor.name}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <VendorStatusBadge status={vendor.status} />
            {vendor.type && (
              <Badge variant="outline">{getVendorTypeLabel(vendor.type)}</Badge>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={routes.thirdParty.vendors.detail(vendor.id).edit}>
              <Edit className="mr-2 h-4 w-4" /> Edit
            </Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="contacts">
            Contacts
            {contacts.length > 0 && (
              <span className="ml-1.5 rounded-full bg-zinc-200 px-1.5 py-0.5 text-xs dark:bg-zinc-700">
                {contacts.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="banking">
            Banking
            {bankAccounts.length > 0 && (
              <span className="ml-1.5 rounded-full bg-zinc-200 px-1.5 py-0.5 text-xs dark:bg-zinc-700">
                {bankAccounts.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="tax">Tax & Legal</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <VendorOverviewTab vendorId={vendorId} vendor={vendor} />
        </TabsContent>

        <TabsContent value="contacts" className="mt-4">
          <VendorContactsTab vendorId={vendorId} />
        </TabsContent>

        <TabsContent value="banking" className="mt-4">
          <VendorBankingTab vendorId={vendorId} />
        </TabsContent>

        <TabsContent value="tax" className="mt-4">
          <VendorTaxTab vendorId={vendorId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
