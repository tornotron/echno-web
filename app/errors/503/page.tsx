import { ErrorLayout } from '@/components/errors/error-layout';
import { ReloadButton } from '@/components/errors/reload-button';
import { Construction } from 'lucide-react';
import { routes } from '@/nav';

export default function ServiceUnavailablePage() {
  return (
    <ErrorLayout
      statusCode={503}
      title="Service Unavailable"
      description="The service is temporarily unavailable. Please try again later."
      icon={Construction}
      iconColor="text-amber-500"
      reasons={[
        'Scheduled maintenance in progress',
        'Server is overloaded or down',
        'Temporary service interruption',
        'System upgrades being deployed',
      ]}
      actions={[
        {
          label: 'Go to Dashboard',
          href: routes.href,
          variant: 'outline',
        },
      ]}
      extraActions={<ReloadButton label="Retry" />}
      additionalInfo={
        <div className="space-y-2">
          <p className="font-medium">Maintenance Information</p>
          <p className="text-sm">
            We may be performing scheduled maintenance. Please check back
            shortly.
          </p>
        </div>
      }
    />
  );
}
