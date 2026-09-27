'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/shadcn/button';
import { Card, CardContent } from '@/components/shadcn/card';
import { Building2, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { routes } from '@/nav';
import { useUser } from '@tornotron/echno-core/user/hooks';
import { JoinOrganizationForm } from '@/features/invitation/components/join-organization-form';

export default function JoinOrganizationPage() {
  const router = useRouter();
  const { data: user } = useUser();
  const [joined, setJoined] = useState(false);
  const [joinedOrgName, setJoinedOrgName] = useState('');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Join Organization</h1>
        <p className="text-muted-foreground mt-2">
          Enter your invitation code to join an organization
        </p>
      </div>

      <div className="mx-auto max-w-2xl">
        {joined ? (
          <Card>
            <CardContent className="py-10">
              <div className="space-y-6 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                  <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                    Successfully Joined!
                  </h2>
                  <p className="text-zinc-600 dark:text-zinc-400">
                    You have joined{' '}
                    {joinedOrgName ? (
                      <strong>{joinedOrgName}</strong>
                    ) : (
                      'the organization'
                    )}
                    . You can now set it as your default organization from the
                    organizations page.
                  </p>
                </div>
                <div className="flex justify-center gap-3">
                  <Button variant="outline" asChild>
                    <Link href={routes.href}>Go to Dashboard</Link>
                  </Button>
                  <Button asChild>
                    <Link href={routes.organizations.href}>
                      <Building2 className="mr-2 h-4 w-4" />
                      Go to Organizations
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <JoinOrganizationForm
            userId={user?.id}
            onJoined={(invitation) => {
              setJoinedOrgName(invitation?.organizationName ?? '');
              setJoined(true);
            }}
            onCancel={() => router.back()}
          >
            {/* Help Section */}
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="mb-2 font-semibold text-zinc-900 dark:text-zinc-100">
                Don&apos;t have an invite code?
              </h3>
              <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">
                Contact your organization administrator to get an invitation
                code, or create your own organization.
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link href={routes.organizations.new}>
                  <Building2 className="mr-2 h-4 w-4" />
                  Create Organization
                </Link>
              </Button>
            </div>
          </JoinOrganizationForm>
        )}
      </div>
    </div>
  );
}
