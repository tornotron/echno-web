'use client';

import { LabourEditForm } from '@/features/labour';
import { AccessGate } from '@/components/common';
import { LABOUR_ACCESS } from '@/nav/access/roles';
import { routes } from '@/nav';

function NewLabourPageContent() {
  return <LabourEditForm isEdit={false} />;
}

export default function NewLabourPage() {
  return (
    <AccessGate
      config={LABOUR_ACCESS}
      subject="add labour records"
      allowed="system administrators and HR managers"
      backHref={routes.thirdParty.href}
      backLabel="Back to Third Party"
    >
      <NewLabourPageContent />
    </AccessGate>
  );
}
