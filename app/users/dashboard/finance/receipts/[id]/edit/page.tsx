'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/common';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { mockReceipts } from '@/components/shared/mock-data';
import { Receipt, ReceiptType, ReceiptStatus } from '@/types/finance/receipt';
import {
  ArrowLeft,
  Save,
  X,
  Receipt as ReceiptIcon,
  User,
  DollarSign,
  CreditCard,
  Hash,
  FileText,
  Calendar,
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface EditReceiptPageProps {
  params: Promise<{ id: string }>;
}

export default function EditReceiptPage({ params }: EditReceiptPageProps) {
  const resolvedParams = use(params);
  const router = useRouter();

  const receipt = mockReceipts.find(
    (r) => r.id === Number.parseInt(resolvedParams.id)
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<Receipt>>({
    receiptNumber: receipt?.receiptNumber || '',
    type: receipt?.type || ReceiptType.payment,
    status: receipt?.status || ReceiptStatus.draft,
    receivedFrom: receipt?.receivedFrom || '',
    receivedFromAddress: receipt?.receivedFromAddress || '',
    amount: receipt?.amount || 0,
    currency: receipt?.currency || 'INR',
    receiptDate: receipt?.receiptDate || new Date(),
    paymentMethod: receipt?.paymentMethod || '',
    transactionId: receipt?.transactionId || '',
    referenceNumber: receipt?.referenceNumber || '',
    description: receipt?.description || '',
    notes: receipt?.notes || '',
  });

  if (!receipt) {
    return (
      <AppLayout>
        <div className="flex h-[60vh] flex-col items-center justify-center">
          <ReceiptIcon className="text-muted-foreground mb-4 h-16 w-16" />
          <h2 className="mb-2 text-2xl font-semibold">Receipt Not Found</h2>
          <p className="text-muted-foreground mb-6">
            The receipt you&apos;re looking for doesn&apos;t exist.
          </p>
          <Button asChild>
            <Link href="/users/dashboard/finance/receipts">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Receipts
            </Link>
          </Button>
        </div>
      </AppLayout>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      toast.success('Receipt updated successfully');
      setIsSubmitting(false);
      router.push(`/dashboard/finance/receipts/${receipt.id}`);
    }, 1000);
  };

  const handleCancel = () => {
    router.push(`/dashboard/finance/receipts/${receipt.id}`);
  };

  const handleInputChange = (
    field: keyof Receipt,
    value: string | number | Date
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const receiptTypeLabels: Record<ReceiptType, string> = {
    [ReceiptType.payment]: 'Payment',
    [ReceiptType.advance]: 'Advance',
    [ReceiptType.deposit]: 'Deposit',
    [ReceiptType.refund]: 'Refund',
    [ReceiptType.other]: 'Other',
  };

  const receiptStatusLabels: Record<ReceiptStatus, string> = {
    [ReceiptStatus.issued]: 'Issued',
    [ReceiptStatus.draft]: 'Draft',
    [ReceiptStatus.cancelled]: 'Cancelled',
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href={`/users/dashboard/finance/receipts/${receipt.id}`}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Edit Receipt</h1>
              <p className="text-muted-foreground">
                Update receipt information and payment details
              </p>
            </div>
          </div>
        </div>

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
                      onChange={(e) =>
                        handleInputChange('notes', e.target.value)
                      }
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
    </AppLayout>
  );
}
