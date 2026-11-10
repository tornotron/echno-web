'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useCurrentSubscription } from '@tornotron/echno-core/billing/hooks';
import { billingKeys } from '@tornotron/echno-core/billing/hooks/keys';
import { billingService } from '@tornotron/echno-core/billing/services';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/shadcn/alert-dialog';
import { useAuthorization } from '@/hooks/use-authorization';
import { upgradePath } from '@/lib/billing/paths';
import { standardQueryOptions } from '@/lib/query/options';
import { formatDate } from '@/lib/utils/date-utils';
import {
  FREE_PLAN_CODE,
  endedTrialNotice,
  trialNoticeStorageKey,
  type EndedTrial,
} from '../lib/trial-ended';

function wasDismissed(key: string): boolean {
  try {
    return globalThis.localStorage.getItem(key) !== null;
  } catch {
    return false;
  }
}

function rememberDismissal(key: string): void {
  try {
    globalThis.localStorage.setItem(key, new Date().toISOString());
  } catch {
    // Storage refused (private window, quota): the notice may show once more, nothing breaks.
  }
}

/**
 * Tells the organization's system admin, once, that its trial has ended and it
 * is now on the Free plan (ClickUp 14zdkkvzx5e). Only the system admin sees it:
 * buying a plan is theirs to do, and the billing endpoints this reads answer
 * 403 to anyone else. Everyone else finds the premium modules gone from the
 * navigation and the module's page explaining that the plan does not include it.
 *
 * Shown on the first dashboard page the admin opens after the trial ends, and
 * never again for that trial once dismissed in that browser, whichever button
 * closes it.
 */
export function TrialEndedNotice() {
  const { isSystemAdmin, isLoading } = useAuthorization();
  if (isLoading || !isSystemAdmin) return null;
  return <TrialEndedNoticeForAdmin />;
}

function TrialEndedNoticeForAdmin() {
  const current = useCurrentSubscription();
  const onFreeOrNothing =
    current.isSuccess &&
    (current.data === null || current.data.plan?.code === FREE_PLAN_CODE);
  const history = useQuery({
    queryKey: billingKeys.history(),
    queryFn: () => billingService.getSubscriptionHistory(),
    enabled: onFreeOrNothing,
    ...standardQueryOptions,
  });

  if (!onFreeOrNothing || !history.isSuccess) return null;
  const trial = endedTrialNotice(current.data ?? null, history.data);
  if (!trial) return null;
  return <TrialEndedDialog trial={trial} />;
}

function TrialEndedDialog({ trial }: { trial: EndedTrial }) {
  const router = useRouter();
  const key = trialNoticeStorageKey(trial);
  const [open, setOpen] = useState(() => !wasDismissed(key));

  const close = () => {
    rememberDismissal(key);
    setOpen(false);
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) close();
      }}
    >
      <AlertDialogContent data-testid="trial-ended-notice">
        <AlertDialogHeader>
          <AlertDialogTitle>Your trial has ended</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                Your {trial.planName} trial ended on{' '}
                {formatDate(trial.trialEnd)}, and your organization is now on
                the Free plan.
              </p>
              <p>
                Premium features are locked, and so is the data saved in them.
                Nothing has been deleted: purchase a plan to get full use of
                Echno again, with everything as you left it.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Not now</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              close();
              router.push(upgradePath());
            }}
          >
            View plans
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
