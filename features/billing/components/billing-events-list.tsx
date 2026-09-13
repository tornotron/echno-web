'use client';

import type { BillingEventSummary } from '@tornotron/echno-core/billing/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/shadcn/table';
import { formatDate } from '@/lib/utils/date-utils';
import { formatPaise } from '../lib/money';

function eventLabel(type: string): string {
  switch (type) {
    case 'invoice.paid':
    case 'INVOICE_PAID': {
      return 'Invoice paid';
    }
    case 'subscription.charged':
    case 'SUBSCRIPTION_CHARGED': {
      return 'Renewal charged';
    }
    case 'payment.failed':
    case 'PAYMENT_FAILED': {
      return 'Payment failed';
    }
    case 'subscription.activated':
    case 'SUBSCRIPTION_ACTIVATED': {
      return 'Subscription activated';
    }
    case 'subscription.cancelled':
    case 'SUBSCRIPTION_CANCELLED': {
      return 'Subscription cancelled';
    }
    default: {
      return type.replaceAll(/[._]/g, ' ');
    }
  }
}

interface BillingEventsListProps {
  events: BillingEventSummary[] | undefined;
  isLoading: boolean;
  /** True when the backend has no billing history surface yet. */
  unavailable?: boolean;
}

export function BillingEventsList({ events, isLoading, unavailable }: BillingEventsListProps) {
  return (
    <Card data-testid="billing-events">
      <CardHeader>
        <CardTitle>Invoices and payments</CardTitle>
        <CardDescription>Charges, invoices and failed payments for your organization.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading history</p>
        ) : unavailable ? (
          <p className="text-sm text-muted-foreground">
            Payment history is not available for this environment yet.
          </p>
        ) : !events || events.length === 0 ? (
          <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>{event.occurredAt ? formatDate(event.occurredAt) : ''}</TableCell>
                    <TableCell className="capitalize">{eventLabel(event.eventType)}</TableCell>
                    <TableCell className="font-mono text-xs">{event.reference ?? ''}</TableCell>
                    <TableCell className="text-right">
                      {event.amountPaise === null ? '' : formatPaise(event.amountPaise)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
