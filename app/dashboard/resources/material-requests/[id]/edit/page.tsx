'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { AppLayout } from "@/components/common/app-layout";
import { Plus, Trash2, Save, X, AlertCircle } from 'lucide-react';
import {
  MaterialRequestType,
  MaterialRequestStatus,
  MaterialRequestPriority,
  materialRequestTypeLabels,
  materialRequestStatusLabels,
  materialRequestPriorityLabels,
} from '@/types/resource/material-request';
import { mockMaterialRequests } from '@/components/shared/mock-data';
import { toast } from 'sonner';

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

export default function EditMaterialRequestPage() {
  const params = useParams();
  const router = useRouter();
  const requestId = parseInt(params.id as string);
  const mr = mockMaterialRequests.find(r => r.id === requestId);

  // Check if editable
  const isEditable = mr && [
    MaterialRequestStatus.draft,
    MaterialRequestStatus.submitted,
  ].includes(mr.status);

  // State
  const [requestNumber, setRequestNumber] = useState('');
  const [type, setType] = useState<MaterialRequestType>(MaterialRequestType.project);
  const [status, setStatus] = useState<MaterialRequestStatus>(MaterialRequestStatus.draft);
  const [priority, setPriority] = useState<MaterialRequestPriority>(MaterialRequestPriority.medium);
  const [requestDate, setRequestDate] = useState('');
  const [requiredByDate, setRequiredByDate] = useState('');
  const [purpose, setPurpose] = useState('');
  const [justification, setJustification] = useState('');
  const [notes, setNotes] = useState('');
  const [requestedByDepartment, setRequestedByDepartment] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [partialFulfillmentAllowed, setPartialFulfillmentAllowed] = useState(true);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);

  // Load data
  useEffect(() => {
    if (mr) {
      setRequestNumber(mr.requestNumber);
      setType(mr.type);
      setStatus(mr.status);
      setPriority(mr.priority);
      setRequestDate(format(mr.requestDate, 'yyyy-MM-dd'));
      setRequiredByDate(format(mr.requiredByDate, 'yyyy-MM-dd'));
      setPurpose(mr.purpose);
      setJustification(mr.justification || '');
      setNotes(mr.notes || '');
      setRequestedByDepartment(mr.requestedByDepartment || '');
      setContactPhone(mr.contactPhone || '');
      setContactEmail(mr.contactEmail || '');
      setPartialFulfillmentAllowed(mr.partialFulfillmentAllowed);
      
      setLineItems(mr.lineItems.map(item => ({
        id: String(item.id),
        description: item.description,
        specifications: item.specifications || '',
        quantityRequested: item.quantityRequested,
        unit: item.unit,
        estimatedCost: item.estimatedCost || 0,
        requiredByDate: item.requiredByDate ? format(item.requiredByDate, 'yyyy-MM-dd') : '',
        purpose: item.purpose || '',
        notes: item.notes || '',
      })));
    }
  }, [mr]);

  if (!mr) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Card>
            <CardContent className="text-center py-12">
              <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                Material Request Not Found
              </h3>
              <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                The material request you're trying to edit doesn't exist.
              </p>
              <Button onClick={() => router.push('/dashboard/resources/material-requests')}>
                Back to Material Requests
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  const addLineItem = () => {
    if (!isEditable) {
      toast.error('Cannot add items to approved or fulfilled requests');
      return;
    }
    setLineItems([...lineItems, {
      id: String(lineItems.length + 1),
      description: '',
      specifications: '',
      quantityRequested: 1,
      unit: 'pcs',
      estimatedCost: 0,
      requiredByDate: '',
      purpose: '',
      notes: '',
    }]);
  };

  const removeLineItem = (id: string) => {
    if (!isEditable) {
      toast.error('Cannot remove items from approved or fulfilled requests');
      return;
    }
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter(item => item.id !== id));
    } else {
      toast.error('At least one line item is required');
    }
  };

  const updateLineItem = (id: string, field: keyof LineItem, value: any) => {
    setLineItems(lineItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const calculateTotals = () => {
    const totalCost = lineItems.reduce((sum, item) => sum + item.estimatedCost, 0);
    const totalItems = lineItems.length;
    const totalQuantity = lineItems.reduce((sum, item) => sum + item.quantityRequested, 0);
    
    return { cost: totalCost, items: totalItems, quantity: totalQuantity };
  };

  const totals = calculateTotals();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isEditable) {
      toast.error('This material request cannot be edited in its current status');
      return;
    }
    
    if (!purpose.trim()) {
      toast.error('Purpose is required');
      return;
    }
    
    if (!requiredByDate) {
      toast.error('Required by date is required');
      return;
    }
    
    const hasEmptyItems = lineItems.some(item => 
      !item.description.trim() || item.quantityRequested <= 0
    );
    
    if (hasEmptyItems) {
      toast.error('All line items must have description and quantity');
      return;
    }
    
    toast.success('Material request updated successfully');
    router.push(`/dashboard/resources/material-requests/${mr.id}`);
  };

  const handleCancel = () => {
    router.push(`/dashboard/resources/material-requests/${mr.id}`);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                Edit Material Request
              </h1>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {mr.requestNumber} - Created on {format(mr.requestDate, 'MMM dd, yyyy')}
              </p>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={handleCancel}>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button type="submit" disabled={!isEditable}>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </div>
          </div>

          {/* Warning for non-editable */}
          {!isEditable && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-900 dark:text-red-100">Cannot Edit</h4>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                    This request is {materialRequestStatusLabels[mr.status]} and cannot be edited.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Main Content Grid */}
          <div className="grid gap-6 md:grid-cols-3">
            {/* Left Column */}
            <div className="md:col-span-2 space-y-6">
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
                        disabled={!isEditable}
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
                        disabled={!isEditable}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="type">Request Type</Label>
                      <Select value={type} onValueChange={(value) => setType(value as MaterialRequestType)} disabled={!isEditable}>
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
                      <Select value={priority} onValueChange={(value) => setPriority(value as MaterialRequestPriority)}>
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
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="notes">Additional Notes</Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
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
                      />
                    </div>
                    <div>
                      <Label htmlFor="contactPhone">Contact Phone</Label>
                      <Input
                        id="contactPhone"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="contactEmail">Contact Email</Label>
                      <Input
                        id="contactEmail"
                        type="email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
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
                    {isEditable && (
                      <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Item
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {lineItems.map((item, index) => (
                    <div key={item.id} className="border rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">
                          Item {index + 1}
                        </h4>
                        {isEditable && lineItems.length > 1 && (
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
                            onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                            disabled={!isEditable}
                            required
                          />
                        </div>
                        <div className="col-span-2">
                          <Label>Specifications</Label>
                          <Textarea
                            value={item.specifications}
                            onChange={(e) => updateLineItem(item.id, 'specifications', e.target.value)}
                            disabled={!isEditable}
                            rows={2}
                          />
                        </div>
                        <div>
                          <Label>Quantity *</Label>
                          <Input
                            type="number"
                            value={item.quantityRequested}
                            onChange={(e) => updateLineItem(item.id, 'quantityRequested', parseFloat(e.target.value) || 0)}
                            disabled={!isEditable}
                            min="0"
                            step="0.01"
                            required
                          />
                        </div>
                        <div>
                          <Label>Unit</Label>
                          <Input
                            value={item.unit}
                            onChange={(e) => updateLineItem(item.id, 'unit', e.target.value)}
                            disabled={!isEditable}
                          />
                        </div>
                        <div>
                          <Label>Estimated Cost (₹)</Label>
                          <Input
                            type="number"
                            value={item.estimatedCost}
                            onChange={(e) => updateLineItem(item.id, 'estimatedCost', parseFloat(e.target.value) || 0)}
                            min="0"
                            step="0.01"
                          />
                        </div>
                        <div>
                          <Label>Required By</Label>
                          <Input
                            type="date"
                            value={item.requiredByDate}
                            onChange={(e) => updateLineItem(item.id, 'requiredByDate', e.target.value)}
                          />
                        </div>
                        <div className="col-span-2">
                          <Label>Purpose</Label>
                          <Input
                            value={item.purpose}
                            onChange={(e) => updateLineItem(item.id, 'purpose', e.target.value)}
                          />
                        </div>
                        <div className="col-span-2">
                          <Label>Notes</Label>
                          <Textarea
                            value={item.notes}
                            onChange={(e) => updateLineItem(item.id, 'notes', e.target.value)}
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
                      onChange={(e) => setPartialFulfillmentAllowed(e.target.checked)}
                      disabled={!isEditable}
                      className="rounded border-zinc-300"
                    />
                    <Label htmlFor="partialFulfillment" className="cursor-pointer">
                      Allow partial fulfillment
                    </Label>
                  </div>
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
                      <span className="text-zinc-600 dark:text-zinc-400">Total Items</span>
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">
                        {totals.items}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-600 dark:text-zinc-400">Total Quantity</span>
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">
                        {totals.quantity}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span className="text-zinc-900 dark:text-zinc-100">Est. Total Cost</span>
                      <span className="text-zinc-900 dark:text-zinc-100">
                        ₹{totals.cost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
