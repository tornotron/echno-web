'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Save, LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';
import {
  OrganizationForm,
  ORGANIZATION_FORM_ID,
} from '@/features/organization';
import { getErrorMessage, getErrorTitle } from '@tornotron/echno-core';
import { UpdateOrganizationRequest } from '@tornotron/echno-core/organization/types';
import {
  useCreateOrganization,
  useOrganizationSummaries,
} from '@tornotron/echno-core/organization/hooks';
import {
  useUser,
  useUpdateUserOrganization,
} from '@tornotron/echno-core/user/hooks';
import { toast } from '@/lib/styles/toast-styles';
import { Button } from '@/components/shadcn/button';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/shadcn/tabs';
import { JoinOrganizationForm } from '@/features/invitation/components/join-organization-form';
import { routes } from '@/nav';

/**
 * First-run onboarding for a signed-in user who belongs to no organization yet.
 *
 * Public self-signup lands a brand-new user here (routed by the dashboard
 * layout guard). They either create their first organization, in which case
 * the backend makes the creator its system-admin and seeds it, or redeem an
 * invitation code from an administrator, which adds them to that organization
 * as an employee. Either way we set the organization as the user's default and
 * drop them into the dashboard.
 *
 * The join path has to live here and not only on the dashboard join page: the
 * dashboard layout sends every org-less user to this page, so an invited user
 * could never reach a join form inside the dashboard.
 *
 * Lives outside the dashboard shell on purpose: a user with no organization has
 * no tenant scope, so the sidebar/breadcrumb chrome would be empty or broken.
 */
export default function OnboardingPage() {
  const router = useRouter();
  const { data: currentUser, isLoading: isUserLoading } = useUser();
  const { data: organizations, isLoading: isOrgsLoading } =
    useOrganizationSummaries();
  const { mutate: createOrganization, isPending } = useCreateOrganization();
  const { mutate: setDefaultOrganization } = useUpdateUserOrganization();
  const [mode, setMode] = useState<'create' | 'join'>('create');

  const hasOrganization = (organizations?.length ?? 0) > 0;

  // A user who already belongs to an organization should never see onboarding.
  // This also covers the just-created transition: once the new org lands in the
  // cache the guard sends them into the dashboard, matching the explicit
  // navigation in the submit handler (same target, so no redirect loop).
  useEffect(() => {
    if (isUserLoading || isOrgsLoading) return;
    if (hasOrganization) {
      router.replace(routes.href);
    }
  }, [isUserLoading, isOrgsLoading, hasOrganization, router]);

  const handleJoined = (organizationId?: number, organizationName?: string) => {
    toast.success('Joined Organization', {
      description: organizationName
        ? `Welcome to ${organizationName}. Setting up your workspace...`
        : 'Welcome aboard. Setting up your workspace...',
    });
    if (currentUser?.id && organizationId) {
      setDefaultOrganization({ id: currentUser.id, organizationId });
    }
    router.replace(routes.href);
  };

  const handleSubmit = (data: UpdateOrganizationRequest, logoFile?: File) => {
    if (!currentUser?.id) {
      toast.error('User not found', {
        description: 'Please log in again',
      });
      return;
    }

    createOrganization(
      {
        data: {
          organizationName: data.organizationName!,
          organizationAddress: data.organizationAddress!,
          organizationEmail: data.organizationEmail!,
          organizationPhone: data.organizationPhone!,
          organizationWebsite: data.organizationWebsite,
          isActive: data.isActive,
        },
        files: logoFile ? { logo: logoFile } : undefined,
      },
      {
        onSuccess: (newOrganization) => {
          toast.success('Organization Created', {
            description: 'Welcome aboard. Setting up your workspace...',
          });
          // Make the freshly created org the active scope before entering the
          // dashboard so the user lands inside it rather than on another guard.
          if (currentUser.id && newOrganization?.id) {
            setDefaultOrganization({
              id: currentUser.id,
              organizationId: newOrganization.id,
            });
          }
          router.replace(routes.href);
        },
        onError: (error) => {
          toast.error(getErrorTitle(error, 'Failed to Create Organization'), {
            description: getErrorMessage(error),
          });
        },
      }
    );
  };

  // Wait for the user + membership queries before deciding what to render, so
  // the onboarding form never flashes for a user who actually has an org.
  if (isUserLoading || isOrgsLoading || hasOrganization) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 dark:bg-slate-900">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 dark:bg-slate-900">
        <div className="text-center">
          <p className="text-red-500">User not found</p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Please log in again
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => signOut({ callbackUrl: '/' })}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Back to login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-10 dark:bg-slate-900">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            Welcome to Echno
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            You are not part of any organization yet. Create one to get started,
            or join an existing one with the invitation code your administrator
            gave you.
          </p>
        </div>

        <Tabs
          value={mode}
          onValueChange={(value) => setMode(value as 'create' | 'join')}
          className="space-y-4"
        >
          <TabsList className="mx-auto">
            <TabsTrigger value="create" disabled={isPending}>
              Create Organization
            </TabsTrigger>
            <TabsTrigger value="join" disabled={isPending}>
              Join with Invitation Code
            </TabsTrigger>
          </TabsList>
          <TabsContent value="create" className="space-y-2">
            <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
              You will be the administrator of the organization you create.
            </p>
            <OrganizationForm onSubmit={handleSubmit} />
          </TabsContent>
          <TabsContent value="join">
            <JoinOrganizationForm
              userId={currentUser.id}
              onJoined={(invitation) =>
                handleJoined(
                  invitation?.organizationId,
                  invitation?.organizationName
                )
              }
            />
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            disabled={isPending}
            onClick={() => signOut({ callbackUrl: '/' })}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
          {mode === 'create' && (
            <Button
              type="submit"
              form={ORGANIZATION_FORM_ID}
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Create Organization
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
