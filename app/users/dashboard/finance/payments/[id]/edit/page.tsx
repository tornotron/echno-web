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
import { mockPayments } from '@/components/shared/mock-data';
import {
  Payment,
  PaymentType,
  PaymentStatus,
  PaymentMethod,
} from '@/types/finance/payment';
import {
  ArrowLeft,
  Save,
  X,
  CreditCard,
  DollarSign,
  Hash,
  FileText,
  Calendar,
  Building,
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface EditPaymentPageProps {
  params: Promise<{ id: string }>;
}

export default function EditPaymentPage({ params }: EditPaymentPageProps) {
  const resolvedParams = use(params);
  const router = useRouter();

  const payment = mockPayments.find(
    (p) => p.id === Number.parseInt(resolvedParams.id)
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<Payment>>({
    paymentNumber: payment?.paymentNumber || '',
    type: payment?.type || PaymentType.invoice,
    status: payment?.status || PaymentStatus.pending,
    method: payment?.method || PaymentMethod.bankTransfer,
    amount: payment?.amount || 0,
    currency: payment?.currency || 'INR',
    paymentDate: payment?.paymentDate || new Date(),
    transactionId: payment?.transactionId || '',
    referenceNumber: payment?.referenceNumber || '',
    bankName: payment?.bankName || '',
    accountNumber: payment?.accountNumber || '',
    ifscCode: payment?.ifscCode || '',
    description: payment?.description || '',
    notes: payment?.notes || '',
  });

  if (!payment) {
    return (
      <AppLayout>
        <div className="flex h-[60vh] flex-col items-center justify-center">
          <CreditCard className="text-muted-foreground mb-4 h-16 w-16" />
          <h2 className="mb-2 text-2xl font-semibold">Payment Not Found</h2>
          <p className="text-muted-foreground mb-6">
            The payment you&apos;re looking for doesn&apos;t exist.
          </p>
          <Button asChild>
            <Link href="/users/dashboard/finance/payments">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Payments
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
      toast.success('Payment updated successfully');
      setIsSubmitting(false);
      router.push(`/dashboard/finance/payments/${payment.id}`);
    }, 1000);
  };

  const handleCancel = () => {
    router.push(`/dashboard/finance/payments/${payment.id}`);
  };

  const handleInputChange = (
    field: keyof Payment,
    value: string | number | Date
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const paymentTypeLabels: Record<PaymentType, string> = {
    [PaymentType.invoice]: 'Invoice Payment',
    [PaymentType.salary]: 'Salary Payment',
    [PaymentType.advance]: 'Advance Payment',
    [PaymentType.expense]: 'Expense Payment',
    [PaymentType.refund]: 'Refund',
    [PaymentType.other]: 'Other',
  };

  const paymentStatusLabels: Record<PaymentStatus, string> = {
    [PaymentStatus.pending]: 'Pending',
    [PaymentStatus.processing]: 'Processing',
    [PaymentStatus.completed]: 'Completed',
    [PaymentStatus.failed]: 'Failed',
    [PaymentStatus.cancelled]: 'Cancelled',
    [PaymentStatus.refunded]: 'Refunded',
  };

  const paymentMethodLabels: Record<PaymentMethod, string> = {
    [PaymentMethod.cash]: 'Cash',
    [PaymentMethod.cheque]: 'Cheque',
    [PaymentMethod.bankTransfer]: 'Bank Transfer',
    [PaymentMethod.upi]: 'UPI',
    [PaymentMethod.card]: 'Card',
    [PaymentMethod.neft]: 'NEFT',
    [PaymentMethod.rtgs]: 'RTGS',
    [PaymentMethod.imps]: 'IMPS',
    [PaymentMethod.other]: 'Other',
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Edit Payment</h1>
            <p className="text-muted-foreground">
              Update payment information and transaction details
            </p>
          </div>
        </div>

        <div className="max-w-5xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Payment Information Card */}
            <Card>
              <CardContent className="pt-6">
                <div className="mb-6">
                  <CardTitle>Payment Information</CardTitle>
                  <CardDescription>
                    Basic details about the payment
                  </CardDescription>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {/* Payment Number */}
                  <div className="space-y-2">
                    <Label htmlFor="paymentNumber">
                      Payment Number <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="paymentNumber"
                      value={formData.paymentNumber}
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
                        handleInputChange('type', value as PaymentType)
                      }
                    >
                      <SelectTrigger id="type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(paymentTypeLabels).map(
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
                        handleInputChange('status', value as PaymentStatus)
                      }
                    >
                      <SelectTrigger id="status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(paymentStatusLabels).map(
                          ([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Payment Date */}
                  <div className="space-y-2">
                    <Label htmlFor="paymentDate">
                      Payment Date <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <Calendar className="text-muted-foreground pointer-events-none absolute top-3 left-3 h-4 w-4" />
                      <Input
                        id="paymentDate"
                        type="date"
                        value={format(
                          new Date(formData.paymentDate || ''),
                          'yyyy-MM-dd'
                        )}
                        onChange={(e) =>
                          handleInputChange('paymentDate', e.target.value)
                        }
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div className="space-y-2">
                    <Label htmlFor="method">
                      Payment Method <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={formData.method}
                      onValueChange={(value) =>
                        handleInputChange('method', value as PaymentMethod)
                      }
                    >
                      <SelectTrigger id="method">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(paymentMethodLabels).map(
                          ([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
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
                </div>
              </CardContent>
            </Card>

            {/* Amount Details Card */}
            <Card>
              <CardContent className="pt-6">
                <div className="mb-6">
                  <CardTitle>Amount Details</CardTitle>
                  <CardDescription>Payment amount information</CardDescription>
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
                </div>
              </CardContent>
            </Card>

            {/* Bank Details Card */}
            <Card>
              <CardContent className="pt-6">
                <div className="mb-6">
                  <CardTitle>Bank Details</CardTitle>
                  <CardDescription>
                    Banking information (if applicable)
                  </CardDescription>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {/* Bank Name */}
                  <div className="space-y-2">
                    <Label htmlFor="bankName">Bank Name</Label>
                    <div className="relative">
                      <Building className="text-muted-foreground pointer-events-none absolute top-3 left-3 h-4 w-4" />
                      <Input
                        id="bankName"
                        value={formData.bankName}
                        onChange={(e) =>
                          handleInputChange('bankName', e.target.value)
                        }
                        placeholder="Enter bank name"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Account Number */}
                  <div className="space-y-2">
                    <Label htmlFor="accountNumber">Account Number</Label>
                    <div className="relative">
                      <Hash className="text-muted-foreground pointer-events-none absolute top-3 left-3 h-4 w-4" />
                      <Input
                        id="accountNumber"
                        value={formData.accountNumber}
                        onChange={(e) =>
                          handleInputChange('accountNumber', e.target.value)
                        }
                        placeholder="Enter account number"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* IFSC Code */}
                  <div className="space-y-2">
                    <Label htmlFor="ifscCode">IFSC Code</Label>
                    <div className="relative">
                      <FileText className="text-muted-foreground pointer-events-none absolute top-3 left-3 h-4 w-4" />
                      <Input
                        id="ifscCode"
                        value={formData.ifscCode}
                        onChange={(e) =>
                          handleInputChange('ifscCode', e.target.value)
                        }
                        placeholder="Enter IFSC code"
                        className="pl-10"
                      />
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
                  <CardDescription>Description and notes</CardDescription>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) =>
                        handleInputChange('description', e.target.value)
                      }
                      placeholder="Enter payment description"
                      rows={3}
                    />
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
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
