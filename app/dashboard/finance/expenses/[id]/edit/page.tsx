'use client';

import { useState } from 'react';
import { notFound } from 'next/navigation';
import { use } from 'react';
import { mockExpenses } from '@/components/shared/mock-data';
import { AppLayout } from '@/components/common';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Save, X, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
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

const expenseStatusOptions = Object.entries(ExpenseStatus).map(([key]) => ({
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

interface EditExpensePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditExpensePage({ params }: EditExpensePageProps) {
  const resolvedParams = use(params);
  const expense = mockExpenses.find(
    (e) => e.id === Number.parseInt(resolvedParams.id)
  );

  if (!expense) {
    notFound();
  }

  const [formData, setFormData] = useState<Partial<Expense>>({
    ...expense,
  });

  const handleInputChange = (field: string, value: never) => {
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

    // Validation
    if (!formData.description?.trim()) {
      toast.error('Description is required');
      return;
    }

    if (!formData.amount || formData.amount <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }

    // Success
    toast.success('Expense updated successfully!');
    // Here you would typically make an API call
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Edit Expense</h1>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              Modify expense details and update information
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
              <CardDescription>
                Update the basic details of the expense
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="expenseNumber">Expense Number</Label>
                  <Input
                    id="expenseNumber"
                    value={formData.expenseNumber || ''}
                    disabled
                    className="bg-zinc-100 dark:bg-zinc-900"
                  />
                  <p className="text-xs text-zinc-500">
                    Expense number cannot be changed
                  </p>
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

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status || ExpenseStatus.draft}
                    onValueChange={(value) =>
                      handleInputChange('status', value as never)
                    }
                  >
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {expenseStatusOptions.map((option) => (
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
                  value={formData.description || ''}
                  onChange={(e) =>
                    handleInputChange('description', e.target.value as never)
                  }
                  className="min-h-24"
                />
              </div>
            </CardContent>
          </Card>

          {/* Amount & Tax */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Amount & Tax</CardTitle>
              <CardDescription>
                Update the amount and applicable tax details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (₹)</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={formData.amount || 0}
                    onChange={(e) =>
                      handleInputChange(
                        'amount',
                        Number(e.target.value) as never
                      )
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="taxRate">Tax Rate (%)</Label>
                  <Input
                    id="taxRate"
                    type="number"
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
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Tax
                  </p>
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

          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Payment Information</CardTitle>
              <CardDescription>
                Track payment status and details
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
                      <SelectItem value="Bank Transfer">
                        Bank Transfer
                      </SelectItem>
                      <SelectItem value="Credit Card">Credit Card</SelectItem>
                      <SelectItem value="Debit Card">Debit Card</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentStatus">Payment Status</Label>
                  <Select
                    value={formData.paymentStatus || 'unpaid'}
                    onValueChange={(value) =>
                      handleInputChange('paymentStatus', value as never)
                    }
                  >
                    <SelectTrigger id="paymentStatus">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unpaid">Unpaid</SelectItem>
                      <SelectItem value="partially_paid">
                        Partially Paid
                      </SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="reimbursed">Reimbursed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paidAmount">Paid Amount (₹)</Label>
                  <Input
                    id="paidAmount"
                    type="number"
                    value={formData.paidAmount || 0}
                    onChange={(e) =>
                      handleInputChange(
                        'paidAmount',
                        Number(e.target.value) as never
                      )
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="billNumber">Bill Number (Optional)</Label>
                  <Input
                    id="billNumber"
                    value={formData.billNumber || ''}
                    onChange={(e) =>
                      handleInputChange('billNumber', e.target.value as never)
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Notes</CardTitle>
              <CardDescription>
                Add any additional notes or information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
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
              Update Expense
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/dashboard/finance/expenses/${expense.id}`}>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Link>
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
