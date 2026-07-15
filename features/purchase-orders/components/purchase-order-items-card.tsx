'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';
import { Input } from '@/components/shadcn/input';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/shadcn/table';
import { Package, Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import {
  useCreatePOItem,
  useUpdatePOItem,
  useDeletePOItem,
} from '@tornotron/echno-core/purchase-order-items/hooks';
import { useMaterials } from '@tornotron/echno-core/materials/hooks';
import { toast } from '@/lib/styles/toast-styles';
import { PurchaseOrderStatus } from '@tornotron/echno-core/purchase-orders/types';
import type {
  PurchaseOrder,
  PurchaseOrderItem,
} from '@tornotron/echno-core/purchase-orders/types';

interface ItemRow {
  materialId: number;
  orderedQuantity: number;
  unitPrice: number;
  remarks: string;
}

const emptyItemRow: ItemRow = {
  materialId: 0,
  orderedQuantity: 1,
  unitPrice: 0,
  remarks: '',
};

interface Confirm {
  open: boolean;
  title: string;
  description: string;
  variant: 'default' | 'destructive';
  onConfirm: () => void;
}

interface POItemsCardProps {
  po: PurchaseOrder;
}

export function POItemsCard({ po }: POItemsCardProps) {
  const isEditable = po.status === PurchaseOrderStatus.draft;

  const { data: materials = [] } = useMaterials();
  const { mutateAsync: createItem } = useCreatePOItem(po.id);
  const { mutateAsync: updateItem } = useUpdatePOItem(po.id);
  const { mutateAsync: deleteItem } = useDeletePOItem(po.id);

  const [confirm, setConfirm] = useState<Confirm>({
    open: false,
    title: '',
    description: '',
    variant: 'default',
    onConfirm: () => {},
  });

  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editItemRow, setEditItemRow] = useState<ItemRow>(emptyItemRow);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemRow, setNewItemRow] = useState<ItemRow>(emptyItemRow);

  function requestConfirm(
    title: string,
    description: string,
    onConfirm: () => void,
    variant: 'default' | 'destructive' = 'default'
  ) {
    setConfirm({ open: true, title, description, variant, onConfirm });
  }

  function startEditItem(item: PurchaseOrderItem) {
    setEditingItemId(item.id);
    setEditItemRow({
      materialId: item.materialId,
      orderedQuantity: item.orderedQuantity,
      unitPrice: item.unitPrice ?? 0,
      remarks: item.remarks ?? '',
    });
  }

  function handleSaveItem() {
    if (
      !editingItemId ||
      !editItemRow.materialId ||
      editItemRow.orderedQuantity <= 0
    )
      return;
    requestConfirm(
      'Update Item',
      'Are you sure you want to save changes to this item?',
      async () => {
        try {
          await updateItem({
            id: editingItemId,
            data: {
              purchaseOrderId: po.id,
              materialId: editItemRow.materialId,
              orderedQuantity: editItemRow.orderedQuantity,
              unitPrice: editItemRow.unitPrice || undefined,
              totalPrice: editItemRow.unitPrice
                ? editItemRow.orderedQuantity * editItemRow.unitPrice
                : undefined,
              remarks: editItemRow.remarks.trim() || undefined,
            },
          });
          setEditingItemId(null);
          toast.success('Item updated.');
        } catch (error) {
          toast.error(
            error instanceof Error ? error.message : 'Failed to update item.'
          );
        }
      }
    );
  }

  function handleAddItem() {
    if (!newItemRow.materialId || newItemRow.orderedQuantity <= 0) return;
    requestConfirm(
      'Add Item',
      'Are you sure you want to add this item to the purchase order?',
      async () => {
        try {
          await createItem({
            purchaseOrderId: po.id,
            materialId: newItemRow.materialId,
            orderedQuantity: newItemRow.orderedQuantity,
            unitPrice: newItemRow.unitPrice || undefined,
            totalPrice: newItemRow.unitPrice
              ? newItemRow.orderedQuantity * newItemRow.unitPrice
              : undefined,
            remarks: newItemRow.remarks.trim() || undefined,
          });
          setIsAddingItem(false);
          setNewItemRow(emptyItemRow);
          toast.success('Item added.');
        } catch (error) {
          toast.error(
            error instanceof Error ? error.message : 'Failed to add item.'
          );
        }
      }
    );
  }

  function handleDeleteItem(itemId: number) {
    requestConfirm(
      'Delete Item',
      'Are you sure you want to remove this item? This cannot be undone.',
      async () => {
        try {
          await deleteItem(itemId);
          toast.success('Item removed.');
        } catch (error) {
          toast.error(
            error instanceof Error ? error.message : 'Failed to remove item.'
          );
        }
      },
      'destructive'
    );
  }

  return (
    <>
      <AlertDialog
        open={confirm.open}
        onOpenChange={(open) => setConfirm((s) => ({ ...s, open }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirm.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirm.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirm((s) => ({ ...s, open: false }));
                confirm.onConfirm();
              }}
              className={
                confirm.variant === 'destructive'
                  ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                  : undefined
              }
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Ordered Items
              <span className="ml-1 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium dark:bg-zinc-800">
                {po.items.length}
              </span>
            </CardTitle>
            {isEditable && !isAddingItem && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setNewItemRow(emptyItemRow);
                  setIsAddingItem(true);
                }}
              >
                <Plus className="mr-1 h-4 w-4" />
                Add Item
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Material</TableHead>
                <TableHead>Ordered Qty</TableHead>
                <TableHead>Received Qty</TableHead>
                <TableHead>Unit Price</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Remarks</TableHead>
                {isEditable && <TableHead className="w-20 pr-6" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {po.items.map((item) =>
                editingItemId === item.id ? (
                  <TableRow key={item.id}>
                    <TableCell className="pl-6">
                      <Select
                        value={String(editItemRow.materialId)}
                        onValueChange={(v) =>
                          setEditItemRow({
                            ...editItemRow,
                            materialId: Number(v),
                          })
                        }
                      >
                        <SelectTrigger className="w-44">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {materials.map((m) => (
                            <SelectItem key={m.id} value={String(m.id)}>
                              {m.materialName} ({m.unit})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="1"
                        className="w-24"
                        value={editItemRow.orderedQuantity}
                        onChange={(e) =>
                          setEditItemRow({
                            ...editItemRow,
                            orderedQuantity:
                              Number.parseInt(e.target.value) || 0,
                          })
                        }
                      />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.receivedQuantity}
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        className="w-28"
                        value={editItemRow.unitPrice || ''}
                        onChange={(e) =>
                          setEditItemRow({
                            ...editItemRow,
                            unitPrice: Number.parseFloat(e.target.value) || 0,
                          })
                        }
                        placeholder="0.00"
                      />
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {editItemRow.unitPrice
                        ? `₹${(editItemRow.orderedQuantity * editItemRow.unitPrice).toLocaleString('en-IN')}`
                        : '—'}
                    </TableCell>
                    <TableCell>
                      <Input
                        className="w-32"
                        value={editItemRow.remarks}
                        onChange={(e) =>
                          setEditItemRow({
                            ...editItemRow,
                            remarks: e.target.value,
                          })
                        }
                        placeholder="Optional"
                      />
                    </TableCell>
                    <TableCell className="pr-6">
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                          onClick={handleSaveItem}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={() => setEditingItemId(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
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
                      {item.unitPrice == null
                        ? '—'
                        : `₹${item.unitPrice.toLocaleString('en-IN')}`}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.totalPrice != null && item.totalPrice > 0
                        ? `₹${item.totalPrice.toLocaleString('en-IN')}`
                        : '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {item.remarks || '—'}
                    </TableCell>
                    {isEditable && (
                      <TableCell className="pr-6">
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                            onClick={() => startEditItem(item)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-zinc-400 hover:text-red-500"
                            onClick={() => handleDeleteItem(item.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                )
              )}

              {isAddingItem && (
                <TableRow>
                  <TableCell className="pl-6">
                    <Select
                      value={
                        newItemRow.materialId
                          ? String(newItemRow.materialId)
                          : ''
                      }
                      onValueChange={(v) =>
                        setNewItemRow({ ...newItemRow, materialId: Number(v) })
                      }
                    >
                      <SelectTrigger className="w-44">
                        <SelectValue placeholder="Select material" />
                      </SelectTrigger>
                      <SelectContent>
                        {materials.map((m) => (
                          <SelectItem key={m.id} value={String(m.id)}>
                            {m.materialName} ({m.unit})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="1"
                      className="w-24"
                      value={newItemRow.orderedQuantity}
                      onChange={(e) =>
                        setNewItemRow({
                          ...newItemRow,
                          orderedQuantity: Number.parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </TableCell>
                  <TableCell />
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-28"
                      value={newItemRow.unitPrice || ''}
                      onChange={(e) =>
                        setNewItemRow({
                          ...newItemRow,
                          unitPrice: Number.parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder="0.00"
                    />
                  </TableCell>
                  <TableCell />
                  <TableCell>
                    <Input
                      className="w-32"
                      value={newItemRow.remarks}
                      onChange={(e) =>
                        setNewItemRow({
                          ...newItemRow,
                          remarks: e.target.value,
                        })
                      }
                      placeholder="Optional"
                    />
                  </TableCell>
                  <TableCell className="pr-6">
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                        onClick={handleAddItem}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={() => setIsAddingItem(false)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}

              {po.items.length === 0 && !isAddingItem && (
                <TableRow>
                  <TableCell
                    colSpan={isEditable ? 7 : 6}
                    className="py-8 text-center text-zinc-400"
                  >
                    No items yet.
                    {isEditable && ' Click "Add Item" to get started.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {po.totalAmount != null && po.totalAmount > 0 && (
            <div className="flex justify-end border-t px-6 py-4">
              <span className="text-sm font-semibold">
                Total: ₹
                {po.totalAmount.toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
