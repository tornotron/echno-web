import { ErrorLayout } from '@/components/errors/error-layout';
import { ReloadButton } from '@/components/errors/reload-button';
import { ServerCrash } from 'lucide-react';
import { routes } from '@/nav';

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
          label: 'Go to Dashboard',
          href: routes.href,
          variant: 'outline',
        },
      ]}
      extraActions={<ReloadButton />}
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
