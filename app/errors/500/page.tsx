
import { ErrorLayout } from '@/components/errors/error-layout';
import { ServerCrash } from 'lucide-react';

/**
 * 500 Internal Server Error Page
 *
 * Displayed when the server encounters an unexpected condition
 */
export default function InternalServerErrorPage() {
  return (
    <ErrorLayout
      statusCode={500}
      title="Internal Server Error"
      description="Something went wrong on our end. We're working to fix it."
      icon={ServerCrash}
      iconColor="text-destructive"
      reasons={[
        'A server-side error occurred',
        'Database connection issue',
        'Unexpected application error',
        'Configuration problem',
      ]}
      actions={[
        {
          label: 'Reload Page',
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
          <p className="font-medium">What we&apos;re doing:</p>
          <p className="text-sm">
            Our team has been automatically notified and is investigating the
            issue. Please try again in a few moments.
          </p>
        </div>
      }
    />
  );
}
