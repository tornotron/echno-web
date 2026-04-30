'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { mockInvoices, mockProjects } from '@/components/shared/mock-data';
import {
  Invoice,
  InvoiceType,
  InvoiceStatus,
  InvoiceLineItem,
} from '@/types/finance/invoice';
import {
  ArrowLeft,
  Save,
  X,
  FileText,
  Plus,
  Trash2,
  Hash,
  Calendar,
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { toast } from '@/lib/styles/toast-styles';

interface EditInvoicePageProps {
  params: Promise<{ id: string }>;
}

export default function EditInvoicePage({ params }: EditInvoicePageProps) {
  const resolvedParams = use(params);
  const router = useRouter();

  const invoice = mockInvoices.find(
    (i) => i.id === Number.parseInt(resolvedParams.id)
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>(
    invoice?.lineItems || []
  );

  const [formData, setFormData] = useState<Partial<Invoice>>({
    invoiceNumber: invoice?.invoiceNumber || '',
    type: invoice?.type || InvoiceType.purchase,
    status: invoice?.status || InvoiceStatus.draft,
    projectId: invoice?.projectId || mockProjects[0]?.id || 1,
    issueDate: invoice?.issueDate || new Date().toISOString(),
    dueDate: invoice?.dueDate || new Date().toISOString(),
    subtotal: invoice?.subtotal || 0,
    taxAmount: invoice?.taxAmount || 0,
    discountAmount: invoice?.discountAmount || 0,
    totalAmount: invoice?.totalAmount || 0,
    paidAmount: invoice?.paidAmount || 0,
    balanceAmount: invoice?.balanceAmount || 0,
    paymentTerms: invoice?.paymentTerms || 'Net 30',
    paymentMethod: invoice?.paymentMethod || '',
    gstNumber: invoice?.gstNumber || '',
    taxType: invoice?.taxType || 'GST',
    notes: invoice?.notes || '',
  });

  if (!invoice) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center">
        <FileText className="text-muted-foreground mb-4 h-16 w-16" />
        <h2 className="mb-2 text-2xl font-semibold">Invoice Not Found</h2>
        <p className="text-muted-foreground mb-6">
          The invoice you&apos;re looking for doesn&apos;t exist.
        </p>
        <Button asChild>
          <Link href="/users/dashboard/finance/invoices">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Invoices
          </Link>
        </Button>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      toast.success('Invoice updated successfully');
      setIsSubmitting(false);
      router.push(`/dashboard/finance/invoices/${invoice.id}`);
    }, 1000);
  };

  const handleCancel = () => {
    router.push(`/dashboard/finance/invoices/${invoice.id}`);
  };

  const handleInputChange = (
    field: keyof Invoice,
    value: string | number | Date
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleLineItemChange = (
    index: number,
    field: keyof InvoiceLineItem,
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

    (item as InvoiceLineItem)[field] = value as never;
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
      lineItems: newItems,
    }));
  };

  const addLineItem = () => {
    const newItem: InvoiceLineItem = {
      id: Math.max(...lineItems.map((i) => i.id), 0) + 1,
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
        lineItems: newItems,
      }));
    }
  };

  const invoiceTypeLabels: Record<InvoiceType, string> = {
    [InvoiceType.purchase]: 'Purchase Invoice',
    [InvoiceType.sales]: 'Sales Invoice',
    [InvoiceType.expense]: 'Expense Invoice',
    [InvoiceType.service]: 'Service Invoice',
  };

  const invoiceStatusLabels: Record<InvoiceStatus, string> = {
    [InvoiceStatus.draft]: 'Draft',
    [InvoiceStatus.pending]: 'Pending',
    [InvoiceStatus.sent]: 'Sent',
    [InvoiceStatus.partiallyPaid]: 'Partially Paid',
    [InvoiceStatus.paid]: 'Paid',
    [InvoiceStatus.overdue]: 'Overdue',
    [InvoiceStatus.cancelled]: 'Cancelled',
    [InvoiceStatus.disputed]: 'Disputed',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Edit Invoice</h1>
          <p className="text-muted-foreground">
            Update invoice information and details
          </p>
        </div>
      </div>

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
                    value={formData.invoiceNumber}
                    disabled
                    className="bg-muted"
                  />
                </div>

                {/* Type */}
                <div className="space-y-2">
                  <Label htmlFor="type">
                    Type <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) =>
                      handleInputChange('type', value as InvoiceType)
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
                  <Label htmlFor="status">
                    Status <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      handleInputChange('status', value as InvoiceStatus)
                    }
                  >
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(invoiceStatusLabels).map(
                        ([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
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
                      {mockProjects.map((project) => (
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

                {/* Payment Method */}
                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">Payment Method</Label>
                  <Input
                    id="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={(e) =>
                      handleInputChange('paymentMethod', e.target.value)
                    }
                    placeholder="e.g., Bank Transfer"
                  />
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
                    Update products or services in this invoice
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
            <Button type="submit" disabled={isSubmitting}>
              <Save className="mr-2 h-4 w-4" />
              {isSubmitting ? 'Updating...' : 'Update Invoice'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
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
