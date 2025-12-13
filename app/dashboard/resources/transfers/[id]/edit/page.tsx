'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { AppLayout } from '@/components/common/app-layout';
import {
  Plus,
  Trash2,
  Save,
  AlertCircle,
} from 'lucide-react';
import {
  Transfer,
  TransferType,
  TransferPriority,
  transferTypeLabels,
  transferPriorityLabels,
} from '@/types/resource/transfer';
import { mockTransfers } from '@/components/shared/mock-data';
import { toast } from 'sonner';

interface LineItem {
  id: number;
  description: string;
  specifications: string;
  quantityRequested: number;
  unit: string;
  unitValue: number;
  notes: string;
}

export default function EditTransferPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  
  const [transfer, setTransfer] = useState<Transfer | null>(null);
  const [loading, setLoading] = useState(true);

  // Basic Information
  const [transferDate, setTransferDate] = useState('');
  const [transferType, setTransferType] = useState<TransferType>(TransferType.locationToLocation);
  const [priority, setPriority] = useState<TransferPriority>(TransferPriority.medium);
  const [scheduledDate, setScheduledDate] = useState('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  
  // Transfer Details
  const [purpose, setPurpose] = useState('');
  const [notes, setNotes] = useState('');
  
  // Location/Project Information
  const [sourceLocationId, setSourceLocationId] = useState('');
  const [destinationLocationId, setDestinationLocationId] = useState('');
  
  // Transport Details
  const [transportMethod, setTransportMethod] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [transportCost, setTransportCost] = useState('');
  
  // Temporary Transfer
  const [isTemporary, setIsTemporary] = useState(false);
  const [expectedReturnDate, setExpectedReturnDate] = useState('');
  
  // Line Items
  const [lineItems, setLineItems] = useState<LineItem[]>([]);

  useEffect(() => {
    // Simulate API call
    const foundTransfer = mockTransfers.find((t) => t.id === Number.parseInt(id));
    
    if (foundTransfer) {
      setTransfer(foundTransfer);
      
      // Populate form fields
      setTransferDate(format(foundTransfer.requestDate, 'yyyy-MM-dd'));
      setTransferType(foundTransfer.type);
      setPriority(foundTransfer.priority);
      setScheduledDate(foundTransfer.scheduledDate ? format(foundTransfer.scheduledDate, 'yyyy-MM-dd') : '');
      setExpectedDeliveryDate(foundTransfer.expectedDeliveryDate ? format(foundTransfer.expectedDeliveryDate, 'yyyy-MM-dd') : '');
      setPurpose(foundTransfer.purpose);
      setNotes(foundTransfer.notes || '');
      setSourceLocationId(foundTransfer.sourceLocationId.toString());
      setDestinationLocationId(foundTransfer.destinationLocationId.toString());
      
      // Transport details
      setTransportMethod(foundTransfer.transportMethod || '');
      setVehicleNumber(foundTransfer.vehicleNumber || '');
      setDriverName(foundTransfer.driverName || '');
      setDriverPhone(foundTransfer.driverPhone || '');
      setTransportCost(foundTransfer.transportCost?.toString() || '');
      
      // Temporary transfer
      setIsTemporary(foundTransfer.isTemporary || false);
      setExpectedReturnDate(
        foundTransfer.expectedReturnDate 
          ? format(foundTransfer.expectedReturnDate, 'yyyy-MM-dd') 
          : ''
      );
      
      // Line items
      const items: LineItem[] = foundTransfer.lineItems.map((item, index) => ({
        id: index + 1,
        description: item.description,
        specifications: '',
        quantityRequested: item.quantityRequested,
        unit: item.unit,
        unitValue: item.unitValue,
        notes: item.notes || '',
      }));
      setLineItems(items);
    }
    
    setLoading(false);
  }, [id]);

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      {
        id: lineItems.length + 1,
        description: '',
        specifications: '',
        quantityRequested: 0,
        unit: 'pcs',
        unitValue: 0,
        notes: '',
      },
    ]);
  };

  const removeLineItem = (itemId: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((item) => item.id !== itemId));
    }
  };

  const updateLineItem = (itemId: number, field: keyof LineItem, value: any) => {
    setLineItems(
      lineItems.map((item) =>
        item.id === itemId ? { ...item, [field]: value } : item
      )
    );
  };

  const calculateTotals = () => {
    const totalItems = lineItems.length;
    const totalQuantity = lineItems.reduce((sum, item) => sum + (item.quantityRequested || 0), 0);
    const totalValue = lineItems.reduce(
      (sum, item) => sum + (item.quantityRequested || 0) * (item.unitValue || 0),
      0
    );
    return { totalItems, totalQuantity, totalValue };
  };

  const handleSubmit = () => {
    // Validation
    if (!purpose.trim()) {
      toast.error('Please enter a purpose for this transfer');
      return;
    }

    if (!sourceLocationId || !destinationLocationId) {
      toast.error('Please select both source and destination locations');
      return;
    }

    const hasInvalidItems = lineItems.some(
      (item) => !item.description.trim() || item.quantityRequested <= 0
    );

    if (hasInvalidItems) {
      toast.error('Please ensure all items have a description and quantity greater than 0');
      return;
    }

    toast.success('Transfer updated successfully');
    router.push(`/dashboard/resources/transfers/${id}`);
  };

  const handleCancel = () => {
    router.push(`/dashboard/resources/transfers/${id}`);
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-6 max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-96">
            <div className="text-zinc-500 dark:text-zinc-400">Loading transfer...</div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!transfer) {
    return (
      <AppLayout>
        <div className="space-y-6 max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center h-96 gap-4">
            <AlertCircle className="h-12 w-12 text-zinc-400 dark:text-zinc-600" />
            <div className="text-zinc-500 dark:text-zinc-400">Transfer not found</div>
          </div>
        </div>
      </AppLayout>
    );
  }

  const { totalItems, totalQuantity, totalValue } = calculateTotals();

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                Edit Transfer
              </h1>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                {transfer.transferNumber} • Created {format(transfer.createdAt, 'PPP')}
              </p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>General transfer details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="transferNumber">Transfer Number</Label>
                    <Input id="transferNumber" value={transfer.transferNumber} disabled />
                  </div>

                  <div>
                    <Label htmlFor="transferDate">Transfer Date</Label>
                    <Input
                      id="transferDate"
                      type="date"
                      value={transferDate}
                      onChange={(e) => setTransferDate(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="transferType">Transfer Type *</Label>
                    <Select value={transferType} onValueChange={(value) => setTransferType(value as TransferType)}>
                      <SelectTrigger id="transferType">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(TransferType).map((type) => (
                          <SelectItem key={type} value={type}>
                            {transferTypeLabels[type]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="priority">Priority *</Label>
                    <Select value={priority} onValueChange={(value) => setPriority(value as TransferPriority)}>
                      <SelectTrigger id="priority">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(TransferPriority).map((p) => (
                          <SelectItem key={p} value={p}>
                            {transferPriorityLabels[p]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="scheduledDate">Scheduled Date</Label>
                    <Input
                      id="scheduledDate"
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="expectedDeliveryDate">Expected Delivery Date</Label>
                    <Input
                      id="expectedDeliveryDate"
                      type="date"
                      value={expectedDeliveryDate}
                      onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Transfer Details */}
            <Card>
              <CardHeader>
                <CardTitle>Transfer Details</CardTitle>
                <CardDescription>Purpose and additional information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="purpose">Purpose *</Label>
                  <Textarea
                    id="purpose"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    placeholder="Describe the purpose of this transfer..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any additional notes or instructions..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Location Information */}
            <Card>
              <CardHeader>
                <CardTitle>Location Information</CardTitle>
                <CardDescription>Source and destination details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="sourceLocation">Source Location *</Label>
                    <Select value={sourceLocationId} onValueChange={setSourceLocationId}>
                      <SelectTrigger id="sourceLocation">
                        <SelectValue placeholder="Select source location" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Warehouse A</SelectItem>
                        <SelectItem value="2">Warehouse B</SelectItem>
                        <SelectItem value="3">Site A - Building Project</SelectItem>
                        <SelectItem value="4">Site B - Bridge Construction</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="destinationLocation">Destination Location *</Label>
                    <Select value={destinationLocationId} onValueChange={setDestinationLocationId}>
                      <SelectTrigger id="destinationLocation">
                        <SelectValue placeholder="Select destination location" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Warehouse A</SelectItem>
                        <SelectItem value="2">Warehouse B</SelectItem>
                        <SelectItem value="3">Site A - Building Project</SelectItem>
                        <SelectItem value="4">Site B - Bridge Construction</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Transport Details */}
            <Card>
              <CardHeader>
                <CardTitle>Transport Details</CardTitle>
                <CardDescription>Vehicle and driver information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="transportMethod">Transport Method</Label>
                    <Select value={transportMethod} onValueChange={setTransportMethod}>
                      <SelectTrigger id="transportMethod">
                        <SelectValue placeholder="Select transport method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Truck">Truck</SelectItem>
                        <SelectItem value="Van">Van</SelectItem>
                        <SelectItem value="Pickup">Pickup</SelectItem>
                        <SelectItem value="Internal">Internal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="vehicleNumber">Vehicle Number</Label>
                    <Input
                      id="vehicleNumber"
                      value={vehicleNumber}
                      onChange={(e) => setVehicleNumber(e.target.value)}
                      placeholder="e.g., KA-01-AB-1234"
                    />
                  </div>

                  <div>
                    <Label htmlFor="driverName">Driver Name</Label>
                    <Input
                      id="driverName"
                      value={driverName}
                      onChange={(e) => setDriverName(e.target.value)}
                      placeholder="Driver's full name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="driverPhone">Driver Phone</Label>
                    <Input
                      id="driverPhone"
                      value={driverPhone}
                      onChange={(e) => setDriverPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                    />
                  </div>

                  <div>
                    <Label htmlFor="transportCost">Transport Cost (₹)</Label>
                    <Input
                      id="transportCost"
                      type="number"
                      value={transportCost}
                      onChange={(e) => setTransportCost(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Temporary Transfer */}
            <Card>
              <CardHeader>
                <CardTitle>Temporary Transfer</CardTitle>
                <CardDescription>If this is a temporary transfer (loan)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isTemporary"
                    checked={isTemporary}
                    onChange={(e) => setIsTemporary(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="isTemporary" className="cursor-pointer">
                    This is a temporary transfer
                  </Label>
                </div>

                {isTemporary && (
                  <div>
                    <Label htmlFor="expectedReturnDate">Expected Return Date</Label>
                    <Input
                      id="expectedReturnDate"
                      type="date"
                      value={expectedReturnDate}
                      onChange={(e) => setExpectedReturnDate(e.target.value)}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Transfer Items */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Transfer Items</CardTitle>
                    <CardDescription>Items to be transferred</CardDescription>
                  </div>
                  <Button onClick={addLineItem} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {lineItems.map((item, index) => (
                  <div key={item.id} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">
                        Item #{index + 1}
                      </h4>
                      {lineItems.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeLineItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <Label>Description *</Label>
                        <Input
                          value={item.description}
                          onChange={(e) =>
                            updateLineItem(item.id, 'description', e.target.value)
                          }
                          placeholder="Item description"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <Label>Specifications</Label>
                        <Textarea
                          value={item.specifications}
                          onChange={(e) =>
                            updateLineItem(item.id, 'specifications', e.target.value)
                          }
                          placeholder="Technical specifications, dimensions, etc."
                          rows={2}
                        />
                      </div>

                      <div>
                        <Label>Quantity *</Label>
                        <Input
                          type="number"
                          value={item.quantityRequested || ''}
                          onChange={(e) =>
                            updateLineItem(item.id, 'quantityRequested', Number.parseFloat(e.target.value) || 0)
                          }
                          placeholder="0"
                          min="0"
                        />
                      </div>

                      <div>
                        <Label>Unit</Label>
                        <Select
                          value={item.unit}
                          onValueChange={(value) => updateLineItem(item.id, 'unit', value)}
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

                      <div className="sm:col-span-2">
                        <Label>Unit Value (₹)</Label>
                        <Input
                          type="number"
                          value={item.unitValue || ''}
                          onChange={(e) =>
                            updateLineItem(item.id, 'unitValue', Number.parseFloat(e.target.value) || 0)
                          }
                          placeholder="0"
                          min="0"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <Label>Notes</Label>
                        <Textarea
                          value={item.notes}
                          onChange={(e) =>
                            updateLineItem(item.id, 'notes', e.target.value)
                          }
                          placeholder="Any additional notes for this item..."
                          rows={2}
                        />
                      </div>
                    </div>

                    <Separator />

                    <div className="flex justify-between items-center text-sm">
                      <span className="text-zinc-500 dark:text-zinc-400">Item Total:</span>
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                        ₹{((item.quantityRequested || 0) * (item.unitValue || 0)).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
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
                  <span className="text-zinc-500 dark:text-zinc-400">Total Items:</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {totalItems}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500 dark:text-zinc-400">Total Quantity:</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {totalQuantity}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-zinc-500 dark:text-zinc-400">Total Value:</span>
                  <span className="font-bold text-lg text-zinc-900 dark:text-zinc-100">
                    ₹{(totalValue / 100_000).toFixed(2)}L
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Quick Tips
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                <p>• Changes will be saved immediately</p>
                <p>• Ensure all required fields are filled</p>
                <p>• Transport details can be updated later</p>
                <p>• Add notes for any special handling requirements</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
