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
import type { GoodsReceivedNote } from '@/types/grn';

interface GRNItemsCardProps {
  grn: GoodsReceivedNote;
}

export function GRNItemsCard({ grn }: GRNItemsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Received Items
          <span className="ml-1 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium dark:bg-zinc-800">
            {grn.items.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Material</TableHead>
              <TableHead>Ordered Qty</TableHead>
              <TableHead>Received Qty</TableHead>
              <TableHead>Unit Cost</TableHead>
              <TableHead className="pr-6">Variance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {grn.items.map((item) => {
              const variance = item.receivedQuantity - item.orderedQuantity;
              return (
                <TableRow key={item.id}>
                  <TableCell className="pl-6 font-medium">
                    {item.materialName}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.orderedQuantity}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.receivedQuantity}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.unitCost == null
                      ? '—'
                      : `₹${item.unitCost.toLocaleString('en-IN')}`}
                  </TableCell>
                  <TableCell
                    className={`pr-6 font-medium ${
                      variance < 0
                        ? 'text-red-600'
                        : variance > 0
                          ? 'text-blue-600'
                          : 'text-muted-foreground'
                    }`}
                  >
                    {variance === 0
                      ? '—'
                      : `${variance > 0 ? '+' : ''}${variance}`}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
