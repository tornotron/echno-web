'use client';

import { useState } from 'react';
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
// Separator not used in this file
import { Save, X, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  BudgetType,
  BudgetStatus,
  Budget,
  BudgetLineItem,
} from '@/types/finance/budget';

const budgetTypeOptions = Object.entries(BudgetType).map(([key]) => ({
  value: key,
  label: key.charAt(0).toUpperCase() + key.slice(1).replaceAll('_', ' '),
}));

const budgetStatusOptions = Object.entries(BudgetStatus).map(([key]) => ({
  value: key,
  label: key.charAt(0).toUpperCase() + key.slice(1).replaceAll('_', ' '),
}));

const getDateString = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function NewBudgetPage() {
  const [formData, setFormData] = useState<Partial<Budget>>({
    budgetNumber: '',
    name: '',
    type: BudgetType.project,
    status: BudgetStatus.draft,
    startDate: new Date(),
    endDate: new Date(),
    totalAllocated: 0,
    totalSpent: 0,
    totalCommitted: 0,
    totalRemaining: 0,
    percentageUsed: 0,
    lineItems: [],
    warningThreshold: 80,
    criticalThreshold: 95,
    isOverBudget: false,
    linkedExpenseIds: [],
    linkedPurchaseOrderIds: [],
    actualSpent: 0,
    remainingBudget: 0,
    adjustments: [],
    description: '',
    notes: '',
    preparedBy: 1,
    preparedAt: new Date(),
    createdBy: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const [lineItems, setLineItems] = useState<Partial<BudgetLineItem>[]>([]);

  const handleInputChange = (field: string, value: string | number | Date) => {
    let newData: Partial<Budget> = { ...formData, [field]: value };

    // Recalculate totals if allocated amount changes
    if (field === 'totalAllocated') {
      const allocated = value as number;
      newData = {
        ...newData,
        totalAllocated: allocated,
        totalRemaining:
          allocated -
          (formData.totalSpent || 0) -
          (formData.totalCommitted || 0),
        percentageUsed:
          allocated > 0 ? ((formData.totalSpent || 0) / allocated) * 100 : 0,
      };
    }

    setFormData(newData);
  };

  const handleAddLineItem = () => {
    setLineItems([
      ...lineItems,
      {
        category: '',
        description: '',
        allocatedAmount: 0,
        spentAmount: 0,
        committedAmount: 0,
        remainingAmount: 0,
        percentageUsed: 0,
      },
    ]);
  };

  const handleRemoveLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handleLineItemChange = (
    index: number,
    field: string,
    value: string | number
  ) => {
    const newItems = [...lineItems];
    newItems[index] = { ...newItems[index], [field]: value };

    if (field === 'allocatedAmount' || field === 'spentAmount') {
      const allocated = (newItems[index].allocatedAmount as number) || 0;
      const spent = (newItems[index].spentAmount as number) || 0;
      const committed = (newItems[index].committedAmount as number) || 0;
      newItems[index] = {
        ...newItems[index],
        remainingAmount: allocated - spent - committed,
        percentageUsed: allocated > 0 ? (spent / allocated) * 100 : 0,
      };
    }

    setLineItems(newItems);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.budgetNumber?.trim()) {
      toast.error('Budget number is required');
      return;
    }

    if (!formData.name?.trim()) {
      toast.error('Budget name is required');
      return;
    }

    if (!formData.totalAllocated || formData.totalAllocated <= 0) {
      toast.error('Total allocated amount must be greater than 0');
      return;
    }

    // Success
    toast.success('Budget created successfully!');
    // Here you would typically make an API call
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Create New Budget</h1>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              Create a new budget for project, department, or organization
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Set up the basic details of the budget
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="budgetNumber">
                    Budget Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="budgetNumber"
                    placeholder="e.g., BUD-2024-001"
                    value={formData.budgetNumber}
                    onChange={(e) =>
                      handleInputChange('budgetNumber', e.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">
                    Budget Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="e.g., Project Alpha - Q4 2024"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">
                    Budget Type <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) =>
                      handleInputChange('type', value as BudgetType)
                    }
                  >
                    <SelectTrigger id="type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {budgetTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">
                    Status <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      handleInputChange('status', value as BudgetStatus)
                    }
                  >
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {budgetStatusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startDate">
                    Start Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={getDateString(formData.startDate as Date)}
                    onChange={(e) =>
                      handleInputChange('startDate', new Date(e.target.value))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">
                    End Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={getDateString(formData.endDate as Date)}
                    onChange={(e) =>
                      handleInputChange('endDate', new Date(e.target.value))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Add budget description..."
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange('description', e.target.value)
                  }
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Budget Allocation */}
          <Card>
            <CardHeader>
              <CardTitle>Budget Allocation</CardTitle>
              <CardDescription>
                Set the total budget amount and thresholds
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="totalAllocated">
                    Total Allocated Amount (₹){' '}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="totalAllocated"
                    type="number"
                    placeholder="0"
                    value={formData.totalAllocated}
                    onChange={(e) =>
                      handleInputChange(
                        'totalAllocated',
                        Number.parseFloat(e.target.value) || 0
                      )
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="warningThreshold">
                    Warning Threshold (%)
                  </Label>
                  <Input
                    id="warningThreshold"
                    type="number"
                    placeholder="80"
                    value={formData.warningThreshold}
                    onChange={(e) =>
                      handleInputChange(
                        'warningThreshold',
                        Number.parseFloat(e.target.value) || 80
                      )
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="criticalThreshold">
                    Critical Threshold (%)
                  </Label>
                  <Input
                    id="criticalThreshold"
                    type="number"
                    placeholder="95"
                    value={formData.criticalThreshold}
                    onChange={(e) =>
                      handleInputChange(
                        'criticalThreshold',
                        Number.parseFloat(e.target.value) || 95
                      )
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Budget Line Items</CardTitle>
                <CardDescription>Break down budget by category</CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddLineItem}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </CardHeader>
            <CardContent>
              {lineItems.length > 0 ? (
                <div className="space-y-4">
                  {lineItems.map((item, index) => (
                    <div
                      key={index}
                      className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
                    >
                      <div className="mb-4 flex items-start justify-between">
                        <h4 className="font-medium">Line Item {index + 1}</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveLineItem(index)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Category</Label>
                          <Input
                            placeholder="e.g., Labour"
                            value={item.category}
                            onChange={(e) =>
                              handleLineItemChange(
                                index,
                                'category',
                                e.target.value
                              )
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Subcategory</Label>
                          <Input
                            placeholder="e.g., Skilled"
                            value={item.subcategory}
                            onChange={(e) =>
                              handleLineItemChange(
                                index,
                                'subcategory',
                                e.target.value
                              )
                            }
                          />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                          <Label>Description</Label>
                          <Input
                            placeholder="e.g., Skilled labour costs"
                            value={item.description}
                            onChange={(e) =>
                              handleLineItemChange(
                                index,
                                'description',
                                e.target.value
                              )
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Allocated Amount (₹)</Label>
                          <Input
                            type="number"
                            placeholder="0"
                            value={item.allocatedAmount}
                            onChange={(e) =>
                              handleLineItemChange(
                                index,
                                'allocatedAmount',
                                Number.parseFloat(e.target.value) || 0
                              )
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Spent Amount (₹)</Label>
                          <Input
                            type="number"
                            placeholder="0"
                            value={item.spentAmount}
                            onChange={(e) =>
                              handleLineItemChange(
                                index,
                                'spentAmount',
                                Number.parseFloat(e.target.value) || 0
                              )
                            }
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    No line items added yet. Click &quot;Add Item&quot; to
                    create budget categories.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any additional notes..."
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex gap-4">
            <Button type="submit">
              <Save className="mr-2 h-4 w-4" />
              Create Budget
            </Button>
            <Button type="reset" variant="outline">
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
