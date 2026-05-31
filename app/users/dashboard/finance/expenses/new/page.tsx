'use client';

import { useState } from 'react';
import { routes } from '@/nav';
import { Button } from '@/components/shadcn/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
import { Input } from '@/components/shadcn/input';
import { Label } from '@/components/shadcn/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/select';
import { Textarea } from '@/components/shadcn/textarea';
import { Separator } from '@/components/shadcn/separator';
import { Save, X } from 'lucide-react';
import { PageHeader } from '@/components/common';
import Link from 'next/link';
import { toast } from '@/lib/styles/toast-styles';
import {
  ExpenseType,
  ExpenseStatus,
  ExpenseCategory,
  Expense,
} from '@/types/finance/expense';

const expenseTypeOptions = Object.entries(ExpenseType).map(([key]) => ({
  value: key,
  label: key.charAt(0).toUpperCase() + key.slice(1),
}));

const expenseCategoryOptions = Object.entries(ExpenseCategory).map(([key]) => ({
  value: key,
  label: key.charAt(0).toUpperCase() + key.slice(1).replaceAll('_', ' '),
}));

const getDateString = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function NewExpensePage() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<Partial<Expense>>({
    expenseNumber: '',
    type: ExpenseType.direct,
    category: ExpenseCategory.materials,
    status: ExpenseStatus.draft,
    expenseDate: new Date(),
    amount: 0,
    currency: 'INR',
    totalAmount: 0,
    taxRate: 0,
    taxAmount: 0,
    paymentStatus: 'unpaid',
    paidAmount: 0,
    balanceAmount: 0,
    isReimbursable: false,
    description: '',
    notes: '',
    paymentMethod: '',
    submittedBy: 1,
    submittedAt: new Date(),
    createdBy: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  function clearError(field: string) {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  const handleInputChange = (field: string, value: never) => {
    clearError(field);
    let newData: Partial<Expense> = { ...formData, [field]: value };

    // Recalculate totals if amount or tax rate changes
    if (field === 'amount' || field === 'taxRate') {
      const amount =
        field === 'amount'
          ? (value as unknown as number)
          : formData.amount || 0;
      const taxRate =
        field === 'taxRate'
          ? (value as unknown as number)
          : formData.taxRate || 0;

      const taxAmount = (amount * taxRate) / 100;
      const totalAmount = amount + taxAmount;
      const balanceAmount = totalAmount - (formData.paidAmount || 0);

      newData = {
        ...newData,
        taxAmount: Math.round(taxAmount * 100) / 100,
        totalAmount: Math.round(totalAmount * 100) / 100,
        balanceAmount: Math.round(balanceAmount * 100) / 100,
      };
    }

    setFormData(newData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!formData.expenseNumber?.trim())
      newErrors.expenseNumber = 'Expense number is required';
    if (!formData.description?.trim())
      newErrors.description = 'Description is required';
    if (!formData.amount || formData.amount <= 0)
      newErrors.amount = 'Amount must be greater than 0';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('Please fix the errors in the form');
      return;
    }
    toast.success('Expense created successfully!');
  };

  return (
    <div className="space-y-6">
      <PageHeader title="New Expense" description="Record a new expense" />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Basic Information</CardTitle>
            <CardDescription>
              Enter the basic details of the expense
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="expenseNumber">Expense Number</Label>
                <Input
                  id="expenseNumber"
                  placeholder="e.g., EXP-2024-001"
                  value={formData.expenseNumber || ''}
                  onChange={(e) =>
                    handleInputChange('expenseNumber', e.target.value as never)
                  }
                  className={errors.expenseNumber ? 'border-red-500' : ''}
                />
                {errors.expenseNumber && (
                  <p className="text-sm text-red-500">{errors.expenseNumber}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="expenseDate">Expense Date</Label>
                <Input
                  id="expenseDate"
                  type="date"
                  value={getDateString(formData.expenseDate || new Date())}
                  onChange={(e) =>
                    handleInputChange(
                      'expenseDate',
                      new Date(e.target.value) as never
                    )
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  value={formData.type || ExpenseType.direct}
                  onValueChange={(value) =>
                    handleInputChange('type', value as never)
                  }
                >
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {expenseTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category || ExpenseCategory.materials}
                  onValueChange={(value) =>
                    handleInputChange('category', value as never)
                  }
                >
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {expenseCategoryOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the expense..."
                value={formData.description || ''}
                onChange={(e) =>
                  handleInputChange('description', e.target.value as never)
                }
                className={`min-h-24 ${errors.description ? 'border-red-500' : ''}`}
              />
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Amount & Tax */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Amount & Tax</CardTitle>
            <CardDescription>
              Enter the amount and applicable tax details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₹)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0"
                  value={formData.amount || 0}
                  onChange={(e) =>
                    handleInputChange('amount', Number(e.target.value) as never)
                  }
                  className={errors.amount ? 'border-red-500' : ''}
                />
                {errors.amount && (
                  <p className="text-sm text-red-500">{errors.amount}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="taxRate">Tax Rate (%)</Label>
                <Input
                  id="taxRate"
                  type="number"
                  placeholder="0"
                  step="0.01"
                  value={formData.taxRate || 0}
                  onChange={(e) =>
                    handleInputChange(
                      'taxRate',
                      Number(e.target.value) as never
                    )
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={formData.currency || 'INR'}
                  onValueChange={(value) =>
                    handleInputChange('currency', value as never)
                  }
                >
                  <SelectTrigger id="currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INR">INR (₹)</SelectItem>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            {/* Summary */}
            <div className="grid grid-cols-1 gap-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4 md:grid-cols-3 dark:border-zinc-800 dark:bg-zinc-900/50">
              <div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Subtotal
                </p>
                <p className="mt-1 text-xl font-bold">
                  ₹{(formData.amount || 0).toLocaleString('en-IN')}
                </p>
              </div>
              <div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Tax</p>
                <p className="mt-1 text-xl font-bold text-orange-600 dark:text-orange-400">
                  ₹{(formData.taxAmount || 0).toLocaleString('en-IN')}
                </p>
              </div>
              <div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Total
                </p>
                <p className="mt-1 text-xl font-bold text-blue-600 dark:text-blue-400">
                  ₹{(formData.totalAmount || 0).toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Additional Details</CardTitle>
            <CardDescription>
              Add payment method, bill details, and notes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Select
                  value={formData.paymentMethod || ''}
                  onValueChange={(value) =>
                    handleInputChange('paymentMethod', value as never)
                  }
                >
                  <SelectTrigger id="paymentMethod">
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Check">Check</SelectItem>
                    <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                    <SelectItem value="Credit Card">Credit Card</SelectItem>
                    <SelectItem value="Debit Card">Debit Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="billNumber">Bill Number (Optional)</Label>
                <Input
                  id="billNumber"
                  placeholder="Bill/Invoice number"
                  value={formData.billNumber || ''}
                  onChange={(e) =>
                    handleInputChange('billNumber', e.target.value as never)
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Add any additional notes..."
                value={formData.notes || ''}
                onChange={(e) =>
                  handleInputChange('notes', e.target.value as never)
                }
                className="min-h-20"
              />
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button type="submit" className="gap-2">
            <Save className="h-4 w-4" />
            Create Expense
          </Button>
          <Button variant="outline" asChild>
            <Link href={routes.finance.expenses.href}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
