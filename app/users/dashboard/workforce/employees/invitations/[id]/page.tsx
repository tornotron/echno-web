'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';
import { PageHeader } from '@/components/common/page-header';
import {
  ArrowLeft,
  Copy,
  Check,
  Clock,
  CheckCircle,
  Calendar,
  Briefcase,
  Hash,
  Loader2,
} from 'lucide-react';
import { toast } from '@/lib/styles/toast-styles';
import { getInvitationStatus } from '@/types/invitation';
import { format } from 'date-fns';
import { useInvitationsByProject } from '@/hooks/invitation';
import { InvitationQRCode, InvitationStatusBadge } from '@/features/invitation';
import { InvitationErrorState } from '@/features/invitation/components/invitation-error-state';

export default function InvitationPage() {
  const params = useParams();
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const inviteCode = params.id as string;

  // The invitations list is project-scoped; without a selected project
  // we cannot load this page via the list route. A future improvement
  // would pass projectId in the URL or resolve it from context.
  const { data: invitations, isLoading, error } = useInvitationsByProject();

  const invitation = invitations?.find((inv) => inv.inviteCode === inviteCode);

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (error || !invitation) {
    return <InvitationErrorState inviteCode={inviteCode} />;
  }

  const copyToClipboard = (text: string) => {
    if (!navigator?.clipboard?.writeText) {
      toast.error('Failed to copy', {
        description:
          'Could not access clipboard. Please copy the code manually.',
      });
      return;
    }
    try {
      navigator.clipboard
        .writeText(text)
        .then(() => {
          setCopied(true);
          toast.success('Copied to clipboard!');
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(() => {
          toast.error('Failed to copy', {
            description:
              'Could not access clipboard. Please copy the code manually.',
          });
        });
    } catch {
      toast.error('Failed to copy', {
        description:
          'Could not access clipboard. Please copy the code manually.',
      });
    }
  };

  const currentStatus = getInvitationStatus(invitation);

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Invitation Details"
        badge={<InvitationStatusBadge status={currentStatus} />}
        description={invitation.inviteCode}
        className="mb-8"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Details */}
        <div className="space-y-6 lg:col-span-2">
          {/* Invite Info */}
          <Card>
            <CardHeader>
              <CardTitle>Invite Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20">
                    <Briefcase className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      Role
                    </p>
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                      {invitation.role || '—'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/20">
                    <Hash className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      Project ID
                    </p>
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                      {invitation.projectId}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Usage & Expiry */}
          <Card>
            <CardHeader>
              <CardTitle>Invitation Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/20">
                    <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      Expires
                    </p>
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                      {invitation.expiryDate
                        ? format(
                            invitation.expiryDate,
                            "MMM dd, yyyy 'at' h:mm a"
                          )
                        : 'Never'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/20">
                    <CheckCircle className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      Uses
                    </p>
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                      {invitation.usageCount} /{' '}
                      {invitation.maxUsageCount ?? '∞'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                    <Calendar className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      Created
                    </p>
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                      {format(
                        invitation.createdDate,
                        "MMM dd, yyyy 'at' h:mm a"
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6 lg:col-span-1">
          {/* Invite Code Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Invitation Code</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg bg-zinc-100 p-6 text-center dark:bg-zinc-800">
                <div className="mb-4 font-mono text-2xl font-bold tracking-wider text-blue-600 dark:text-blue-400">
                  {invitation.inviteCode}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(invitation.inviteCode)}
                  className="w-full"
                >
                  {copied ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy Code
                    </>
                  )}
                </Button>
              </div>

              <div className="mt-4">
                <InvitationQRCode
                  inviteCode={invitation.inviteCode}
                  size={256}
                  showDownload={true}
                />
              </div>
            </CardContent>
          </Card>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => router.back()}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Invitations
          </Button>
        </div>
      </div>
    </div>
  );
}
