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
import { AppLayout } from '@/components/common/app-layout';
import { Plus, Trash2, Save, X } from 'lucide-react';
import {
  PurchaseOrderType,
  PurchaseOrderStatus,
  DeliveryStatus,
  purchaseOrderTypeLabels,
  purchaseOrderStatusLabels,
  deliveryStatusLabels,
} from '@/types/resource/purchase-order';
import { toast } from 'sonner';

interface LineItem {
  id: string;
  description: string;
  specifications: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  taxRate: number;
  discount: number;
  notes: string;
}

export default function CreatePurchaseOrderPage() {
  const router = useRouter();

  // Basic Information
  const [poNumber, setPoNumber] = useState(
    () =>
      `PO-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`
  );
  const [type, setType] = useState<PurchaseOrderType>(
    PurchaseOrderType.materials
  );
  const [status, setStatus] = useState<PurchaseOrderStatus>(
    PurchaseOrderStatus.draft
  );
  const [deliveryStatus, setDeliveryStatus] = useState<DeliveryStatus>(
    DeliveryStatus.pending
  );
  const [poDate, setPoDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  // Vendor Information
  const [vendorName, setVendorName] = useState('');
  const [vendorContactPerson, setVendorContactPerson] = useState('');
  const [vendorPhone, setVendorPhone] = useState('');
  const [vendorEmail, setVendorEmail] = useState('');
  const [vendorAddress, setVendorAddress] = useState('');
  const [vendorGstNumber, setVendorGstNumber] = useState('');

  // Line Items
  const [lineItems, setLineItems] = useState<LineItem[]>([
    {
      id: '1',
      description: '',
      specifications: '',
      quantity: 1,
      unit: 'pcs',
      unitPrice: 0,
      taxRate: 18,
      discount: 0,
      notes: '',
    },
  ]);

  // Delivery Information
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [qualityCheckRequired, setQualityCheckRequired] = useState(false);

  // Payment Information
  const [paymentTerms, setPaymentTerms] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [advancePaymentRequired, setAdvancePaymentRequired] = useState(false);
  const [advancePaymentPercentage, setAdvancePaymentPercentage] = useState(0);

  // Additional
  const [shippingCost, setShippingCost] = useState(0);
  const [otherCharges, setOtherCharges] = useState(0);
  const [internalNotes, setInternalNotes] = useState('');
  const [termsAndConditions, setTermsAndConditions] = useState('');

  // Add new line item
  const addLineItem = () => {
    const newItem: LineItem = {
      id: String(lineItems.length + 1),
      description: '',
      specifications: '',
      quantity: 1,
      unit: 'pcs',
      unitPrice: 0,
      taxRate: 18,
      discount: 0,
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

  // Calculate line item total
  const calculateLineItemTotal = (item: LineItem) => {
    const subtotal = item.quantity * item.unitPrice;
    const discountAmount = subtotal * (item.discount / 100);
    const afterDiscount = subtotal - discountAmount;
    const taxAmount = afterDiscount * (item.taxRate / 100);
    return afterDiscount + taxAmount;
  };

  // Calculate overall totals
  const calculateTotals = () => {
    let itemsSubtotal = 0;
    for (const item of lineItems) {
      itemsSubtotal += item.quantity * item.unitPrice;
    }

    let totalDiscount = 0;
    for (const item of lineItems) {
      const subtotal = item.quantity * item.unitPrice;
      totalDiscount += subtotal * (item.discount / 100);
    }

    const afterDiscount = itemsSubtotal - totalDiscount;

    let totalTax = 0;
    for (const item of lineItems) {
      const subtotal = item.quantity * item.unitPrice;
      const discountAmount = subtotal * (item.discount / 100);
      const afterDiscount = subtotal - discountAmount;
      totalTax += afterDiscount * (item.taxRate / 100);
    }

    const grandTotal = afterDiscount + totalTax + shippingCost + otherCharges;

    return {
      subtotal: itemsSubtotal,
      discount: totalDiscount,
      tax: totalTax,
      shipping: shippingCost,
      other: otherCharges,
      total: grandTotal,
      advanceAmount: advancePaymentRequired
        ? (grandTotal * advancePaymentPercentage) / 100
        : 0,
    };
  };

  const totals = calculateTotals();

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!vendorName.trim()) {
      toast.error('Vendor name is required');
      return;
    }

    if (!deliveryAddress.trim()) {
      toast.error('Delivery address is required');
      return;
    }

    const hasEmptyItems = lineItems.some(
      (item) =>
        !item.description.trim() || item.quantity <= 0 || item.unitPrice <= 0
    );
    if (hasEmptyItems) {
      toast.error(
        'All line items must have description, quantity, and unit price'
      );
      return;
    }

    toast.success('Purchase order created successfully');
    router.push('/dashboard/resources/purchase-orders');
  };

  const handleCancel = () => {
    router.push('/dashboard/resources/purchase-orders');
  };

  return (
    <AppLayout>
      <div className="space-y-4 sm:space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Header */}
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                Create Purchase Order
              </h1>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Fill in the details below to create a new purchase order
              </p>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={handleCancel}>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button type="submit">
                <Save className="mr-2 h-4 w-4" />
                Create PO
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
                      <Label htmlFor="poNumber">PO Number</Label>
                      <Input
                        id="poNumber"
                        value={poNumber}
                        onChange={(e) => setPoNumber(e.target.value)}
                        placeholder="PO-2024-001"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="poDate">PO Date</Label>
                      <Input
                        id="poDate"
                        type="date"
                        value={poDate}
                        onChange={(e) => setPoDate(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="type">Type</Label>
                      <Select
                        value={type}
                        onValueChange={(value) =>
                          setType(value as PurchaseOrderType)
                        }
                      >
                        <SelectTrigger id="type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(PurchaseOrderType).map((t) => (
                            <SelectItem key={t} value={t}>
                              {purchaseOrderTypeLabels[t]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={status}
                        onValueChange={(value) =>
                          setStatus(value as PurchaseOrderStatus)
                        }
                      >
                        <SelectTrigger id="status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(PurchaseOrderStatus).map((s) => (
                            <SelectItem key={s} value={s}>
                              {purchaseOrderStatusLabels[s]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Vendor Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Vendor Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label htmlFor="vendorName">Vendor Name *</Label>
                      <Input
                        id="vendorName"
                        value={vendorName}
                        onChange={(e) => setVendorName(e.target.value)}
                        placeholder="ABC Suppliers Ltd."
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="vendorContactPerson">
                        Contact Person
                      </Label>
                      <Input
                        id="vendorContactPerson"
                        value={vendorContactPerson}
                        onChange={(e) => setVendorContactPerson(e.target.value)}
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <Label htmlFor="vendorPhone">Phone</Label>
                      <Input
                        id="vendorPhone"
                        value={vendorPhone}
                        onChange={(e) => setVendorPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                      />
                    </div>
                    <div>
                      <Label htmlFor="vendorEmail">Email</Label>
                      <Input
                        id="vendorEmail"
                        type="email"
                        value={vendorEmail}
                        onChange={(e) => setVendorEmail(e.target.value)}
                        placeholder="vendor@example.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="vendorGstNumber">GST Number</Label>
                      <Input
                        id="vendorGstNumber"
                        value={vendorGstNumber}
                        onChange={(e) => setVendorGstNumber(e.target.value)}
                        placeholder="29ABCDE1234F1Z5"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="vendorAddress">Address</Label>
                      <Textarea
                        id="vendorAddress"
                        value={vendorAddress}
                        onChange={(e) => setVendorAddress(e.target.value)}
                        placeholder="Enter vendor address"
                        rows={2}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Line Items */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Order Items</CardTitle>
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
                          <p className="mt-2 text-sm text-zinc-500 italic">
                            Description: &quot;{item.description}&quot;
                          </p>
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
                            value={item.quantity}
                            onChange={(e) =>
                              updateLineItem(
                                item.id,
                                'quantity',
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
                          <Label>Unit Price (₹) *</Label>
                          <Input
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) =>
                              updateLineItem(
                                item.id,
                                'unitPrice',
                                Number.parseFloat(e.target.value) || 0
                              )
                            }
                            min="0"
                            step="0.01"
                            required
                          />
                        </div>
                        <div>
                          <Label>Tax Rate (%)</Label>
                          <Input
                            type="number"
                            value={item.taxRate}
                            onChange={(e) =>
                              updateLineItem(
                                item.id,
                                'taxRate',
                                Number.parseFloat(e.target.value) || 0
                              )
                            }
                            min="0"
                            max="100"
                            step="0.01"
                          />
                        </div>
                        <div>
                          <Label>Discount (%)</Label>
                          <Input
                            type="number"
                            value={item.discount}
                            onChange={(e) =>
                              updateLineItem(
                                item.id,
                                'discount',
                                Number.parseFloat(e.target.value) || 0
                              )
                            }
                            min="0"
                            max="100"
                            step="0.01"
                          />
                        </div>
                        <div>
                          <Label>Item Total</Label>
                          <Input
                            value={`₹${calculateLineItemTotal(item).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                            disabled
                            className="bg-zinc-50 dark:bg-zinc-900"
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

              {/* Delivery Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Delivery Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="deliveryAddress">Delivery Address *</Label>
                    <Textarea
                      id="deliveryAddress"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="Enter delivery address"
                      rows={3}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="expectedDeliveryDate">
                        Expected Delivery Date
                      </Label>
                      <Input
                        id="expectedDeliveryDate"
                        type="date"
                        value={expectedDeliveryDate}
                        onChange={(e) =>
                          setExpectedDeliveryDate(e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="deliveryStatus">Delivery Status</Label>
                      <Select
                        value={deliveryStatus}
                        onValueChange={(value) =>
                          setDeliveryStatus(value as DeliveryStatus)
                        }
                      >
                        <SelectTrigger id="deliveryStatus">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(DeliveryStatus).map((ds) => (
                            <SelectItem key={ds} value={ds}>
                              {deliveryStatusLabels[ds]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="qualityCheckRequired"
                      checked={qualityCheckRequired}
                      onChange={(e) =>
                        setQualityCheckRequired(e.target.checked)
                      }
                      className="rounded border-zinc-300"
                    />
                    <Label
                      htmlFor="qualityCheckRequired"
                      className="cursor-pointer"
                    >
                      Quality check required upon delivery
                    </Label>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Payment Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="paymentTerms">Payment Terms</Label>
                      <Select
                        value={paymentTerms}
                        onValueChange={setPaymentTerms}
                      >
                        <SelectTrigger id="paymentTerms">
                          <SelectValue placeholder="Select payment terms" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="net_30">Net 30 Days</SelectItem>
                          <SelectItem value="net_60">Net 60 Days</SelectItem>
                          <SelectItem value="net_90">Net 90 Days</SelectItem>
                          <SelectItem value="advance">
                            Advance Payment
                          </SelectItem>
                          <SelectItem value="on_delivery">
                            Payment on Delivery
                          </SelectItem>
                          <SelectItem value="partial">
                            Partial Payment
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="paymentMethod">Payment Method</Label>
                      <Select
                        value={paymentMethod}
                        onValueChange={setPaymentMethod}
                      >
                        <SelectTrigger id="paymentMethod">
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bank_transfer">
                            Bank Transfer
                          </SelectItem>
                          <SelectItem value="cheque">Cheque</SelectItem>
                          <SelectItem value="credit_card">
                            Credit Card
                          </SelectItem>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="letter_of_credit">
                            Letter of Credit
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="advancePaymentRequired"
                      checked={advancePaymentRequired}
                      onChange={(e) =>
                        setAdvancePaymentRequired(e.target.checked)
                      }
                      className="rounded border-zinc-300"
                    />
                    <Label
                      htmlFor="advancePaymentRequired"
                      className="cursor-pointer"
                    >
                      Advance payment required
                    </Label>
                  </div>

                  {advancePaymentRequired && (
                    <div>
                      <Label htmlFor="advancePaymentPercentage">
                        Advance Payment Percentage (%)
                      </Label>
                      <Input
                        id="advancePaymentPercentage"
                        type="number"
                        value={advancePaymentPercentage}
                        onChange={(e) =>
                          setAdvancePaymentPercentage(
                            Number.parseFloat(e.target.value) || 0
                          )
                        }
                        min="0"
                        max="100"
                        step="1"
                      />
                      <p className="mt-1 text-sm text-zinc-500">
                        Advance Amount: ₹
                        {totals.advanceAmount.toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
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
                  <div>
                    <Label htmlFor="internalNotes">Internal Notes</Label>
                    <Textarea
                      id="internalNotes"
                      value={internalNotes}
                      onChange={(e) => setInternalNotes(e.target.value)}
                      placeholder="Notes for internal use only (not visible to vendor)"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="termsAndConditions">
                      Terms and Conditions
                    </Label>
                    <Textarea
                      id="termsAndConditions"
                      value={termsAndConditions}
                      onChange={(e) => setTermsAndConditions(e.target.value)}
                      placeholder="Enter terms and conditions for this purchase order"
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-6">
              {/* Financial Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Financial Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-zinc-600 dark:text-zinc-400">
                        Subtotal
                      </span>
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">
                        ₹
                        {totals.subtotal.toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    {totals.discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount</span>
                        <span>
                          -₹
                          {totals.discount.toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-zinc-600 dark:text-zinc-400">
                        Tax Amount
                      </span>
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">
                        ₹
                        {totals.tax.toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div>
                      <Label htmlFor="shippingCost">Shipping Cost (₹)</Label>
                      <Input
                        id="shippingCost"
                        type="number"
                        value={shippingCost}
                        onChange={(e) =>
                          setShippingCost(
                            Number.parseFloat(e.target.value) || 0
                          )
                        }
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <Label htmlFor="otherCharges">Other Charges (₹)</Label>
                      <Input
                        id="otherCharges"
                        type="number"
                        value={otherCharges}
                        onChange={(e) =>
                          setOtherCharges(
                            Number.parseFloat(e.target.value) || 0
                          )
                        }
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-between text-lg font-bold">
                    <span className="text-zinc-900 dark:text-zinc-100">
                      Total Amount
                    </span>
                    <span className="text-zinc-900 dark:text-zinc-100">
                      ₹
                      {totals.total.toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>

                  {advancePaymentRequired && totals.advanceAmount > 0 && (
                    <>
                      <Separator />
                      <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 dark:border-orange-800 dark:bg-orange-900/20">
                        <p className="text-sm font-medium text-orange-900 dark:text-orange-100">
                          Advance Payment
                        </p>
                        <p className="text-lg font-bold text-orange-900 dark:text-orange-100">
                          ₹
                          {totals.advanceAmount.toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                          })}
                        </p>
                        <p className="text-xs text-orange-700 dark:text-orange-300">
                          {advancePaymentPercentage}% of total amount
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Tips</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                  <p>• Fill in all required fields marked with *</p>
                  <p>
                    • Add multiple line items using the &quot;Add Item&quot;
                    button
                  </p>
                  <p>• Tax and totals are calculated automatically</p>
                  <p>• Save as draft to continue later</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
