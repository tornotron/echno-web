'use client';

import { ErrorLayout } from '@/components/errors/error-layout';
import { CloudOff } from 'lucide-react';

/**
 * 502 Bad Gateway Error Page
 *
 * Displayed when the server received an invalid response from upstream
 */
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
          label: 'Try Again',
          onClick: () => globalThis.location.reload(),
          variant: 'default',
        },
        {
          label: 'Go to Dashboard',
          href: '/users/dashboard',
          variant: 'outline',
        },
      ]}
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
