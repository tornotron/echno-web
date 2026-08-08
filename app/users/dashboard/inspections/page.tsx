/**
 * app/users/dashboard/inspections/page.tsx
 *
 * Placeholder for the Inspections module while it is being rebuilt.
 * The previous pages (list, detail, edit, new) and their components were
 * removed; the data layer under types/inspection, hooks/inspection and
 * services/inspection-service is retained for the rebuild.
 */

import { Construction } from 'lucide-react';
import { PageHeader } from '@/components/common';
import {
  Empty,
  EmptyMedia,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from '@/components/shadcn/empty';

export default function InspectionsPage() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Inspections"
        description="Site inspection tracking and defect management"
      />
      <Empty variant="default">
        <EmptyMedia variant="icon">
          <Construction className="size-6" />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle>Development in Progress</EmptyTitle>
          <EmptyDescription>
            The Inspections module is being rebuilt and is temporarily
            unavailable. It will return in an upcoming release.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  );
}
