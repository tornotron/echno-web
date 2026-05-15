import { ErrorLayout } from '@/components/errors/error-layout';
import { Lock } from 'lucide-react';
import { routes } from '@/nav';

export default function UnauthorizedPage() {
  return (
    <ErrorLayout
      statusCode={401}
      title="Authentication Required"
      description="You need to be signed in to access this page."
      icon={Lock}
      iconColor="text-amber-500"
      reasons={[
        'You are not logged in',
        'Your session has expired',
        'Invalid authentication credentials',
        'Authentication token is missing or invalid',
      ]}
      actions={[
        {
          label: 'Go to Home',
          href: '/',
          variant: 'default',
        },
        {
          label: 'Go to Dashboard',
          href: routes.href,
          variant: 'outline',
        },
      ]}
    />
  );
}
