'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, Save, X } from 'lucide-react';
import {
  MaterialRequestType,
  MaterialRequestPriority,
  materialRequestTypeLabels,
  materialRequestPriorityLabels,
} from '@/types/resource/material-request';
import { toast } from '@/lib/styles/toast-styles';

interface LineItem {
  id: string;
  description: string;
  specifications: string;
  quantityRequested: number;
  unit: string;
  estimatedCost: number;
  requiredByDate: string;
  purpose: string;
  notes: string;
}

export default function CreateMaterialRequestPage() {
  const router = useRouter();

  // Basic Information
  const [requestNumber, setRequestNumber] = useState(
    () =>
      `MR-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`
  );
  const [type, setType] = useState<MaterialRequestType>(
    MaterialRequestType.project
  );
  const [priority, setPriority] = useState<MaterialRequestPriority>(
    MaterialRequestPriority.medium
  );
  const [requestDate, setRequestDate] = useState(
    format(new Date(), 'yyyy-MM-dd')
  );
  const [requiredByDate, setRequiredByDate] = useState('');

  // Request Details
  const [purpose, setPurpose] = useState('');
  const [justification, setJustification] = useState('');
  const [notes, setNotes] = useState('');

  // Requestor Information
  const [requestedByDepartment, setRequestedByDepartment] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');

  // Options
  const [partialFulfillmentAllowed, setPartialFulfillmentAllowed] =
    useState(true);

  // Line Items
  const [lineItems, setLineItems] = useState<LineItem[]>([
    {
      id: '1',
      description: '',
      specifications: '',
      quantityRequested: 1,
      unit: 'pcs',
      estimatedCost: 0,
      requiredByDate: '',
      purpose: '',
      notes: '',
    },
  ]);

  // Add new line item
  const addLineItem = () => {
    const newItem: LineItem = {
      id: String(lineItems.length + 1),
      description: '',
      specifications: '',
      quantityRequested: 1,
      unit: 'pcs',
      estimatedCost: 0,
      requiredByDate: '',
      purpose: '',
      notes: '',
    };
    setLineItems([...lineItems, newItem]);
  };

  // Remove line item
  const removeLineItem = (id: string) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((item) => item.id !== id));
    } else {
      toast.error('At least one line item is required');
    }
  };

  // Update line item
  const updateLineItem = (
    id: string,
    field: keyof LineItem,
    value: string | number
  ) => {
    setLineItems(
      lineItems.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  // Calculate totals
  const calculateTotals = () => {
    const totalCost = lineItems.reduce(
      (sum, item) => sum + item.estimatedCost,
      0
    );
    const totalItems = lineItems.length;
    const totalQuantity = lineItems.reduce(
      (sum, item) => sum + item.quantityRequested,
      0
    );

    return {
      cost: totalCost,
      items: totalItems,
      quantity: totalQuantity,
    };
  };

  const totals = calculateTotals();

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!purpose.trim()) {
      toast.error('Purpose is required');
      return;
    }

    if (!requiredByDate) {
      toast.error('Required by date is required');
      return;
    }

    const hasEmptyItems = lineItems.some(
      (item) => !item.description.trim() || item.quantityRequested <= 0
    );

    if (hasEmptyItems) {
      toast.error('All line items must have description and quantity');
      return;
    }

    toast.success('Material request created successfully');
    router.push('/dashboard/resources/material-requests');
  };

  const handleCancel = () => {
    router.push('/dashboard/resources/material-requests');
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              Create Material Request
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Fill in the details below to create a new material request
            </p>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={handleCancel}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button type="submit">
              <Save className="mr-2 h-4 w-4" />
              Create Request
            </Button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Left Column - Main Info */}
          <div className="space-y-6 md:col-span-2">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="requestNumber">Request Number</Label>
                    <Input
                      id="requestNumber"
                      value={requestNumber}
                      onChange={(e) => setRequestNumber(e.target.value)}
                      placeholder="MR-2024-001"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="requestDate">Request Date</Label>
                    <Input
                      id="requestDate"
                      type="date"
                      value={requestDate}
                      onChange={(e) => setRequestDate(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="type">Request Type</Label>
                    <Select
                      value={type}
                      onValueChange={(value) =>
                        setType(value as MaterialRequestType)
                      }
                    >
                      <SelectTrigger id="type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(MaterialRequestType).map((t) => (
                          <SelectItem key={t} value={t}>
                            {materialRequestTypeLabels[t]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={priority}
                      onValueChange={(value) =>
                        setPriority(value as MaterialRequestPriority)
                      }
                    >
                      <SelectTrigger id="priority">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(MaterialRequestPriority).map((p) => (
                          <SelectItem key={p} value={p}>
                            {materialRequestPriorityLabels[p]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="requiredByDate">Required By Date *</Label>
                    <Input
                      id="requiredByDate"
                      type="date"
                      value={requiredByDate}
                      onChange={(e) => setRequiredByDate(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Request Details */}
            <Card>
              <CardHeader>
                <CardTitle>Request Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="purpose">Purpose *</Label>
                  <Textarea
                    id="purpose"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    placeholder="Describe the purpose of this material request"
                    rows={3}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="justification">Justification</Label>
                  <Textarea
                    id="justification"
                    value={justification}
                    onChange={(e) => setJustification(e.target.value)}
                    placeholder="Provide justification for this request (optional)"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any additional notes (optional)"
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Requestor Information */}
            <Card>
              <CardHeader>
                <CardTitle>Requestor Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="department">Department</Label>
                    <Input
                      id="department"
                      value={requestedByDepartment}
                      onChange={(e) => setRequestedByDepartment(e.target.value)}
                      placeholder="e.g., Construction, Maintenance"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contactPhone">Contact Phone</Label>
                    <Input
                      id="contactPhone"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="contactEmail">Contact Email</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="contact@example.com"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Line Items */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Requested Items</CardTitle>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addLineItem}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {lineItems.map((item, index) => (
                  <div
                    key={item.id}
                    className="space-y-4 rounded-lg border p-4"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">
                        Item {index + 1}
                      </h4>
                      {lineItems.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeLineItem(item.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <Label>Description *</Label>
                        <Input
                          value={item.description}
                          onChange={(e) =>
                            updateLineItem(
                              item.id,
                              'description',
                              e.target.value
                            )
                          }
                          placeholder="Item description"
                          required
                        />
                      </div>
                      <div className="col-span-2">
                        <Label>Specifications</Label>
                        <Textarea
                          value={item.specifications}
                          onChange={(e) =>
                            updateLineItem(
                              item.id,
                              'specifications',
                              e.target.value
                            )
                          }
                          placeholder="Technical specifications (optional)"
                          rows={2}
                        />
                      </div>
                      <div>
                        <Label>Quantity *</Label>
                        <Input
                          type="number"
                          value={item.quantityRequested}
                          onChange={(e) =>
                            updateLineItem(
                              item.id,
                              'quantityRequested',
                              Number.parseFloat(e.target.value) || 0
                            )
                          }
                          min="0"
                          step="0.01"
                          required
                        />
                      </div>
                      <div>
                        <Label>Unit</Label>
                        <Input
                          value={item.unit}
                          onChange={(e) =>
                            updateLineItem(item.id, 'unit', e.target.value)
                          }
                          placeholder="pcs, kg, m, etc."
                        />
                      </div>
                      <div>
                        <Label>Estimated Cost (₹)</Label>
                        <Input
                          type="number"
                          value={item.estimatedCost}
                          onChange={(e) =>
                            updateLineItem(
                              item.id,
                              'estimatedCost',
                              Number.parseFloat(e.target.value) || 0
                            )
                          }
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <div>
                        <Label>Required By</Label>
                        <Input
                          type="date"
                          value={item.requiredByDate}
                          onChange={(e) =>
                            updateLineItem(
                              item.id,
                              'requiredByDate',
                              e.target.value
                            )
                          }
                        />
                      </div>
                      <div className="col-span-2">
                        <Label>Purpose</Label>
                        <Input
                          value={item.purpose}
                          onChange={(e) =>
                            updateLineItem(item.id, 'purpose', e.target.value)
                          }
                          placeholder="What will this item be used for?"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label>Notes</Label>
                        <Textarea
                          value={item.notes}
                          onChange={(e) =>
                            updateLineItem(item.id, 'notes', e.target.value)
                          }
                          placeholder="Additional notes (optional)"
                          rows={2}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Options */}
            <Card>
              <CardHeader>
                <CardTitle>Fulfillment Options</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="partialFulfillment"
                    checked={partialFulfillmentAllowed}
                    onChange={(e) =>
                      setPartialFulfillmentAllowed(e.target.checked)
                    }
                    className="rounded border-zinc-300"
                  />
                  <Label
                    htmlFor="partialFulfillment"
                    className="cursor-pointer"
                  >
                    Allow partial fulfillment
                  </Label>
                </div>
                <p className="mt-2 text-sm text-zinc-500">
                  If enabled, items can be fulfilled in batches rather than all
                  at once
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Request Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-600 dark:text-zinc-400">
                      Total Items
                    </span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                      {totals.items}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-600 dark:text-zinc-400">
                      Total Quantity
                    </span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                      {totals.quantity}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span className="text-zinc-900 dark:text-zinc-100">
                      Est. Total Cost
                    </span>
                    <span className="text-zinc-900 dark:text-zinc-100">
                      ₹
                      {totals.cost.toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Tips */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                <p>• Fill in all required fields marked with *</p>
                <p>
                  • Add multiple items using the &quot;Add Item&quot; button
                </p>
                <p>• Set priority based on urgency</p>
                <p>• Provide clear purpose and justification</p>
                <p>• Save as draft to continue later</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
