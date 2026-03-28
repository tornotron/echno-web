'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Receipt } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import type { GoodsReceivedNote } from '@/types/grn';

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
          <span className="font-medium">{grn.receivedBy.name}</span>
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
      </CardContent>
    </Card>
  );
}
