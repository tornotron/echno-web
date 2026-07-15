'use client';

import Link from 'next/link';
import { routes } from '@/nav';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
import { Building2 } from 'lucide-react';
import type { GoodsReceivedNote } from '@tornotron/echno-core/grn/types';

interface GRNVendorPOCardProps {
  grn: GoodsReceivedNote;
}

export function GRNVendorPOCard({ grn }: GRNVendorPOCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Building2 className="h-4 w-4" />
          Vendor & PO
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex justify-between border-b pb-2">
          <span className="text-muted-foreground">Vendor</span>
          <span className="font-medium">{grn.vendorName}</span>
        </div>
        {grn.purchaseOrderId && (
          <div className="flex justify-between border-b pb-2">
            <span className="text-muted-foreground">Purchase Order</span>
            <Link
              href={
                routes.resources.purchaseOrders.detail(grn.purchaseOrderId).href
              }
              className="font-medium text-blue-600 hover:underline"
            >
              {grn.purchaseOrderNumber?.trim() || `PO #${grn.purchaseOrderId}`}
            </Link>
          </div>
        )}
        {grn.projectName && (
          <div className="flex justify-between border-b pb-2">
            <span className="text-muted-foreground">Project</span>
            <span className="font-medium">{grn.projectName}</span>
          </div>
        )}
        {grn.storageLocationName && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Storage Location</span>
            <span className="font-medium">{grn.storageLocationName}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
