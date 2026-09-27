'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Loader2, UserPlus } from 'lucide-react';
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
import { useValidateInviteCodeMutation } from '@tornotron/echno-core/invitation/hooks';
import { organizationKeys } from '@tornotron/echno-core/organization/hooks';
import { Invitation } from '@tornotron/echno-core/invitation/types';

interface JoinOrganizationFormProps {
  /** The signed-in user redeeming the code. The form stays disabled until known. */
  userId?: number;
  /** Called once the backend has accepted the code and added the user. */
  onJoined: (invitation: Invitation | undefined) => void;
  /** Renders a Cancel button beside the submit button when given. */
  onCancel?: () => void;
  /** Extra content under the form, such as help text. */
  children?: React.ReactNode;
}

/**
 * Invite-code entry, shared by the dashboard join page and first-run
 * onboarding.
 *
 * Redeeming a valid code is a single backend step: it creates the employee
 * record and adds the user to the organization's Keycloak group. The only
 * thing left for the client is to refetch the membership list, which the
 * dashboard layout and onboarding both route on. The core mutation refreshes
 * the user and employee caches but not the organizations, so without the
 * invalidation here a user joining from onboarding would still look org-less
 * and be sent straight back.
 */
export function JoinOrganizationForm({
  userId,
  onJoined,
  onCancel,
  children,
}: JoinOrganizationFormProps) {
  const queryClient = useQueryClient();
  const [inviteCode, setInviteCode] = useState('');
  const [invalidCode, setInvalidCode] = useState(false);

  const joinMutation = useValidateInviteCodeMutation();

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();

    if (!inviteCode.trim() || !userId) {
      return;
    }

    setInvalidCode(false);
    joinMutation.mutate(
      { userId, inviteCode: inviteCode.trim() },
      {
        onSuccess: async (result) => {
          if (result.valid) {
            await queryClient.invalidateQueries({
              queryKey: organizationKeys.all,
            });
            onJoined(result.invitation);
          } else {
            setInvalidCode(true);
          }
        },
      }
    );
  };

  const isJoining = joinMutation.isPending;

  return (
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
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
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
                    Invalid or expired invite code. Please check and try again.
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isJoining}
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={isJoining || !inviteCode.trim() || !userId}
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

        {children}
      </CardContent>
    </Card>
  );
}
