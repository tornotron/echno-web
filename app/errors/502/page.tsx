import { ErrorLayout } from '@/components/errors/error-layout';
import { ReloadButton } from '@/components/errors/reload-button';
import { CloudOff } from 'lucide-react';
import { routes } from '@/nav';

export default function BadGatewayPage() {
  return (
    <ErrorLayout
      statusCode={502}
      title="Bad Gateway"
      description="The server received an invalid response. This is usually temporary."
      icon={CloudOff}
      iconColor="text-orange-500"
      reasons={[
        'Upstream server is down or unreachable',
        'Network connectivity issue',
        'Load balancer or proxy configuration error',
        'Temporary service disruption',
      ]}
      actions={[
        {
          label: 'Go to Dashboard',
          href: routes.href,
          variant: 'outline',
        },
      ]}
      extraActions={<ReloadButton label="Try Again" />}
      additionalInfo={
        <div className="space-y-2">
          <p className="font-medium">This is usually temporary</p>
          <p className="text-sm">
            The service should be back shortly. If the problem persists, please
            contact support.
          </p>
        </div>
      }
    />
  );
}
