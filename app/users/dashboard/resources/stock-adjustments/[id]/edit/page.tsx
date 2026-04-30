'use client';

import { use, useState, useEffect } from 'react';

import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';
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
import { Separator } from '@/components/shadcn/separator';
import {
  Plus,
  Trash2,
  Save,
  AlertCircle,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { toast } from '@/lib/styles/toast-styles';

interface AdjustmentItem {
  id: number;
  description: string;
  currentStock: number;
  countedStock: number;
  unit: string;
  unitCost: number;
  reason: string;
}

// Mock data
const mockStockAdjustments = [
  {
    id: 1,
    adjustmentNumber: 'SA-2024-001',
    adjustmentType: 'Physical Count',
    adjustmentDate: new Date('2024-01-15'),
    reason: 'Annual stock verification',
    location: 'Warehouse A',
    status: 'Completed',
    createdBy: 15,
    approvedBy: 3,
    approvedAt: new Date('2024-01-16'),
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-16'),
    notes:
      'Annual physical count completed. Minor discrepancies found in Zone B.',
    items: [
      {
        id: 1,
        description: 'Portland Cement - Grade 43',
        currentStock: 500,
        countedStock: 485,
        unit: 'bags',
        unitCost: 350,
        reason: 'Damaged bags found during inspection',
      },
      {
        id: 2,
        description: 'Steel Rebar 12mm',
        currentStock: 1200,
        countedStock: 1215,
        unit: 'pcs',
        unitCost: 65,
        reason: 'Miscount in previous entry',
      },
    ],
  },
];

export default function EditStockAdjustmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [adjustmentNumber, setAdjustmentNumber] = useState('');

  // Basic Information
  const [adjustmentDate, setAdjustmentDate] = useState('');
  const [adjustmentType, setAdjustmentType] = useState('Physical Count');
  const [location, setLocation] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [notes, setNotes] = useState('');

  // Adjustment Items
  const [items, setItems] = useState<AdjustmentItem[]>([]);

  useEffect(() => {
    // Simulate API call
    const foundAdjustment = mockStockAdjustments.find(
      (sa) => sa.id === Number.parseInt(id)
    );

    if (foundAdjustment) {
      setTimeout(() => {
        setAdjustmentNumber(foundAdjustment.adjustmentNumber);
        setAdjustmentDate(format(foundAdjustment.adjustmentDate, 'yyyy-MM-dd'));
        setAdjustmentType(foundAdjustment.adjustmentType);
        setLocation(foundAdjustment.location);
        setAdjustmentReason(foundAdjustment.reason);
        setNotes(foundAdjustment.notes || '');

        // Map items
        const adjustmentItems: AdjustmentItem[] = foundAdjustment.items.map(
          (item) => ({
            id: item.id,
            description: item.description,
            currentStock: item.currentStock,
            countedStock: item.countedStock,
            unit: item.unit,
            unitCost: item.unitCost,
            reason: item.reason,
          })
        );
        setItems(adjustmentItems);
        setLoading(false);
      }, 0);
    } else {
      setTimeout(() => setLoading(false), 0);
    }
  }, [id]);

  const addItem = () => {
    setItems([
      ...items,
      {
        id: items.length + 1,
        description: '',
        currentStock: 0,
        countedStock: 0,
        unit: 'pcs',
        unitCost: 0,
        reason: '',
      },
    ]);
  };

  const removeItem = (itemId: number) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== itemId));
    }
  };

  const updateItem = (
    itemId: number,
    field: keyof AdjustmentItem,
    value: string | number
  ) => {
    setItems(
      items.map((item) =>
        item.id === itemId ? { ...item, [field]: value } : item
      )
    );
  };

  const calculateItemDifference = (item: AdjustmentItem) => {
    return item.countedStock - item.currentStock;
  };

  const calculateItemImpact = (item: AdjustmentItem) => {
    const difference = calculateItemDifference(item);
    return difference * item.unitCost;
  };

  const calculateTotals = () => {
    const totalItems = items.length;
    const totalImpact = items.reduce(
      (sum, item) => sum + calculateItemImpact(item),
      0
    );
    const surplusItems = items.filter(
      (item) => calculateItemDifference(item) > 0
    ).length;
    const shortageItems = items.filter(
      (item) => calculateItemDifference(item) < 0
    ).length;

    return { totalItems, totalImpact, surplusItems, shortageItems };
  };

  const handleSubmit = () => {
    // Validation
    if (!location) {
      toast.error('Please select a location');
      return;
    }

    if (!adjustmentReason.trim()) {
      toast.error('Please enter a reason for this adjustment');
      return;
    }

    const hasInvalidItems = items.some(
      (item) => !item.description.trim() || !item.reason.trim()
    );

    if (hasInvalidItems) {
      toast.error('Please ensure all items have a description and reason');
      return;
    }

    toast.success('Stock Adjustment updated successfully');
    router.push(`/dashboard/resources/stock-adjustments/${id}`);
  };

  const handleCancel = () => {
    router.push(`/dashboard/resources/stock-adjustments/${id}`);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex h-96 items-center justify-center">
          <div className="text-zinc-500 dark:text-zinc-400">
            Loading adjustment...
          </div>
        </div>
      </div>
    );
  }

  if (!adjustmentNumber) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex h-96 flex-col items-center justify-center gap-4">
          <AlertCircle className="h-12 w-12 text-zinc-400 dark:text-zinc-600" />
          <div className="text-zinc-500 dark:text-zinc-400">
            Stock Adjustment not found
          </div>
        </div>
      </div>
    );
  }

  const { totalItems, totalImpact, surplusItems, shortageItems } =
    calculateTotals();

  return (
    <div className="mx-auto max-w-7xl space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 sm:text-3xl dark:text-zinc-100">
              Edit Stock Adjustment
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {adjustmentNumber}
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>General adjustment details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="adjustmentNumber">Adjustment Number</Label>
                  <Input
                    id="adjustmentNumber"
                    value={adjustmentNumber}
                    disabled
                  />
                </div>

                <div>
                  <Label htmlFor="adjustmentDate">Adjustment Date *</Label>
                  <Input
                    id="adjustmentDate"
                    type="date"
                    value={adjustmentDate}
                    onChange={(e) => setAdjustmentDate(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="adjustmentType">Adjustment Type *</Label>
                  <Select
                    value={adjustmentType}
                    onValueChange={setAdjustmentType}
                  >
                    <SelectTrigger id="adjustmentType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Physical Count">
                        Physical Count
                      </SelectItem>
                      <SelectItem value="Damage/Loss">Damage/Loss</SelectItem>
                      <SelectItem value="Expiry">Expiry</SelectItem>
                      <SelectItem value="Correction">Correction</SelectItem>
                      <SelectItem value="Return">Return</SelectItem>
                      <SelectItem value="Write-off">Write-off</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="location">Location *</Label>
                  <Select value={location} onValueChange={setLocation}>
                    <SelectTrigger id="location">
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Warehouse A">Warehouse A</SelectItem>
                      <SelectItem value="Warehouse B">Warehouse B</SelectItem>
                      <SelectItem value="Site A - Building Project">
                        Site A - Building Project
                      </SelectItem>
                      <SelectItem value="Site B - Bridge Construction">
                        Site B - Bridge Construction
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="adjustmentReason">Reason *</Label>
                <Textarea
                  id="adjustmentReason"
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  placeholder="Describe the reason for this adjustment..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional notes or observations..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Adjustment Items */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Adjustment Items</CardTitle>
                  <CardDescription>Items being adjusted</CardDescription>
                </div>
                <Button onClick={addItem} size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Item
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item, index) => {
                const difference = calculateItemDifference(item);
                const impact = calculateItemImpact(item);

                return (
                  <div
                    key={item.id}
                    className="space-y-4 rounded-lg border p-4"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">
                        Item #{index + 1}
                      </h4>
                      {items.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <Label>Item Description *</Label>
                        <Input
                          value={item.description}
                          onChange={(e) =>
                            updateItem(item.id, 'description', e.target.value)
                          }
                          placeholder="Item description"
                        />
                      </div>

                      <div>
                        <Label>Current Stock *</Label>
                        <Input
                          type="number"
                          value={item.currentStock || ''}
                          onChange={(e) =>
                            updateItem(
                              item.id,
                              'currentStock',
                              Number.parseFloat(e.target.value) || 0
                            )
                          }
                          placeholder="0"
                          min="0"
                        />
                      </div>

                      <div>
                        <Label>Counted Stock *</Label>
                        <Input
                          type="number"
                          value={item.countedStock || ''}
                          onChange={(e) =>
                            updateItem(
                              item.id,
                              'countedStock',
                              Number.parseFloat(e.target.value) || 0
                            )
                          }
                          placeholder="0"
                          min="0"
                        />
                      </div>

                      <div>
                        <Label>Unit</Label>
                        <Select
                          value={item.unit}
                          onValueChange={(value) =>
                            updateItem(item.id, 'unit', value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pcs">Pieces</SelectItem>
                            <SelectItem value="kg">Kilograms</SelectItem>
                            <SelectItem value="L">Liters</SelectItem>
                            <SelectItem value="m">Meters</SelectItem>
                            <SelectItem value="sqm">Square Meters</SelectItem>
                            <SelectItem value="bags">Bags</SelectItem>
                            <SelectItem value="boxes">Boxes</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Unit Cost (₹) *</Label>
                        <Input
                          type="number"
                          value={item.unitCost || ''}
                          onChange={(e) =>
                            updateItem(
                              item.id,
                              'unitCost',
                              Number.parseFloat(e.target.value) || 0
                            )
                          }
                          placeholder="0"
                          min="0"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <Label>Reason for Adjustment *</Label>
                        <Textarea
                          value={item.reason}
                          onChange={(e) =>
                            updateItem(item.id, 'reason', e.target.value)
                          }
                          placeholder="Explain why this adjustment is being made..."
                          rows={2}
                        />
                      </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-500 dark:text-zinc-400">
                          Difference:
                        </span>
                        <div className="flex items-center gap-1">
                          {difference > 0 ? (
                            <TrendingUp className="h-4 w-4 text-green-500" />
                          ) : difference < 0 ? (
                            <TrendingDown className="h-4 w-4 text-red-500" />
                          ) : null}
                          <span
                            className={`font-semibold ${
                              difference > 0
                                ? 'text-green-600 dark:text-green-400'
                                : difference < 0
                                  ? 'text-red-600 dark:text-red-400'
                                  : 'text-zinc-900 dark:text-zinc-100'
                            }`}
                          >
                            {difference > 0 ? '+' : ''}
                            {difference} {item.unit}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-zinc-500 dark:text-zinc-400">
                          Impact:
                        </span>
                        <span
                          className={`font-semibold ${
                            impact > 0
                              ? 'text-green-600 dark:text-green-400'
                              : impact < 0
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-zinc-900 dark:text-zinc-100'
                          }`}
                        >
                          {impact > 0 ? '+' : ''}₹{impact.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-500 dark:text-zinc-400">
                  Total Items:
                </span>
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  {totalItems}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500 dark:text-zinc-400">
                  Surplus Items:
                </span>
                <span className="font-medium text-green-600 dark:text-green-400">
                  {surplusItems}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500 dark:text-zinc-400">
                  Shortage Items:
                </span>
                <span className="font-medium text-red-600 dark:text-red-400">
                  {shortageItems}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-zinc-500 dark:text-zinc-400">
                  Net Impact:
                </span>
                <span
                  className={`text-lg font-bold ${
                    totalImpact > 0
                      ? 'text-green-600 dark:text-green-400'
                      : totalImpact < 0
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-zinc-900 dark:text-zinc-100'
                  }`}
                >
                  {totalImpact > 0 ? '+' : ''}₹
                  {(Math.abs(totalImpact) / 1000).toFixed(2)}K
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertCircle className="h-4 w-4" />
                Quick Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
              <p>• Changes will be saved immediately</p>
              <p>• Verify counted stock numbers carefully</p>
              <p>• Update reasons if new information available</p>
              <p>• Review financial impact before saving</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
