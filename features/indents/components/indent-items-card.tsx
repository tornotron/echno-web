'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Package, Plus, Pencil, Trash2, Check, X, Loader2 } from 'lucide-react';
import {
  useCreateIndentItem,
  useUpdateIndentItem,
  useDeleteIndentItem,
} from '@/hooks/indent-items';
import { useMaterials } from '@/hooks/materials';
import type { IndentItem } from '@/types/indents';

interface ItemRow {
  materialId: number;
  requestedQuantity: number;
  additionalSpecifications: string;
  remarks: string;
}

const emptyItemRow: ItemRow = {
  materialId: 0,
  requestedQuantity: 1,
  additionalSpecifications: '',
  remarks: '',
};

interface ConfirmState {
  open: boolean;
  title: string;
  description: string;
  variant: 'default' | 'destructive';
  onConfirm: () => void;
}

const closedConfirm: ConfirmState = {
  open: false,
  title: '',
  description: '',
  variant: 'default',
  onConfirm: () => {},
};

interface IndentItemsCardProps {
  indentId: number;
  items: IndentItem[];
}

export function IndentItemsCard({ indentId, items }: IndentItemsCardProps) {
  const { data: materials = [] } = useMaterials();
  const { mutateAsync: createItem, isPending: isCreating } =
    useCreateIndentItem(indentId);
  const { mutateAsync: updateItem, isPending: isUpdating } =
    useUpdateIndentItem(indentId);
  const { mutateAsync: deleteItem, isPending: isDeleting } =
    useDeleteIndentItem(indentId);

  const [confirm, setConfirm] = useState<ConfirmState>(closedConfirm);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editItemRow, setEditItemRow] = useState<ItemRow>(emptyItemRow);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemRow, setNewItemRow] = useState<ItemRow>(emptyItemRow);

  const isBusy = isCreating || isUpdating || isDeleting;

  function requestConfirm(
    title: string,
    description: string,
    onConfirm: () => void,
    variant: 'default' | 'destructive' = 'default'
  ) {
    setConfirm({ open: true, title, description, variant, onConfirm });
  }

  function startEditItem(item: IndentItem) {
    setEditingItemId(item.id);
    setEditItemRow({
      materialId: item.material.id,
      requestedQuantity: item.requestedQuantity,
      additionalSpecifications: item.additionalSpecifications ?? '',
      remarks: item.remarks ?? '',
    });
  }

  function handleSaveItem() {
    if (
      !editingItemId ||
      !editItemRow.materialId ||
      editItemRow.requestedQuantity <= 0
    )
      return;
    requestConfirm('Update Item', 'Save changes to this item?', async () => {
      try {
        await updateItem({
          id: editingItemId,
          indentItem: {
            indentId,
            materialId: editItemRow.materialId,
            requestedQuantity: editItemRow.requestedQuantity,
            additionalSpecifications:
              editItemRow.additionalSpecifications.trim() || undefined,
            remarks: editItemRow.remarks.trim() || undefined,
          },
        });
        setEditingItemId(null);
      } catch {
        // handled by mutation hook
      }
    });
  }

  function handleAddItem() {
    if (!newItemRow.materialId || newItemRow.requestedQuantity <= 0) return;
    requestConfirm('Add Item', 'Add this item to the indent?', async () => {
      try {
        await createItem({
          indentId,
          materialId: newItemRow.materialId,
          requestedQuantity: newItemRow.requestedQuantity,
          additionalSpecifications:
            newItemRow.additionalSpecifications.trim() || undefined,
          remarks: newItemRow.remarks.trim() || undefined,
        });
        setIsAddingItem(false);
        setNewItemRow(emptyItemRow);
      } catch {
        // handled by mutation hook
      }
    });
  }

  function handleDeleteItem(itemId: number) {
    requestConfirm(
      'Delete Item',
      'Remove this item? This cannot be undone.',
      async () => {
        try {
          await deleteItem(itemId);
        } catch {
          // handled by mutation hook
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
            <AlertDialogCancel disabled={isBusy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirm((s) => ({ ...s, open: false }));
                confirm.onConfirm();
              }}
              disabled={isBusy}
              className={
                confirm.variant === 'destructive'
                  ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                  : undefined
              }
            >
              {isBusy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
              Requested Items
              <span className="ml-1 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium dark:bg-zinc-800">
                {items.length}
              </span>
            </CardTitle>
            {!isAddingItem && (
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
                <TableHead>Requested Qty</TableHead>
                <TableHead>Specifications</TableHead>
                <TableHead>Remarks</TableHead>
                <TableHead>PO Status</TableHead>
                <TableHead className="w-20 pr-6" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) =>
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
                        value={editItemRow.requestedQuantity}
                        onChange={(e) =>
                          setEditItemRow({
                            ...editItemRow,
                            requestedQuantity:
                              Number.parseInt(e.target.value) || 0,
                          })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        className="w-36"
                        value={editItemRow.additionalSpecifications}
                        onChange={(e) =>
                          setEditItemRow({
                            ...editItemRow,
                            additionalSpecifications: e.target.value,
                          })
                        }
                        placeholder="e.g. Grade A"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        className="w-36"
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
                    <TableCell />
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
                    <TableCell className="pl-6">
                      <p className="font-medium">
                        {item.material.materialName}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {item.material.unit}
                      </p>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.requestedQuantity} {item.material.unit}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {item.additionalSpecifications || '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {item.remarks || '—'}
                    </TableCell>
                    <TableCell>
                      {item.convertedToPurchaseOrder ? (
                        <div>
                          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                            Converted to PO
                          </Badge>
                          {item.linkedPurchaseOrderNumber && (
                            <p className="text-muted-foreground mt-1 text-xs">
                              {item.linkedPurchaseOrderNumber}
                            </p>
                          )}
                        </div>
                      ) : (
                        <Badge className="bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                          Pending
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="pr-6">
                      {!item.convertedToPurchaseOrder && (
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
                      )}
                    </TableCell>
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
                      value={newItemRow.requestedQuantity}
                      onChange={(e) =>
                        setNewItemRow({
                          ...newItemRow,
                          requestedQuantity:
                            Number.parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      className="w-36"
                      value={newItemRow.additionalSpecifications}
                      onChange={(e) =>
                        setNewItemRow({
                          ...newItemRow,
                          additionalSpecifications: e.target.value,
                        })
                      }
                      placeholder="e.g. Grade A"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      className="w-36"
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
                  <TableCell />
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

              {items.length === 0 && !isAddingItem && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-8 text-center text-zinc-400"
                  >
                    No items yet. Click &quot;Add Item&quot; to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
