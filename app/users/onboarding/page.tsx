'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, LogOut, Mail } from 'lucide-react';
import { signOut } from '@/lib/auth/client';
import { useOrganizationSummaries } from '@tornotron/echno-core/organization/hooks';
import { useUser } from '@tornotron/echno-core/user/hooks';
import { Button } from '@/components/shadcn/button';
import { Card, CardContent } from '@/components/shadcn/card';
import { routes } from '@/nav';

/**
 * Where a signed-in person with no organization lands (routed here by the
 * dashboard layout guard).
 *
 * Nobody joins with a code or registers themselves any more: a person joins
 * only by accepting an invitation sent to their address, and accepting it is
 * what makes them an employee. So this page has nothing to fill in. It tells
 * them to ask their administrator, and lets them sign out to try another
 * account.
 *
 * Lives outside the dashboard shell on purpose: a user with no organization has
 * no tenant scope, so the sidebar/breadcrumb chrome would be empty or broken.
 */
export default function OnboardingPage() {
  const router = useRouter();
  const { data: currentUser, isLoading: isUserLoading } = useUser();
  const { data: organizations, isLoading: isOrgsLoading } =
    useOrganizationSummaries();

  const hasOrganization = (organizations?.length ?? 0) > 0;

  // A user who already belongs to an organization should never see this page,
  // for example right after an invitation was accepted at their first sign-in.
  useEffect(() => {
    if (isUserLoading || isOrgsLoading) return;
    if (hasOrganization) {
      router.replace(routes.href);
    }
  }, [isUserLoading, isOrgsLoading, hasOrganization, router]);

  // Wait for the user and membership queries before deciding what to render,
  // so the message never flashes for a user who actually has an organization.
  if (isUserLoading || isOrgsLoading || hasOrganization) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 dark:bg-slate-900">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10 dark:bg-slate-900">
      <Card className="w-full max-w-lg">
        <CardContent className="space-y-6 pt-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-500/15">
            <Mail className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              You are not part of an organization yet
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400">
              A person joins an organization through an invitation from its
              administrator. Ask your administrator to invite you at the email
              address you signed in with, then open the link in that email.
            </p>
            {/* Core fills a missing address with a placeholder, not an address. */}
            {currentUser?.email?.includes('@') && (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                You are signed in as{' '}
                <span className="font-medium">{currentUser.email}</span>.
              </p>
            )}
          </div>
          <Button
            variant="outline"
            onClick={() => signOut({ callbackUrl: '/' })}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
