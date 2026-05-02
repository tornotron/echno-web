import { PageHeader } from '@/components/common/page-header';
import { InvitationForm } from '@/features/invitation';

export default function NewInvitationPage() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Create New Invitation"
        description="Generate an invitation code for a new employee"
      />
      <InvitationForm />
    </div>
  );
}
