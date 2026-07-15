'use client';

import { useState } from 'react';
import Link from 'next/link';
import { routes } from '@/nav';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';
import { Badge } from '@/components/shadcn/badge';
import { Input } from '@/components/shadcn/input';
import { Label } from '@/components/shadcn/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/select';
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
import { Loader2, Pencil, Check, X } from 'lucide-react';
import { format } from 'date-fns';
import { useUpdatePurchaseOrder } from '@tornotron/echno-core/purchase-orders/hooks';
import { getErrorTitle, getErrorMessage } from '@tornotron/echno-core';
import { toast } from '@/lib/styles/toast-styles';
import { useProjects } from '@tornotron/echno-core/project/hooks';
import {
  PurchaseOrderStatus,
  purchaseOrderStatusLabels,
  purchaseOrderStatusBadgeColors,
} from '@tornotron/echno-core/purchase-orders/types';
import type { PurchaseOrder } from '@tornotron/echno-core/purchase-orders/types';

interface POInfoCardProps {
  po: PurchaseOrder;
}

export function POInfoCard({ po }: POInfoCardProps) {
  const { mutateAsync: updatePO, isPending } = useUpdatePurchaseOrder();
  const { data: projects = [] } = useProjects();

  const [isEditing, setIsEditing] = useState(false);
  const [prevPo, setPrevPo] = useState(po);
  const [form, setForm] = useState({
    status: po.status,
    projectId: po.projectId ?? 0,
    expectedDeliveryDate: po.expectedDeliveryDate
      ? po.expectedDeliveryDate.split('T')[0]
      : '',
    totalAmount: po.totalAmount == null ? '' : String(po.totalAmount),
  });
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (prevPo !== po) {
    setPrevPo(po);
    setForm({
      status: po.status,
      projectId: po.projectId ?? 0,
      expectedDeliveryDate: po.expectedDeliveryDate
        ? po.expectedDeliveryDate.split('T')[0]
        : '',
      totalAmount: po.totalAmount == null ? '' : String(po.totalAmount),
    });
  }

  function handleCancel() {
    setIsEditing(false);
    setForm({
      status: po.status,
      projectId: po.projectId ?? 0,
      expectedDeliveryDate: po.expectedDeliveryDate
        ? po.expectedDeliveryDate.split('T')[0]
        : '',
      totalAmount: po.totalAmount == null ? '' : String(po.totalAmount),
    });
  }

  async function handleConfirm() {
    try {
      await updatePO({
        id: po.id,
        status: form.status,
        projectId: form.projectId || undefined,
        expectedDeliveryDate: form.expectedDeliveryDate
          ? new Date(form.expectedDeliveryDate).toISOString()
          : undefined,
        totalAmount: form.totalAmount
          ? Number.parseFloat(form.totalAmount)
          : undefined,
        remarks: po.remarks,
      });
      setIsEditing(false);
      toast.success('Purchase Order Updated', {
        description: 'The purchase order has been updated successfully.',
      });
    } catch (error) {
      toast.error(getErrorTitle(error, 'Failed to Update Purchase Order'), {
        description: getErrorMessage(error),
      });
    }
  }

  return (
    <>
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update Purchase Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to save these changes?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">PO Info</CardTitle>
            {isEditing ? (
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-green-600 hover:text-green-700"
                  onClick={() => setConfirmOpen(true)}
                  disabled={isPending}
                >
                  {isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={handleCancel}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setIsEditing(true)}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {isEditing ? (
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) =>
                    setForm({ ...form, status: v as PurchaseOrderStatus })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(PurchaseOrderStatus).map((s) => (
                      <SelectItem key={s} value={s}>
                        {purchaseOrderStatusLabels[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Project</Label>
                <Select
                  value={form.projectId ? String(form.projectId) : ''}
                  onValueChange={(v) =>
                    setForm({ ...form, projectId: Number(v) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.projectName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Expected Delivery</Label>
                <Input
                  type="date"
                  value={form.expectedDeliveryDate}
                  onChange={(e) =>
                    setForm({ ...form, expectedDeliveryDate: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Total Amount (₹)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.totalAmount}
                  onChange={(e) =>
                    setForm({ ...form, totalAmount: e.target.value })
                  }
                  placeholder="0.00"
                />
              </div>
            </div>
          ) : (
            <>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">PO Number</span>
                <span className="font-medium">{po.poNumber}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Status</span>
                <Badge className={purchaseOrderStatusBadgeColors[po.status]}>
                  {purchaseOrderStatusLabels[po.status]}
                </Badge>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Vendor</span>
                <span className="font-medium">{po.vendorName}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Created By</span>
                <span className="font-medium">{po.createdBy.name || '—'}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Created At</span>
                <span className="font-medium">
                  {format(new Date(po.createdAt), 'MMM dd, yyyy')}
                </span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Expected Delivery</span>
                <span className="font-medium">
                  {po.expectedDeliveryDate
                    ? format(new Date(po.expectedDeliveryDate), 'MMM dd, yyyy')
                    : '—'}
                </span>
              </div>
              {po.projectName && (
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Project</span>
                  <span className="font-medium">{po.projectName}</span>
                </div>
              )}
              {po.indentId && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Linked Indent</span>
                  <Link
                    href={routes.resources.indents.detail(po.indentId).href}
                    className="font-medium text-blue-600 hover:underline"
                  >
                    {po.indentNumber}
                  </Link>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
}
