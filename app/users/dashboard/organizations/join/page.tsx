'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  UserPlus,
  Loader2,
  Building2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useValidateInviteCodeMutation } from '@/hooks/invitation';
import { useJoinOrganization } from '@/hooks/employee/use-employee-mutations';
import { useUser } from '@/hooks/user/use-user';
import type { Invitation } from '@/types/invitation/invitation';

export default function JoinOrganizationPage() {
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState('');
  const [validatedInvitation, setValidatedInvitation] =
    useState<Invitation | null>(null);

  const { data: user } = useUser();
  const validateMutation = useValidateInviteCodeMutation();
  const joinMutation = useJoinOrganization();

  const handleValidate = (e: React.FormEvent) => {
    e.preventDefault();

    if (!inviteCode.trim() || !user?.id) {
      setValidatedInvitation(null);
      return;
    }

    validateMutation.mutate(
      { userId: user.id, inviteCode: inviteCode.trim() },
      {
        onSuccess: (result) => {
          if (result.valid && result.invitation) {
            setValidatedInvitation(result.invitation);
          } else {
            setValidatedInvitation(null);
          }
        },
        onError: () => {
          setValidatedInvitation(null);
        },
      }
    );
  };

  const handleJoin = () => {
    if (!user?.id || !validatedInvitation?.organizationId) {
      return;
    }

    joinMutation.mutate(
      {
        userId: user.id,
        organizationId: validatedInvitation.organizationId,
      },
      {
        onSuccess: () => {
          router.push('/users/dashboard/organizations');
        },
      }
    );
  };

  const isValidating = validateMutation.isPending;
  const isJoining = joinMutation.isPending;
  const isValid = !!validatedInvitation;

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
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600">
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
            <form onSubmit={handleValidate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="inviteCode">
                  Invitation Code <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="inviteCode"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="Enter your invite code"
                  className="font-mono text-lg uppercase"
                  disabled={isValidating || isValid}
                />
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  The invite code is case-insensitive and was provided by your
                  organization administrator
                </p>
              </div>

              {/* Validation Result */}
              {validateMutation.isError && (
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

              {validatedInvitation && (
                <Alert>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <div className="flex-1">
                      <AlertDescription>
                        <div className="space-y-3">
                          <p className="font-semibold">
                            Valid invitation code!
                          </p>
                          <div className="space-y-2 text-sm">
                            {validatedInvitation.organizationName && (
                              <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4" />
                                <span>
                                  Organization:{' '}
                                  <strong>
                                    {validatedInvitation.organizationName}
                                  </strong>
                                </span>
                              </div>
                            )}
                            {validatedInvitation.employeeDetails
                              .designation && (
                              <div className="flex items-center gap-2">
                                <UserPlus className="h-4 w-4" />
                                <span>
                                  Position:{' '}
                                  <strong>
                                    {
                                      validatedInvitation.employeeDetails
                                        .designation
                                    }
                                  </strong>
                                </span>
                              </div>
                            )}
                            {validatedInvitation.employeeDetails.department && (
                              <div className="text-zinc-600 dark:text-zinc-400">
                                Department:{' '}
                                {validatedInvitation.employeeDetails.department}
                              </div>
                            )}
                          </div>
                        </div>
                      </AlertDescription>
                    </div>
                  </div>
                </Alert>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                {isValid ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setInviteCode('');
                        setValidatedInvitation(null);
                        validateMutation.reset();
                      }}
                      disabled={isJoining}
                    >
                      Try Different Code
                    </Button>
                    <Button
                      type="button"
                      onClick={handleJoin}
                      disabled={isJoining || !user?.id}
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
                  </>
                ) : (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.back()}
                      disabled={isValidating}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isValidating || !inviteCode.trim() || !user?.id}
                    >
                      {isValidating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Validating...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Validate Code
                        </>
                      )}
                    </Button>
                  </>
                )}
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
                <Link href="/users/dashboard/organizations/new">
                  <Building2 className="mr-2 h-4 w-4" />
                  Create Organization
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
