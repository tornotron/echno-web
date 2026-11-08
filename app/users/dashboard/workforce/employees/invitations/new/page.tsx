import { PageHeader } from '@/components/common/page-header';
import { InvitationForm } from '@/features/invitation';

export default function NewInvitationPage() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Invite a Person"
        description="Send an invitation link that joins the person to your organization"
      />
      <InvitationForm />
    </div>
  );
}
