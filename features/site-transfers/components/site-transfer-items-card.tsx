'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Package } from 'lucide-react';
import type { SiteTransfer } from '@/types/site-transfers';

interface SiteTransferItemsCardProps {
  transfer: SiteTransfer;
}

export function SiteTransferItemsCard({
  transfer,
}: SiteTransferItemsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Transfer Items
          <span className="ml-1 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium dark:bg-zinc-800">
            {transfer.items.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Material</TableHead>
              <TableHead>Sent Quantity</TableHead>
              <TableHead>Transfer Value</TableHead>
              <TableHead className="pr-6">Remarks</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transfer.items.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-muted-foreground py-6 text-center text-sm"
                >
                  No items
                </TableCell>
              </TableRow>
            )}
            {transfer.items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="pl-6 font-medium">
                  {item.materialName}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {item.sentQuantity}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {item.transferValue == null
                    ? '—'
                    : `₹${item.transferValue.toLocaleString('en-IN')}`}
                </TableCell>
                <TableCell className="text-muted-foreground pr-6">
                  {item.remarks ?? '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
