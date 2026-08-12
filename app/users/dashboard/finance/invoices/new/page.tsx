'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { routes } from '@/nav';
import { useProjects } from '@tornotron/echno-core/project/hooks';
import { getErrorTitle, getErrorMessage } from '@tornotron/echno-core';
import { useCreateInvoice } from '@/hooks/invoices';
import { Button } from '@/components/shadcn/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from '@/components/shadcn/card';
import { Input } from '@/components/shadcn/input';
import { Label } from '@/components/shadcn/label';
import { Textarea } from '@/components/shadcn/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/shadcn/table';
import {
  ConstructionInvoiceType,
  ConstructionInvoiceStatus,
  InvoiceLineDraft,
  InvoiceFormData,
  invoiceTypeLabels,
  invoiceStatusLabels,
} from '@/types/finance/invoice';
import { Save, X, Plus, Trash2, Hash, Calendar } from 'lucide-react';
import { PageHeader } from '@/components/common';
import { format } from 'date-fns';
import { toast } from '@/lib/styles/toast-styles';

export default function NewInvoicePage() {
  const router = useRouter();
  const { data: projects = [] } = useProjects();
  const { mutate: createInvoice, isPending } = useCreateInvoice();

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [lineItems, setLineItems] = useState<InvoiceLineDraft[]>([
    {
      id: crypto.randomUUID(),
      description: '',
      quantity: 1,
      unit: 'LS',
      unitPrice: 0,
      taxRate: 18,
      taxAmount: 0,
      subtotal: 0,
      total: 0,
    },
  ]);

  const getDueDateDefault = () => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString();
  };

  const [formData, setFormData] = useState<InvoiceFormData>({
    invoiceNumber: '',
    type: ConstructionInvoiceType.PURCHASE,
    status: ConstructionInvoiceStatus.DRAFT,
    projectId: projects[0]?.id || 1, // Default to first project
    issueDate: new Date().toISOString(),
    dueDate: getDueDateDefault(),
    subtotal: 0,
    taxAmount: 0,
    discountAmount: 0,
    totalAmount: 0,
    paidAmount: 0,
    balanceAmount: 0,
    paymentTerms: 'Net 30',
    paymentMethod: '',
    gstNumber: '',
    taxType: 'GST',
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!formData.projectId) newErrors.projectId = 'Project is required';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('Please fix the errors in the form');
      return;
    }

    // The backend assigns the invoice number and forces the initial status, so
    // neither is sent; money totals are recomputed server-side from the lines.
    createInvoice(
      {
        type: formData.type,
        projectId: formData.projectId,
        issueDate: format(new Date(formData.issueDate), 'yyyy-MM-dd'),
        dueDate: format(new Date(formData.dueDate), 'yyyy-MM-dd'),
        paymentTerms: formData.paymentTerms.trim() || undefined,
        paymentMethod: formData.paymentMethod.trim() || undefined,
        gstNumber: formData.gstNumber.trim() || undefined,
        taxType: formData.taxType.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        lines: lineItems.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: item.unitPrice,
          taxRate: item.taxRate,
        })),
      },
      {
        onSuccess: (invoice) => {
          toast.success('Invoice created successfully');
          router.push(routes.finance.invoices.detail(invoice.id).href);
        },
        onError: (err) => {
          toast.error(getErrorTitle(err, 'Failed to create invoice'), {
            description: getErrorMessage(err),
          });
        },
      }
    );
  };

  const handleCancel = () => {
    router.push(routes.finance.invoices.href);
  };

  const handleInputChange = (
    field: keyof InvoiceFormData,
    value: string | number
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleLineItemChange = (
    index: number,
    field: keyof InvoiceLineDraft,
    value: string | number
  ) => {
    const newItems = [...lineItems];
    const item = newItems[index];

    if (field === 'quantity' || field === 'unitPrice' || field === 'taxRate') {
      const qty = field === 'quantity' ? Number(value) : item.quantity;
      const price = field === 'unitPrice' ? Number(value) : item.unitPrice;
      const tax = field === 'taxRate' ? Number(value) : item.taxRate;

      item.subtotal = qty * price;
      item.taxAmount = (item.subtotal * tax) / 100;
      item.total = item.subtotal + item.taxAmount;
    }

    (item as InvoiceLineDraft)[field] = value as never;
    newItems[index] = item;
    setLineItems(newItems);

    // Recalculate totals
    const subtotal = newItems.reduce((sum, item) => sum + item.subtotal, 0);
    const taxAmount = newItems.reduce((sum, item) => sum + item.taxAmount, 0);
    const totalAmount = subtotal + taxAmount - (formData.discountAmount || 0);

    setFormData((prev) => ({
      ...prev,
      subtotal,
      taxAmount,
      totalAmount,
      balanceAmount: totalAmount - (prev.paidAmount || 0),
    }));
  };

  const addLineItem = () => {
    const newItem: InvoiceLineDraft = {
      id: crypto.randomUUID(),
      description: '',
      quantity: 1,
      unit: 'LS',
      unitPrice: 0,
      taxRate: 18,
      taxAmount: 0,
      subtotal: 0,
      total: 0,
    };
    setLineItems([...lineItems, newItem]);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length > 1) {
      const newItems = lineItems.filter((_, i) => i !== index);
      setLineItems(newItems);

      // Recalculate totals
      const subtotal = newItems.reduce((sum, item) => sum + item.subtotal, 0);
      const taxAmount = newItems.reduce((sum, item) => sum + item.taxAmount, 0);
      const totalAmount = subtotal + taxAmount - (formData.discountAmount || 0);

      setFormData((prev) => ({
        ...prev,
        subtotal,
        taxAmount,
        totalAmount,
        balanceAmount: totalAmount - (prev.paidAmount || 0),
      }));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="New Invoice" description="Create a new invoice" />

      <div className="max-w-5xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Invoice Information Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="mb-6">
                <CardTitle>Invoice Information</CardTitle>
                <CardDescription>
                  Basic details about the invoice
                </CardDescription>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Invoice Number */}
                <div className="space-y-2">
                  <Label htmlFor="invoiceNumber">Invoice Number</Label>
                  <Input
                    id="invoiceNumber"
                    value="Assigned on save"
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-muted-foreground text-xs">
                    Generated automatically when the invoice is created.
                  </p>
                </div>

                {/* Type */}
                <div className="space-y-2">
                  <Label htmlFor="type">
                    Type <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) =>
                      handleInputChange(
                        'type',
                        value as ConstructionInvoiceType
                      )
                    }
                  >
                    <SelectTrigger id="type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(invoiceTypeLabels).map(
                        ([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Input
                    id="status"
                    value={invoiceStatusLabels[formData.status]}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-muted-foreground text-xs">
                    Set automatically when the invoice is created.
                  </p>
                </div>

                {/* Project */}
                <div className="space-y-2">
                  <Label htmlFor="projectId">
                    Project <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.projectId?.toString()}
                    onValueChange={(value) =>
                      handleInputChange('projectId', Number(value))
                    }
                  >
                    <SelectTrigger id="projectId">
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem
                          key={project.id}
                          value={project.id.toString()}
                        >
                          {project.projectName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Issue Date */}
                <div className="space-y-2">
                  <Label htmlFor="issueDate">
                    Issue Date <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Calendar className="text-muted-foreground pointer-events-none absolute top-3 left-3 h-4 w-4" />
                    <Input
                      id="issueDate"
                      type="date"
                      value={format(
                        new Date(formData.issueDate || ''),
                        'yyyy-MM-dd'
                      )}
                      onChange={(e) =>
                        handleInputChange('issueDate', e.target.value)
                      }
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                {/* Due Date */}
                <div className="space-y-2">
                  <Label htmlFor="dueDate">
                    Due Date <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Calendar className="text-muted-foreground pointer-events-none absolute top-3 left-3 h-4 w-4" />
                    <Input
                      id="dueDate"
                      type="date"
                      value={format(
                        new Date(formData.dueDate || ''),
                        'yyyy-MM-dd'
                      )}
                      onChange={(e) =>
                        handleInputChange('dueDate', e.target.value)
                      }
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                {/* Payment Terms */}
                <div className="space-y-2">
                  <Label htmlFor="paymentTerms">Payment Terms</Label>
                  <Input
                    id="paymentTerms"
                    value={formData.paymentTerms}
                    onChange={(e) =>
                      handleInputChange('paymentTerms', e.target.value)
                    }
                    placeholder="e.g., Net 30"
                  />
                </div>

                {/* GST Number */}
                <div className="space-y-2">
                  <Label htmlFor="gstNumber">GST/Tax Number</Label>
                  <div className="relative">
                    <Hash className="text-muted-foreground pointer-events-none absolute top-3 left-3 h-4 w-4" />
                    <Input
                      id="gstNumber"
                      value={formData.gstNumber}
                      onChange={(e) =>
                        handleInputChange('gstNumber', e.target.value)
                      }
                      placeholder="Enter GST number"
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Line Items Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <CardTitle>Line Items</CardTitle>
                  <CardDescription>
                    Add products or services to this invoice
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  onClick={addLineItem}
                  variant="outline"
                  size="sm"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Item
                </Button>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead className="min-w-[250px]">
                        Description *
                      </TableHead>
                      <TableHead className="min-w-[100px]">
                        Quantity *
                      </TableHead>
                      <TableHead className="min-w-[100px]">Unit</TableHead>
                      <TableHead className="min-w-[120px]">
                        Unit Price (₹) *
                      </TableHead>
                      <TableHead className="min-w-[100px]">
                        Tax Rate (%)
                      </TableHead>
                      <TableHead className="min-w-[120px]">
                        Subtotal (₹)
                      </TableHead>
                      <TableHead className="min-w-[120px]">
                        Tax Amount (₹)
                      </TableHead>
                      <TableHead className="min-w-[120px]">Total (₹)</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lineItems.map((item, index) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {index + 1}
                        </TableCell>
                        <TableCell>
                          <Textarea
                            value={item.description}
                            onChange={(e) =>
                              handleLineItemChange(
                                index,
                                'description',
                                e.target.value
                              )
                            }
                            placeholder="Enter item description"
                            rows={2}
                            required
                            className="min-h-[60px] text-xs"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) =>
                              handleLineItemChange(
                                index,
                                'quantity',
                                Number.parseFloat(e.target.value) || 0
                              )
                            }
                            placeholder="1"
                            min="0"
                            step="0.01"
                            required
                            className="h-9"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={item.unit}
                            onChange={(e) =>
                              handleLineItemChange(
                                index,
                                'unit',
                                e.target.value
                              )
                            }
                            placeholder="LS"
                            className="h-9"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) =>
                              handleLineItemChange(
                                index,
                                'unitPrice',
                                Number.parseFloat(e.target.value) || 0
                              )
                            }
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                            required
                            className="h-9"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={item.taxRate}
                            onChange={(e) =>
                              handleLineItemChange(
                                index,
                                'taxRate',
                                Number.parseFloat(e.target.value) || 0
                              )
                            }
                            placeholder="18"
                            min="0"
                            step="0.01"
                            className="h-9"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={item.subtotal.toFixed(2)}
                            disabled
                            className="h-9"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={item.taxAmount.toFixed(2)}
                            disabled
                            className="h-9"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold whitespace-nowrap text-zinc-900 dark:text-zinc-100">
                            ₹{item.total.toFixed(2)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {lineItems.length > 1 && (
                            <Button
                              type="button"
                              onClick={() => removeLineItem(index)}
                              variant="ghost"
                              size="sm"
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Summary */}
              <div className="mt-6 space-y-3 rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800/50">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span className="font-medium">
                    ₹{(formData.subtotal || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax:</span>
                  <span className="font-medium">
                    ₹{(formData.taxAmount || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="border-t border-zinc-200 pt-3 dark:border-zinc-700">
                  <div className="flex justify-between font-semibold">
                    <span>Total:</span>
                    <span className="text-lg text-blue-600 dark:text-blue-400">
                      ₹{(formData.totalAmount || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Information Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="mb-6">
                <CardTitle>Additional Information</CardTitle>
                <CardDescription>Notes and terms</CardDescription>
              </div>

              <div className="space-y-4">
                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Add any notes or special instructions"
                    rows={4}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex gap-4">
            <Button type="submit" disabled={isPending}>
              <Save className="mr-2 h-4 w-4" />
              {isPending ? 'Creating...' : 'Create Invoice'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isPending}
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
