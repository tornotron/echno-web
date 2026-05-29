'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { routes } from '@/nav';
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
import { useProjects } from '@/hooks/project/use-projects';
import {
  Receipt,
  ReceiptType,
  ReceiptStatus,
  receiptTypeLabels,
  receiptStatusLabels,
} from '@/types/finance/receipt';
import { useReceiptById } from '@/hooks/receipts';
import {
  Save,
  X,
  Receipt as ReceiptIcon,
  User,
  DollarSign,
  CreditCard,
  Hash,
  FileText,
  Calendar,
  Loader2,
} from 'lucide-react';
import {
  Empty,
  EmptyErrorMedia,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from '@/components/shadcn/empty';
import { PageHeader } from '@/components/common';
import Link from 'next/link';
import { format } from 'date-fns';
import { toast } from '@/lib/styles/toast-styles';

interface EditReceiptPageProps {
  params: Promise<{ id: string }>;
}

export default function EditReceiptPage({ params }: EditReceiptPageProps) {
  const resolvedParams = use(params);
  const id = Number.parseInt(resolvedParams.id);
  const { data: receipt, isLoading, isError } = useReceiptById(id);

  if (isLoading)
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  if (isError)
    return (
      <Empty variant="default">
        <EmptyErrorMedia>
          <ReceiptIcon className="size-6" />
        </EmptyErrorMedia>
        <EmptyHeader>
          <EmptyTitle>Failed to load receipt</EmptyTitle>
          <EmptyDescription>
            An unexpected error occurred. Please try again.
          </EmptyDescription>
        </EmptyHeader>
        <Button asChild>
          <Link href={routes.finance.receipts.href}>Back to Receipts</Link>
        </Button>
      </Empty>
    );
  if (!receipt)
    return (
      <Empty variant="default">
        <EmptyErrorMedia>
          <ReceiptIcon className="size-6" />
        </EmptyErrorMedia>
        <EmptyHeader>
          <EmptyTitle>Receipt not found</EmptyTitle>
          <EmptyDescription>
            This record may have been deleted or does not exist.
          </EmptyDescription>
        </EmptyHeader>
        <Button asChild>
          <Link href={routes.finance.receipts.href}>Back to Receipts</Link>
        </Button>
      </Empty>
    );

  return <ReceiptEditForm initialData={receipt} receiptId={id} />;
}

interface ReceiptEditFormProps {
  initialData: Receipt;
  receiptId: number;
}

function ReceiptEditForm({ initialData, receiptId }: ReceiptEditFormProps) {
  const router = useRouter();
  const { data: projects = [] } = useProjects();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<Receipt>>(() => ({
    receiptNumber: initialData.receiptNumber,
    type: initialData.type,
    status: initialData.status,
    projectId: initialData.projectId,
    receivedFrom: initialData.receivedFrom,
    receivedFromAddress: initialData.receivedFromAddress ?? '',
    amount: initialData.amount,
    currency: initialData.currency,
    receiptDate: initialData.receiptDate,
    paymentMethod: initialData.paymentMethod,
    transactionId: initialData.transactionId ?? '',
    referenceNumber: initialData.referenceNumber ?? '',
    description: initialData.description ?? '',
    notes: initialData.notes ?? '',
  }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      toast.success('Receipt updated successfully');
      setIsSubmitting(false);
      router.push(routes.finance.receipts.detail(receiptId).href);
    }, 1000);
  };

  const handleCancel = () => {
    router.push(routes.finance.receipts.detail(receiptId).href);
  };

  const handleInputChange = (
    field: keyof Receipt,
    value: string | number | Date
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Receipt"
        description="Update receipt information and payment details"
      />

      <div className="max-w-5xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Receipt Information Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="mb-6">
                <div className="relative">
                  <ReceiptIcon className="text-muted-foreground absolute top-3 left-3 h-5 w-5" />
                  <CardTitle className="pl-10">Receipt Information</CardTitle>
                </div>
                <CardDescription className="pl-10">
                  Basic details about the receipt
                </CardDescription>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Receipt Number */}
                <div className="space-y-2">
                  <Label htmlFor="receiptNumber">
                    Receipt Number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="receiptNumber"
                    value={formData.receiptNumber}
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
                      handleInputChange('type', value as ReceiptType)
                    }
                  >
                    <SelectTrigger id="type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(receiptTypeLabels).map(
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
                      handleInputChange('status', value as ReceiptStatus)
                    }
                  >
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(receiptStatusLabels).map(
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

                {/* Receipt Date */}
                <div className="space-y-2">
                  <Label htmlFor="receiptDate">
                    Receipt Date <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Calendar className="text-muted-foreground pointer-events-none absolute top-3 left-3 h-4 w-4" />
                    <Input
                      id="receiptDate"
                      type="date"
                      value={format(
                        new Date(formData.receiptDate || ''),
                        'yyyy-MM-dd'
                      )}
                      onChange={(e) =>
                        handleInputChange('receiptDate', e.target.value)
                      }
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Received From */}
                <div className="space-y-2">
                  <Label htmlFor="receivedFrom">
                    Received From <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <User className="text-muted-foreground pointer-events-none absolute top-3 left-3 h-4 w-4" />
                    <Input
                      id="receivedFrom"
                      value={formData.receivedFrom}
                      onChange={(e) =>
                        handleInputChange('receivedFrom', e.target.value)
                      }
                      placeholder="Enter name or company"
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Reference Number */}
                <div className="space-y-2">
                  <Label htmlFor="referenceNumber">Reference Number</Label>
                  <div className="relative">
                    <Hash className="text-muted-foreground pointer-events-none absolute top-3 left-3 h-4 w-4" />
                    <Input
                      id="referenceNumber"
                      value={formData.referenceNumber}
                      onChange={(e) =>
                        handleInputChange('referenceNumber', e.target.value)
                      }
                      placeholder="Enter reference number"
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Received From Address - Full Width */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="receivedFromAddress">Address</Label>
                  <Textarea
                    id="receivedFromAddress"
                    value={formData.receivedFromAddress}
                    onChange={(e) =>
                      handleInputChange('receivedFromAddress', e.target.value)
                    }
                    placeholder="Enter address"
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Details Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="mb-6">
                <div className="relative">
                  <CreditCard className="text-muted-foreground absolute top-3 left-3 h-5 w-5" />
                  <CardTitle className="pl-10">Payment Details</CardTitle>
                </div>
                <CardDescription className="pl-10">
                  Amount and payment information
                </CardDescription>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Amount */}
                <div className="space-y-2">
                  <Label htmlFor="amount">
                    Amount <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <DollarSign className="text-muted-foreground pointer-events-none absolute top-3 left-3 h-4 w-4" />
                    <Input
                      id="amount"
                      type="number"
                      value={formData.amount}
                      onChange={(e) =>
                        handleInputChange(
                          'amount',
                          Number.parseFloat(e.target.value) || 0
                        )
                      }
                      placeholder="0.00"
                      step="0.01"
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Currency */}
                <div className="space-y-2">
                  <Label htmlFor="currency">
                    Currency <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(value) =>
                      handleInputChange('currency', value)
                    }
                  >
                    <SelectTrigger id="currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INR">INR - Indian Rupee</SelectItem>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="GBP">GBP - British Pound</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Payment Method */}
                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">
                    Payment Method <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.paymentMethod}
                    onValueChange={(value) =>
                      handleInputChange('paymentMethod', value)
                    }
                  >
                    <SelectTrigger id="paymentMethod">
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Bank Transfer">
                        Bank Transfer
                      </SelectItem>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="Cheque">Cheque</SelectItem>
                      <SelectItem value="Credit Card">Credit Card</SelectItem>
                      <SelectItem value="Debit Card">Debit Card</SelectItem>
                      <SelectItem value="UPI">UPI</SelectItem>
                      <SelectItem value="Online Payment">
                        Online Payment
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Transaction ID */}
                <div className="space-y-2">
                  <Label htmlFor="transactionId">Transaction ID</Label>
                  <div className="relative">
                    <Hash className="text-muted-foreground pointer-events-none absolute top-3 left-3 h-4 w-4" />
                    <Input
                      id="transactionId"
                      value={formData.transactionId}
                      onChange={(e) =>
                        handleInputChange('transactionId', e.target.value)
                      }
                      placeholder="Enter transaction ID"
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Description - Full Width */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <div className="relative">
                    <FileText className="text-muted-foreground pointer-events-none absolute top-3 left-3 h-4 w-4" />
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) =>
                        handleInputChange('description', e.target.value)
                      }
                      placeholder="Enter payment description"
                      rows={3}
                      className="pt-3 pl-10"
                    />
                  </div>
                </div>

                {/* Notes - Full Width */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Add any additional notes"
                    rows={4}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              <Save className="mr-2 h-4 w-4" />
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
