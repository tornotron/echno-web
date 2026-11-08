'use client';

import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { getErrorMessage, getErrorTitle } from '@tornotron/echno-core';
import {
  useClearPaymentAuthorizer,
  usePaymentAuthorizer,
  useSetPaymentAuthorizer,
} from '@tornotron/echno-core/contract-billing/hooks';
import { useEmployeeLookup } from '@tornotron/echno-core/employee/hooks';
import { EmployeeStatus } from '@tornotron/echno-core/employee/types';
import { Button } from '@/components/shadcn/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
import { Label } from '@/components/shadcn/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/select';
import { Skeleton } from '@/components/shadcn/skeleton';
import { toast } from '@/lib/styles/toast-styles';
import { formatDateTime } from '../lib/format';
import { authorizerChangeText } from '../lib/payments';

/** Statuses in which an employee can no longer be named; the server refuses them too. */
const GONE = new Set<EmployeeStatus>([
  EmployeeStatus.inactive,
  EmployeeStatus.terminated,
  EmployeeStatus.resigned,
  EmployeeStatus.suspended,
]);

function failed(title: string) {
  return (err: unknown) =>
    toast.error(getErrorTitle(err, title), {
      description: getErrorMessage(err),
    });
}

/**
 * Who authorizes payments on a project's bills. Everyone reads it; a system
 * admin or a project manager names, changes or clears it, which does not by
 * itself let them authorize anything.
 */
export function PaymentAuthorizerCard({ projectId }: { projectId: number }) {
  const { data, isPending, isError, error } = usePaymentAuthorizer(projectId);

  if (isPending) return <Skeleton className="h-28 w-full" />;
  if (isError || !data) {
    return (
      <p role="alert" className="text-destructive text-sm">
        Could not load the payment authorizer: {getErrorMessage(error)}
      </p>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="size-4" aria-hidden="true" />
          Payment authorizer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {data.employeeName ? (
          <p>
            <span className="font-medium">{data.employeeName}</span>
            {data.readerIsAuthorizer && ' (you)'}
            {!data.active && ', no longer active'}
            {data.setByName && (
              <span className="text-muted-foreground">
                {' '}
                · named by {data.setByName}
                {data.setAt ? ` ${formatDateTime(data.setAt)}` : ''}
              </span>
            )}
          </p>
        ) : (
          <p>No one is named, so payments on this project wait.</p>
        )}
        <p className="text-muted-foreground text-xs">
          Only this person authorizes, rejects and records payments on the
          project&apos;s bills, and never a payment they raised. A system admin
          or a project manager names them.
        </p>
        {data.readerMayChange && (
          <ChangeAuthorizer
            projectId={projectId}
            current={data.employeeId}
            hasOne={data.employeeId !== undefined}
          />
        )}
        {data.changes.length > 0 && (
          <details>
            <summary className="text-muted-foreground cursor-pointer text-xs">
              Changes ({data.changes.length})
            </summary>
            <ul className="mt-2 space-y-1">
              {data.changes.map((change) => (
                <li key={change.id} className="text-muted-foreground text-xs">
                  {authorizerChangeText(change)}
                  {change.changedAt
                    ? `, ${formatDateTime(change.changedAt)}`
                    : ''}
                </li>
              ))}
            </ul>
          </details>
        )}
      </CardContent>
    </Card>
  );
}

function ChangeAuthorizer({
  projectId,
  current,
  hasOne,
}: {
  projectId: number;
  current?: number;
  hasOne: boolean;
}) {
  const { data: employees = [] } = useEmployeeLookup();
  const set = useSetPaymentAuthorizer();
  const clear = useClearPaymentAuthorizer();
  const [picked, setPicked] = useState<string>('');
  const choices = employees.filter(
    (employee) => !GONE.has(employee.status) && employee.id !== current
  );
  const busy = set.isPending || clear.isPending;

  return (
    <div className="space-y-2">
      <Label htmlFor="payment-authorizer">
        {hasOne ? 'Change to' : 'Name an authorizer'}
      </Label>
      <div className="flex flex-wrap gap-2">
        <Select value={picked} onValueChange={setPicked}>
          <SelectTrigger id="payment-authorizer" className="w-56">
            <SelectValue placeholder="Choose an employee" />
          </SelectTrigger>
          <SelectContent>
            {choices.map((employee) => (
              <SelectItem key={employee.id} value={String(employee.id)}>
                {employee.name}
                {employee.designation ? `, ${employee.designation}` : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size="sm"
          disabled={!picked || busy}
          onClick={() =>
            set.mutate(
              { projectId, req: { employeeId: Number(picked) } },
              {
                onSuccess: () => {
                  setPicked('');
                  toast.success('Payment authorizer named');
                },
                onError: failed('Could not name the payment authorizer'),
              }
            )
          }
        >
          {set.isPending ? 'Saving...' : 'Save'}
        </Button>
        {hasOne && (
          <Button
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() =>
              clear.mutate(projectId, {
                onSuccess: () => toast.success('Payment authorizer cleared'),
                onError: failed('Could not clear the payment authorizer'),
              })
            }
          >
            {clear.isPending ? 'Clearing...' : 'Clear'}
          </Button>
        )}
      </div>
    </div>
  );
}
