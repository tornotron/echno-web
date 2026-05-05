
import { ErrorLayout } from '@/components/errors/error-layout';
import { ShieldAlert } from 'lucide-react';

/**
 * 403 Forbidden Error Page
 *
 * Displayed when the user is authenticated but doesn't have permission
 * This replaces the old /access-denied page
 */
export default function ForbiddenPage() {
  return (
    <ErrorLayout
      statusCode={403}
      title="Access Forbidden"
      description="You don't have permission to access this resource."
      icon={ShieldAlert}
      iconColor="text-red-500"
      reasons={[
        "Your organization hasn't purchased this module",
        "Your role doesn't have the required permissions",
        'Your trial period has expired',
        'Module access has been suspended',
      ]}
      additionalInfo={
        <div className="space-y-2">
          <p className="font-medium">Need access?</p>
          <p className="text-sm">
            Contact your system administrator or organization owner to request
            the necessary permissions or upgrade your plan.
          </p>
        </div>
      }
    />
  );
}
