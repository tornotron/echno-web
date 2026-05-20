'use client';

import { use, useState } from 'react';
import { useBudgetById } from '@/hooks/budgets';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/shadcn/table';
import { Save, X, Plus, Trash2, PieChart, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/common';
import Link from 'next/link';
import { routes } from '@/nav';
import { toast } from '@/lib/styles/toast-styles';
import {
  Empty,
  EmptyErrorMedia,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from '@/components/shadcn/empty';
import {
  BudgetType,
  BudgetStatus,
  Budget,
  BudgetLineItem,
  BudgetLineItemType,
  BudgetPaymentMilestone,
  PaymentMilestoneStatus,
  budgetLineItemTypeLabels,
} from '@/types/finance/budget';

const budgetTypeOptions = Object.entries(BudgetType).map(([key]) => ({
  value: key,
  label: key.charAt(0).toUpperCase() + key.slice(1).replaceAll('_', ' '),
}));

const budgetStatusOptions = Object.entries(BudgetStatus).map(([key]) => ({
  value: key,
  label: key.charAt(0).toUpperCase() + key.slice(1).replaceAll('_', ' '),
}));

const itemTypeOptions = Object.entries(BudgetLineItemType).map(([key]) => ({
  value: key,
  label: budgetLineItemTypeLabels[key as BudgetLineItemType],
}));

const getDateString = (date: Date | string) => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function EditBudgetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const budgetId = Number.parseInt(id);
  const { data: budget, isLoading, isError } = useBudgetById(budgetId);

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
          <PieChart className="size-6" />
        </EmptyErrorMedia>
        <EmptyHeader>
          <EmptyTitle>Failed to load budget</EmptyTitle>
          <EmptyDescription>
            An unexpected error occurred. Please try again.
          </EmptyDescription>
        </EmptyHeader>
        <Button asChild>
          <Link href={routes.finance.budgets.href}>Back to Budgets</Link>
        </Button>
      </Empty>
    );
  if (!budget)
    return (
      <Empty variant="default">
        <EmptyErrorMedia>
          <PieChart className="size-6" />
        </EmptyErrorMedia>
        <EmptyHeader>
          <EmptyTitle>Budget not found</EmptyTitle>
          <EmptyDescription>
            This record may have been deleted or does not exist.
          </EmptyDescription>
        </EmptyHeader>
        <Button asChild>
          <Link href={routes.finance.budgets.href}>Back to Budgets</Link>
        </Button>
      </Empty>
    );

  return <BudgetEditForm initialData={budget} budgetId={budgetId} />;
}

interface BudgetEditFormProps {
  initialData: Budget;
  budgetId: number;
}

function BudgetEditForm({ initialData, budgetId }: BudgetEditFormProps) {
  const [formData, setFormData] = useState<Partial<Budget>>(() => ({
    ...initialData,
  }));
  const [lineItems, setLineItems] = useState<Partial<BudgetLineItem>[]>(
    () => initialData.lineItems ?? []
  );
  const [paymentMilestones, setPaymentMilestones] = useState<
    Partial<BudgetPaymentMilestone>[]
  >(() => initialData.paymentMilestones ?? []);

  const handleInputChange = (field: string, value: string | number | Date) => {
    let newData: Partial<Budget> = { ...formData, [field]: value };

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
        itemType: BudgetLineItemType.material,
        category: '',
        description: '',
        quantity: 0,
        unit: '',
        unitRate: 0,
        allocatedAmount: 0,
        spentAmount: 0,
        committedAmount: 0,
        remainingAmount: 0,
        percentageUsed: 0,
      },
    ]);
  };

  const handleAddMilestone = () => {
    const maxId =
      paymentMilestones.length > 0
        ? Math.max(...paymentMilestones.map((m) => m.id || 0))
        : 0;

    setPaymentMilestones([
      ...paymentMilestones,
      {
        id: maxId + 1,
        name: '',
        description: '',
        dueDate: new Date().toISOString(),
        amount: 0,
        percentage: 0,
        status: PaymentMilestoneStatus.pending,
      },
    ]);
  };

  const handleRemoveMilestone = (index: number) => {
    setPaymentMilestones(paymentMilestones.filter((_, i) => i !== index));
  };

  const handleMilestoneChange = (
    index: number,
    field: string,
    value: string | number | Date
  ) => {
    const newMilestones = [...paymentMilestones];
    newMilestones[index] = { ...newMilestones[index], [field]: value };

    if (field === 'amount' && formData.totalAllocated) {
      const percentage = ((value as number) / formData.totalAllocated) * 100;
      newMilestones[index] = {
        ...newMilestones[index],
        percentage: Math.round(percentage * 10) / 10,
      };
    }

    setPaymentMilestones(newMilestones);
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

    if (field === 'quantity' || field === 'unitRate') {
      const quantity = (newItems[index].quantity as number) || 0;
      const unitRate = (newItems[index].unitRate as number) || 0;
      const baseAmount = quantity * unitRate;
      const materialCost = (newItems[index].materialCost as number) || 0;
      const laborCost = (newItems[index].laborCost as number) || 0;
      const equipmentCost = (newItems[index].equipmentCost as number) || 0;

      newItems[index] = {
        ...newItems[index],
        allocatedAmount: baseAmount + materialCost + laborCost + equipmentCost,
      };
    }

    if (
      field === 'allocatedAmount' ||
      field === 'spentAmount' ||
      field === 'committedAmount' ||
      field === 'quantity' ||
      field === 'unitRate'
    ) {
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

    toast.success('Budget updated successfully!');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Budget"
        description="Update budget allocations and settings"
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Update the basic details of the budget
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
                  value={getDateString(formData.startDate as Date | string)}
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
                  value={getDateString(formData.endDate as Date | string)}
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
              Update the total budget amount and thresholds
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
                <Label htmlFor="warningThreshold">Warning Threshold (%)</Label>
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
              <CardDescription>
                Detailed cost breakdown with quantities and rates
              </CardDescription>
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
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead className="min-w-[120px]">Type</TableHead>
                      <TableHead className="min-w-[150px]">Category</TableHead>
                      <TableHead className="min-w-[200px]">
                        Description
                      </TableHead>
                      <TableHead className="min-w-[100px]">Quantity</TableHead>
                      <TableHead className="min-w-20">Unit</TableHead>
                      <TableHead className="min-w-[120px]">Rate (₹)</TableHead>
                      <TableHead className="min-w-[140px]">
                        Allocated (₹)
                      </TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lineItems.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {index + 1}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={item.itemType}
                            onValueChange={(value) =>
                              handleLineItemChange(
                                index,
                                'itemType',
                                value as BudgetLineItemType
                              )
                            }
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {itemTypeOptions.map((option) => (
                                <SelectItem
                                  key={option.value}
                                  value={option.value}
                                >
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            placeholder="e.g., Materials"
                            value={item.category}
                            onChange={(e) =>
                              handleLineItemChange(
                                index,
                                'category',
                                e.target.value
                              )
                            }
                            className="h-9"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            placeholder="e.g., Cement and concrete"
                            value={item.description}
                            onChange={(e) =>
                              handleLineItemChange(
                                index,
                                'description',
                                e.target.value
                              )
                            }
                            className="h-9"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            placeholder="0"
                            value={item.quantity || ''}
                            onChange={(e) =>
                              handleLineItemChange(
                                index,
                                'quantity',
                                Number.parseFloat(e.target.value) || 0
                              )
                            }
                            className="h-9"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            placeholder="e.g., m3"
                            value={item.unit || ''}
                            onChange={(e) =>
                              handleLineItemChange(
                                index,
                                'unit',
                                e.target.value
                              )
                            }
                            className="h-9"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            placeholder="0"
                            value={item.unitRate || ''}
                            onChange={(e) =>
                              handleLineItemChange(
                                index,
                                'unitRate',
                                Number.parseFloat(e.target.value) || 0
                              )
                            }
                            className="h-9"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="font-medium whitespace-nowrap text-zinc-900 dark:text-zinc-100">
                            ₹
                            {(item.allocatedAmount || 0).toLocaleString(
                              'en-IN'
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveLineItem(index)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  No line items added yet. Click &quot;Add Item&quot; to create
                  budget categories.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Project Details */}
        <Card>
          <CardHeader>
            <CardTitle>Project Details</CardTitle>
            <CardDescription>
              Define scope, assumptions, and exclusions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="projectScope">Project Scope</Label>
              <Textarea
                id="projectScope"
                placeholder="Describe the scope of work covered by this budget..."
                value={formData.projectScope}
                onChange={(e) =>
                  handleInputChange('projectScope', e.target.value)
                }
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="assumptions">Assumptions</Label>
              <Textarea
                id="assumptions"
                placeholder="List key assumptions (e.g., material prices, weather conditions)..."
                value={formData.assumptions}
                onChange={(e) =>
                  handleInputChange('assumptions', e.target.value)
                }
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="exclusions">Exclusions</Label>
              <Textarea
                id="exclusions"
                placeholder="List items excluded from this budget..."
                value={formData.exclusions}
                onChange={(e) =>
                  handleInputChange('exclusions', e.target.value)
                }
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Payment Milestones */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Payment Milestones</CardTitle>
              <CardDescription>
                Schedule payment milestones for this budget
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddMilestone}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Milestone
            </Button>
          </CardHeader>
          <CardContent>
            {paymentMilestones.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead className="min-w-[150px]">Name</TableHead>
                      <TableHead className="min-w-[200px]">
                        Description
                      </TableHead>
                      <TableHead className="min-w-[120px]">Due Date</TableHead>
                      <TableHead className="min-w-[120px]">
                        Amount (₹)
                      </TableHead>
                      <TableHead className="min-w-20">%</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paymentMilestones.map((milestone, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {index + 1}
                        </TableCell>
                        <TableCell>
                          <Input
                            placeholder="e.g., Initial Payment"
                            value={milestone.name}
                            onChange={(e) =>
                              handleMilestoneChange(
                                index,
                                'name',
                                e.target.value
                              )
                            }
                            className="h-9"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            placeholder="e.g., Payment upon project start"
                            value={milestone.description}
                            onChange={(e) =>
                              handleMilestoneChange(
                                index,
                                'description',
                                e.target.value
                              )
                            }
                            className="h-9"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="date"
                            value={
                              milestone.dueDate
                                ? typeof milestone.dueDate === 'string'
                                  ? milestone.dueDate.split('T')[0]
                                  : getDateString(milestone.dueDate)
                                : ''
                            }
                            onChange={(e) =>
                              handleMilestoneChange(
                                index,
                                'dueDate',
                                new Date(e.target.value).toISOString()
                              )
                            }
                            className="h-9"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            placeholder="0"
                            value={milestone.amount || ''}
                            onChange={(e) =>
                              handleMilestoneChange(
                                index,
                                'amount',
                                Number.parseFloat(e.target.value) || 0
                              )
                            }
                            className="h-9"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="text-sm whitespace-nowrap text-zinc-600 dark:text-zinc-400">
                            {milestone.percentage || 0}%
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveMilestone(index)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  No payment milestones added yet. Click &quot;Add
                  Milestone&quot; to schedule payments.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Terms & Conditions */}
        <Card>
          <CardHeader>
            <CardTitle>Terms & Conditions</CardTitle>
            <CardDescription>Payment and budget terms</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="termsAndConditions">Terms</Label>
              <Textarea
                id="termsAndConditions"
                placeholder="Enter payment terms, conditions, and any special clauses..."
                value={formData.termsAndConditions}
                onChange={(e) =>
                  handleInputChange('termsAndConditions', e.target.value)
                }
                rows={4}
              />
            </div>
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
            Update Budget
          </Button>
          <Button variant="outline" asChild>
            <Link href={routes.finance.budgets.detail(budgetId).href}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
