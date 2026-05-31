'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { routes } from '@/nav';
import { useVendors } from '@/hooks/vendors';
import { useProjects } from '@/hooks/project/use-projects';
import { useEmployees } from '@/hooks/employee';
import { useSubContracts } from '@/hooks/sub-contracts';
import { useLabour } from '@/hooks/labour';
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
  Payment,
  PaymentType,
  PaymentStatus,
  PaymentMethod,
  PayeeType,
  payeeTypeLabels,
} from '@/types/finance/payment';
import { getPayeesByType } from '@/lib/utils/payment-utils';
import {
  Save,
  X,
  DollarSign,
  Hash,
  FileText,
  Calendar,
  Building,
  Users,
} from 'lucide-react';
import { PageHeader } from '@/components/common';
import { format } from 'date-fns';
import { toast } from '@/lib/styles/toast-styles';

export default function NewPaymentPage() {
  const router = useRouter();
  const { data: vendors = [] } = useVendors();
  const { data: projects = [] } = useProjects();
  const { data: employees = [] } = useEmployees();
  const { data: subContracts = [] } = useSubContracts();
  const { data: labour = [] } = useLabour();

  // Create datasets object for utility functions
  const payeeDatasets = {
    vendors,
    employees,
    subContracts,
    labour,
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedPayeeType, setSelectedPayeeType] = useState<
    PayeeType | undefined
  >();
  const [showManualPayeeEntry, setShowManualPayeeEntry] = useState(false);

  const [formData, setFormData] = useState<Partial<Payment>>({
    paymentNumber: '',
    type: PaymentType.invoice,
    status: PaymentStatus.pending,
    method: PaymentMethod.bankTransfer,
    projectId: projects[0]?.id || 1, // Default to first project
    amount: 0,
    currency: 'INR',
    paymentDate: new Date(),
    transactionId: '',
    referenceNumber: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    description: '',
    notes: '',
    // Payee fields
    payeeType: undefined,
    payeeName: '',
    payeeDetails: '',
    vendorId: undefined,
    employeeId: undefined,
    subContractId: undefined,
    labourId: undefined,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!formData.paymentNumber?.trim())
      newErrors.paymentNumber = 'Payment number is required';
    if (!formData.amount || formData.amount <= 0)
      newErrors.amount = 'Amount must be greater than 0';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('Please fix the errors in the form');
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      toast.success('Payment created successfully');
      setIsSubmitting(false);
      router.push(routes.finance.payments.href);
    }, 1000);
  };

  const handleCancel = () => {
    router.push(routes.finance.payments.href);
  };

  const handleInputChange = (
    field: keyof Payment,
    value: string | number | Date
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handlePayeeTypeChange = (type: PayeeType) => {
    setSelectedPayeeType(type);

    // Determine if manual entry is needed
    const needsManualEntry = [
      PayeeType.consultant,
      PayeeType.utility,
      PayeeType.government,
      PayeeType.insurance,
      PayeeType.bank,
      PayeeType.legal,
      PayeeType.rental,
      PayeeType.other,
    ].includes(type);

    setShowManualPayeeEntry(needsManualEntry);

    // Clear existing payee data
    setFormData((prev) => ({
      ...prev,
      payeeType: needsManualEntry ? type : undefined,
      payeeName: '',
      payeeDetails: '',
      vendorId: undefined,
      employeeId: undefined,
      subContractId: undefined,
      labourId: undefined,
    }));
  };

  const handlePayeeEntityChange = (entityId: number) => {
    const updates: Partial<Payment> = {
      vendorId: undefined,
      employeeId: undefined,
      subContractId: undefined,
      labourId: undefined,
      payeeType: selectedPayeeType,
      payeeName: '',
    };

    switch (selectedPayeeType) {
      case PayeeType.vendor: {
        updates.vendorId = entityId;
        break;
      }
      case PayeeType.employee: {
        updates.employeeId = entityId;
        break;
      }
      case PayeeType.subContractor: {
        updates.subContractId = entityId;
        break;
      }
      case PayeeType.labour: {
        updates.labourId = entityId;
        break;
      }
    }

    setFormData((prev) => ({ ...prev, ...updates }));
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
    <div className="space-y-6">
      <PageHeader
        title="New Payment"
        description="Record a new payment transaction"
      />

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
                    onChange={(e) =>
                      handleInputChange('paymentNumber', e.target.value)
                    }
                    placeholder="e.g., PAY-2024-001"
                    className={errors.paymentNumber ? 'border-red-500' : ''}
                  />
                  {errors.paymentNumber && (
                    <p className="text-sm text-red-500">
                      {errors.paymentNumber}
                    </p>
                  )}
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
                      required
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

          {/* Payee Information Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="mb-6">
                <CardTitle>Payee Information</CardTitle>
                <CardDescription>
                  Who is receiving this payment?
                </CardDescription>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Payee Type */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="payeeType">
                    Payee Type <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={selectedPayeeType}
                    onValueChange={(value) =>
                      handlePayeeTypeChange(value as PayeeType)
                    }
                  >
                    <SelectTrigger id="payeeType">
                      <SelectValue placeholder="Select payee type" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(payeeTypeLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Entity Selector (for employee/vendor/labour/subContractor) */}
                {selectedPayeeType && !showManualPayeeEntry && (
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="payeeEntity">
                      Select {payeeTypeLabels[selectedPayeeType]}{' '}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={
                        formData.vendorId?.toString() ||
                        formData.employeeId?.toString() ||
                        formData.subContractId?.toString() ||
                        formData.labourId?.toString() ||
                        ''
                      }
                      onValueChange={(value) =>
                        handlePayeeEntityChange(Number(value))
                      }
                    >
                      <SelectTrigger id="payeeEntity">
                        <SelectValue
                          placeholder={`Select ${payeeTypeLabels[selectedPayeeType]}`}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {getPayeesByType(selectedPayeeType, payeeDatasets).map(
                          (payee) => (
                            <SelectItem
                              key={payee.id}
                              value={payee.id.toString()}
                            >
                              {payee.label}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Manual Payee Entry (for utility/government/insurance/etc.) */}
                {showManualPayeeEntry && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="payeeName">
                        Payee Name <span className="text-destructive">*</span>
                      </Label>
                      <div className="relative">
                        <Users className="text-muted-foreground pointer-events-none absolute top-3 left-3 h-4 w-4" />
                        <Input
                          id="payeeName"
                          value={formData.payeeName}
                          onChange={(e) =>
                            handleInputChange('payeeName', e.target.value)
                          }
                          placeholder="e.g., MSEB (Electricity Board)"
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="payeeDetails">Additional Details</Label>
                      <Input
                        id="payeeDetails"
                        value={formData.payeeDetails}
                        onChange={(e) =>
                          handleInputChange('payeeDetails', e.target.value)
                        }
                        placeholder="e.g., Consumer No: 123456"
                      />
                    </div>
                  </>
                )}
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
                      className={`pl-10 ${errors.amount ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {errors.amount && (
                    <p className="text-sm text-red-500">{errors.amount}</p>
                  )}
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
              {isSubmitting ? 'Creating...' : 'Create Payment'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
