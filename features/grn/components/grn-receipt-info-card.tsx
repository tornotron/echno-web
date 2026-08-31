'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
import { AlertTriangle, Receipt } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import Link from 'next/link';
import { routes } from '@/nav';
import { employeeFilterHref } from '@/hooks/use-employee-filter';
import type { GoodsReceivedNote } from '@tornotron/echno-core/grn/types';

interface GRNReceiptInfoCardProps {
  grn: GoodsReceivedNote;
}

export function GRNReceiptInfoCard({ grn }: GRNReceiptInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Receipt className="h-4 w-4" />
          Receipt Info
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex justify-between border-b pb-2">
          <span className="text-muted-foreground">GRN Number</span>
          <span className="font-medium">{grn.grnNumber}</span>
        </div>
        <div className="flex justify-between border-b pb-2">
          <span className="text-muted-foreground">Received On</span>
          <span className="font-medium">
            {(() => {
              const d = parseISO(grn.receivedOn);
              return isValid(d) ? format(d, 'MMM dd, yyyy') : '—';
            })()}
          </span>
        </div>
        <div className="flex justify-between border-b pb-2">
          <span className="text-muted-foreground">Received By</span>
          <span className="font-medium">
            {grn.receivedBy?.id ? (
              <Link
                href={employeeFilterHref(
                  routes.resources.goodsReceipts.href,
                  grn.receivedBy.id,
                  'receiver'
                )}
                className="hover:underline"
              >
                {grn.receivedBy.name}
              </Link>
            ) : (
              grn.receivedBy?.name
            )}
          </span>
        </div>
        {grn.deliveryChallanNumber && (
          <div className="flex justify-between border-b pb-2">
            <span className="text-muted-foreground">Challan #</span>
            <span className="font-medium">{grn.deliveryChallanNumber}</span>
          </div>
        )}
        {grn.invoiceNumber && (
          <div className="flex justify-between border-b pb-2">
            <span className="text-muted-foreground">Invoice #</span>
            <span className="font-medium">{grn.invoiceNumber}</span>
          </div>
        )}
        {grn.invoiceAmount != null && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Invoice Amount</span>
            <span className="font-medium">
              ₹{grn.invoiceAmount.toLocaleString('en-IN')}
            </span>
          </div>
        )}
        {/*
          Somebody was shown the order's figures, decided the delivery really
          was bigger, and filed it anyway. The document is the only place that
          decision is recorded, so it is drawn rather than left to be inferred
          from a quantity that exceeds an order nobody is looking at.
        */}
        {grn.overReceiptAcknowledged && (
          <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              Accepted over the order. This receipt took a material past the
              quantity its purchase order asked for, and was recorded on a
              deliberate acknowledgement.
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
