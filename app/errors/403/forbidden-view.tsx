'use client';

import { ShieldAlert } from 'lucide-react';
import { ErrorLayout } from '@/components/errors/error-layout';
import { useAuthorization } from '@/hooks/use-authorization';
import { forbiddenActions, forbiddenAdvice, type SearchParams } from './forbidden-actions';

/**
 * The 403 card. Reads the signed-in employee's org roles on the client (the
 * session carries none server-side) so a module denial offers "Upgrade plan"
 * to a system admin and "ask your administrator" to everyone else. While the
 * roles are still loading the reader is treated as a non-admin: the link
 * appears once the role is known rather than flashing for a member.
 */
export function ForbiddenView({ params }: { params: SearchParams }) {
  const { isSystemAdmin, isLoading } = useAuthorization();
  const canUpgrade = !isLoading && isSystemAdmin;
  const actions = forbiddenActions(params, canUpgrade);
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
      actions={actions}
      additionalInfo={
        <div className="space-y-2">
          <p className="font-medium">Need access?</p>
          <p className="text-sm" data-testid="forbidden-advice">
            {forbiddenAdvice(params, canUpgrade)}
          </p>
        </div>
      }
    />
  );
}
