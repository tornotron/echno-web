'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/shadcn/button';
import { Input } from '@/components/shadcn/input';
import { Label } from '@/components/shadcn/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
import { Alert, AlertDescription } from '@/components/shadcn/alert';
import {
  UserPlus,
  Loader2,
  Building2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { routes } from '@/nav';
import { useValidateInviteCodeMutation } from '@tornotron/echno-core/invitation/hooks';
import { useUser } from '@tornotron/echno-core/user/hooks';

export default function JoinOrganizationPage() {
  const router = useRouter();
  const { data: user } = useUser();
  const [inviteCode, setInviteCode] = useState('');
  const [joined, setJoined] = useState(false);
  const [joinedOrgName, setJoinedOrgName] = useState('');
  const [invalidCode, setInvalidCode] = useState(false);

  const joinMutation = useValidateInviteCodeMutation();

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();

    if (!inviteCode.trim() || !user?.id) {
      return;
    }

    setInvalidCode(false);
    joinMutation.mutate(
      { userId: user.id, inviteCode: inviteCode.trim() },
      {
        onSuccess: (result) => {
          if (result.valid) {
            setJoinedOrgName(result.invitation?.organizationName ?? '');
            setJoined(true);
          } else {
            setInvalidCode(true);
          }
        },
      }
    );
  };

  const isJoining = joinMutation.isPending;

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
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-linear-to-br from-blue-500 to-blue-600">
                  <UserPlus className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle>Enter Invitation Code</CardTitle>
                  <CardDescription>
                    Use the code provided by your organization
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleJoin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="inviteCode">
                    Invitation Code <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="inviteCode"
                    value={inviteCode}
                    onChange={(e) =>
                      setInviteCode(e.target.value.toUpperCase())
                    }
                    placeholder="Enter your invite code"
                    className="font-mono text-lg uppercase"
                    disabled={isJoining}
                  />
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    The invite code is case-insensitive and was provided by your
                    organization administrator
                  </p>
                </div>

                {/* Error */}
                {(joinMutation.isError || invalidCode) && (
                  <Alert variant="destructive">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-5 w-5" />
                      <div className="flex-1">
                        <AlertDescription>
                          Invalid or expired invite code. Please check and try
                          again.
                        </AlertDescription>
                      </div>
                    </div>
                  </Alert>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={isJoining}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isJoining || !inviteCode.trim()}
                  >
                    {isJoining ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Joining...
                      </>
                    ) : (
                      <>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Join Organization
                      </>
                    )}
                  </Button>
                </div>
              </form>

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
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
