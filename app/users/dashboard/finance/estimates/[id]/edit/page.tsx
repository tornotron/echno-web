'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { logger } from '@/lib/logger';
import { format } from 'date-fns';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AppLayout } from '@/components/common/app-layout';
import {
  Plus,
  Trash2,
  Save,
  AlertCircle,
  Calculator,
  FileText,
  DollarSign,
} from 'lucide-react';
import {
  EstimateCategory,
  EstimateStatus,
  estimateCategoryLabels,
  calculateEstimateTotal,
  Estimate,
} from '@/types/finance/estimate';
import { toast } from 'sonner';

interface EstimateLineItem {
  id: number;
  category: string;
  description: string;
  specifications: string;
  quantity: number;
  unit: string;
  unitRate: number;
  laborCost: number;
  materialCost: number;
  equipmentCost: number;
  notes: string;
}

// Mock function to fetch estimate - replace with actual API call
const fetchEstimate = async (): Promise<Estimate | null> => {
  // Simulate API call
  return {
    id: 1,
    estimateNumber: 'EST-2024-0001',
    title: 'Residential Building Construction',
    status: EstimateStatus.draft,
    category: EstimateCategory.construction,
    clientName: 'John Doe',
    clientEmail: 'john.doe@example.com',
    clientPhone: '+91 98765 43210',
    clientAddress: '123 Main Street, Mumbai',
    projectLocation: 'Plot No. 456, Andheri East, Mumbai',
    projectDescription: 'Construction of 4-storey residential building',
    scope: 'Complete construction including civil, electrical, plumbing',
    assumptions: 'Client will provide approvals',
    exclusions: 'Furniture not included',
    estimatedStartDate: new Date('2024-12-01'),
    estimatedEndDate: new Date('2025-11-30'),
    estimatedDuration: 365,
    lineItems: [
      {
        id: 1,
        category: 'Materials',
        description: 'Cement, Sand, Aggregate',
        specifications: 'Grade M25',
        quantity: 500,
        unit: 'cum',
        unitRate: 8500,
        laborCost: 200_000,
        materialCost: 4_050_000,
        equipmentCost: 0,
        overhead: 10,
        profit: 15,
        subtotal: 4_250_000,
        total: 4_890_625,
      },
    ],
    materialCost: 4_050_000,
    laborCost: 1_000_000,
    equipmentCost: 50_000,
    subcontractorCost: 0,
    overheadCost: 510_000,
    profitMargin: 765_000,
    subtotal: 5_375_000,
    contingency: 10,
    contingencyAmount: 537_500,
    taxRate: 18,
    taxAmount: 1_064_250,
    totalAmount: 6_976_750,
    paymentTerms: '30% advance, 40% on structure, 30% on completion',
    advancePayment: 30,
    termsAndConditions: 'All work as per approved drawings',
    warrantyTerms: '1 year defect liability',
    notes: 'Price valid for 30 days',
    preparedDate: new Date('2024-11-01'),
    validityPeriod: 30,
    expiryDate: new Date('2024-12-01'),
    preparedBy: 1,
    createdBy: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
  };
};

export default function EditEstimatePage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [estimateToEdit, setEstimateToEdit] = useState<Estimate | null>(null);
  const [estimateNumber, setEstimateNumber] = useState('');

  // Basic Information
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<EstimateCategory>(
    EstimateCategory.construction
  );
  const [preparedDate, setPreparedDate] = useState(
    format(new Date(), 'yyyy-MM-dd')
  );
  const [validityPeriod, setValidityPeriod] = useState('30');

  // Client Information
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientAddress, setClientAddress] = useState('');

  // Project Details
  const [projectLocation, setProjectLocation] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [scope, setScope] = useState('');
  const [assumptions, setAssumptions] = useState('');
  const [exclusions, setExclusions] = useState('');

  // Timeline
  const [estimatedStartDate, setEstimatedStartDate] = useState('');
  const [estimatedEndDate, setEstimatedEndDate] = useState('');
  const [estimatedDuration, setEstimatedDuration] = useState('');

  // Cost Settings
  const [contingencyPercent, setContingencyPercent] = useState('10');
  const [taxRate, setTaxRate] = useState('18');

  // Payment Terms
  const [paymentTerms, setPaymentTerms] = useState('');
  const [advancePayment, setAdvancePayment] = useState('');

  // Additional Details
  const [termsAndConditions, setTermsAndConditions] = useState('');
  const [warrantyTerms, setWarrantyTerms] = useState('');
  const [notes, setNotes] = useState('');

  // Line Items
  const [lineItems, setLineItems] = useState<EstimateLineItem[]>([
    {
      id: 1,
      category: 'Materials',
      description: '',
      specifications: '',
      quantity: 0,
      unit: 'sqft',
      unitRate: 0,
      laborCost: 0,
      materialCost: 0,
      equipmentCost: 0,
      notes: '',
    },
  ]);

  // Load estimate data
  useEffect(() => {
    const loadEstimate = async () => {
      if (!params.id) return;

      try {
        const estimate = await fetchEstimate();

        if (!estimate) {
          toast.error('Estimate not found');
          router.push('/dashboard/finance/estimates');
          return;
        }

        setEstimateToEdit(estimate);
        setEstimateNumber(estimate.estimateNumber);
        setTitle(estimate.title);
        setCategory(estimate.category);
        setPreparedDate(format(estimate.preparedDate, 'yyyy-MM-dd'));
        setValidityPeriod(estimate.validityPeriod.toString());

        setClientName(estimate.clientName);
        setClientEmail(estimate.clientEmail || '');
        setClientPhone(estimate.clientPhone || '');
        setClientAddress(estimate.clientAddress || '');

        setProjectLocation(estimate.projectLocation);
        setProjectDescription(estimate.projectDescription);
        setScope(estimate.scope);
        setAssumptions(estimate.assumptions || '');
        setExclusions(estimate.exclusions || '');

        if (estimate.estimatedStartDate) {
          setEstimatedStartDate(
            format(estimate.estimatedStartDate, 'yyyy-MM-dd')
          );
        }
        if (estimate.estimatedEndDate) {
          setEstimatedEndDate(format(estimate.estimatedEndDate, 'yyyy-MM-dd'));
        }
        setEstimatedDuration(estimate.estimatedDuration?.toString() || '');

        setContingencyPercent(estimate.contingency.toString());
        setTaxRate(estimate.taxRate.toString());

        setPaymentTerms(estimate.paymentTerms || '');
        setAdvancePayment(estimate.advancePayment?.toString() || '');

        setTermsAndConditions(estimate.termsAndConditions || '');
        setWarrantyTerms(estimate.warrantyTerms || '');
        setNotes(estimate.notes || '');

        // Convert line items
        const convertedLineItems = estimate.lineItems.map((item) => ({
          id: item.id,
          category: item.category,
          description: item.description,
          specifications: item.specifications || '',
          quantity: item.quantity,
          unit: item.unit,
          unitRate: item.unitRate,
          laborCost: item.laborCost || 0,
          materialCost: item.materialCost || 0,
          equipmentCost: item.equipmentCost || 0,
          notes: item.notes || '',
        }));
        setLineItems(convertedLineItems);

        setLoading(false);
      } catch (error) {
        logger.error('Failed to load estimate:', error);
        toast.error('Failed to load estimate');
        router.push('/dashboard/finance/estimates');
      }
    };

    loadEstimate();
  }, [params.id, router]);

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      {
        id: lineItems.length + 1,
        category: 'Materials',
        description: '',
        specifications: '',
        quantity: 0,
        unit: 'sqft',
        unitRate: 0,
        laborCost: 0,
        materialCost: 0,
        equipmentCost: 0,
        notes: '',
      },
    ]);
  };

  const removeLineItem = (id: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((item) => item.id !== id));
    }
  };

  const updateLineItem = (
    id: number,
    field: keyof EstimateLineItem,
    value: string | number
  ) => {
    setLineItems(
      lineItems.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const calculateItemTotal = (item: EstimateLineItem) => {
    const baseTotal = item.quantity * item.unitRate;
    const componentTotal =
      item.laborCost + item.materialCost + item.equipmentCost;
    return baseTotal + componentTotal;
  };

  const calculateTotals = () => {
    const subtotal = lineItems.reduce(
      (sum, item) => sum + calculateItemTotal(item),
      0
    );
    const materialCost = lineItems.reduce(
      (sum, item) => sum + item.materialCost,
      0
    );
    const laborCost = lineItems.reduce((sum, item) => sum + item.laborCost, 0);
    const equipmentCost = lineItems.reduce(
      (sum, item) => sum + item.equipmentCost,
      0
    );

    const { contingencyAmount, taxAmount, total } = calculateEstimateTotal(
      subtotal,
      Number.parseFloat(contingencyPercent) || 0,
      Number.parseFloat(taxRate) || 0
    );

    return {
      subtotal,
      materialCost,
      laborCost,
      equipmentCost,
      contingencyAmount,
      taxAmount,
      totalAmount: total,
    };
  };

  const handleSubmit = () => {
    // Validation
    if (!title.trim()) {
      toast.error('Please enter an estimate title');
      return;
    }

    if (!clientName.trim()) {
      toast.error('Please enter client name');
      return;
    }

    if (!projectLocation.trim()) {
      toast.error('Please enter project location');
      return;
    }

    if (!projectDescription.trim()) {
      toast.error('Please enter project description');
      return;
    }

    if (!scope.trim()) {
      toast.error('Please enter scope of work');
      return;
    }

    const hasInvalidItems = lineItems.some(
      (item) =>
        !item.description.trim() || item.quantity <= 0 || item.unitRate <= 0
    );

    if (hasInvalidItems) {
      toast.error(
        'Please ensure all items have description, quantity, and unit rate'
      );
      return;
    }

    // TODO: Implement actual API call to update estimate
    logger.debug('Updating estimate...', {
      id: params.id,
      estimateNumber,
      title,
      category,
      clientName,
      clientEmail,
      clientPhone,
      clientAddress,
      projectLocation,
      projectDescription,
      scope,
      assumptions,
      exclusions,
      lineItems,
      totals: calculateTotals(),
      paymentTerms,
      advancePayment,
      termsAndConditions,
      warrantyTerms,
      notes,
    });

    toast.success('Estimate updated successfully');
    router.push(`/dashboard/finance/estimates/${params.id}`);
  };

  const handleCancel = () => {
    router.push(`/dashboard/finance/estimates/${params.id}`);
  };

  const totals = calculateTotals();

  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-4 sm:space-y-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
              <p className="text-zinc-600 dark:text-zinc-400">
                Loading estimate...
              </p>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!estimateToEdit) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-7xl space-y-4 sm:space-y-6">
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="mx-auto mb-4 h-12 w-12 text-zinc-400" />
              <h3 className="mb-2 text-lg font-medium text-zinc-900 dark:text-zinc-100">
                Estimate not found
              </h3>
              <p className="mb-4 text-zinc-600 dark:text-zinc-400">
                The estimate you&apos;re trying to edit doesn&apos;t exist or
                has been removed.
              </p>
              <Button
                onClick={() => router.push('/dashboard/finance/estimates')}
              >
                Back to Estimates
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl space-y-4 sm:space-y-6">
        {/* Header */}
        <div>
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 sm:text-3xl dark:text-zinc-100">
                Edit Construction Estimate
              </h1>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Update your construction project estimate details
              </p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>
                <Save className="mr-2 h-4 w-4" />
                Update Estimate
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
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Basic Information
                </CardTitle>
                <CardDescription>General estimate details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="estimateNumber">Estimate Number</Label>
                    <Input
                      id="estimateNumber"
                      value={estimateNumber}
                      disabled
                    />
                  </div>

                  <div>
                    <Label htmlFor="preparedDate" required>
                      Prepared Date
                    </Label>
                    <Input
                      id="preparedDate"
                      type="date"
                      value={preparedDate}
                      onChange={(e) => setPreparedDate(e.target.value)}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <Label htmlFor="title" required>
                      Estimate Title
                    </Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g., Residential Building Construction"
                    />
                  </div>

                  <div>
                    <Label htmlFor="category" required>
                      Category
                    </Label>
                    <Select
                      value={category}
                      onValueChange={(value) =>
                        setCategory(value as EstimateCategory)
                      }
                    >
                      <SelectTrigger id="category">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(EstimateCategory).map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {estimateCategoryLabels[cat]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="validityPeriod" required>
                      Validity Period (Days)
                    </Label>
                    <Input
                      id="validityPeriod"
                      type="number"
                      value={validityPeriod}
                      onChange={(e) => setValidityPeriod(e.target.value)}
                      placeholder="30"
                      min="1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Client Information */}
            <Card>
              <CardHeader>
                <CardTitle>Client Information</CardTitle>
                <CardDescription>Details about the client</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Label htmlFor="clientName" required>
                      Client Name
                    </Label>
                    <Input
                      id="clientName"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Enter client name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="clientEmail">Email</Label>
                    <Input
                      id="clientEmail"
                      type="email"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder="client@example.com"
                    />
                  </div>

                  <div>
                    <Label htmlFor="clientPhone">Phone</Label>
                    <Input
                      id="clientPhone"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <Label htmlFor="clientAddress">Address</Label>
                    <Textarea
                      id="clientAddress"
                      value={clientAddress}
                      onChange={(e) => setClientAddress(e.target.value)}
                      placeholder="Client's address"
                      rows={2}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Project Details */}
            <Card>
              <CardHeader>
                <CardTitle>Project Details</CardTitle>
                <CardDescription>
                  Information about the construction project
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="projectLocation" required>
                    Project Location
                  </Label>
                  <Input
                    id="projectLocation"
                    value={projectLocation}
                    onChange={(e) => setProjectLocation(e.target.value)}
                    placeholder="Enter project location"
                  />
                </div>

                <div>
                  <Label htmlFor="projectDescription" required>
                    Project Description
                  </Label>
                  <Textarea
                    id="projectDescription"
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    placeholder="Describe the project..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="scope">Scope of Work *</Label>
                  <Textarea
                    id="scope"
                    value={scope}
                    onChange={(e) => setScope(e.target.value)}
                    placeholder="Detailed scope of work..."
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="assumptions">Assumptions</Label>
                  <Textarea
                    id="assumptions"
                    value={assumptions}
                    onChange={(e) => setAssumptions(e.target.value)}
                    placeholder="List any assumptions made in this estimate..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="exclusions">Exclusions</Label>
                  <Textarea
                    id="exclusions"
                    value={exclusions}
                    onChange={(e) => setExclusions(e.target.value)}
                    placeholder="List what is NOT included in this estimate..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Project Timeline</CardTitle>
                <CardDescription>Estimated project schedule</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="estimatedStartDate">
                      Estimated Start Date
                    </Label>
                    <Input
                      id="estimatedStartDate"
                      type="date"
                      value={estimatedStartDate}
                      onChange={(e) => setEstimatedStartDate(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="estimatedEndDate">Estimated End Date</Label>
                    <Input
                      id="estimatedEndDate"
                      type="date"
                      value={estimatedEndDate}
                      onChange={(e) => setEstimatedEndDate(e.target.value)}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <Label htmlFor="estimatedDuration">
                      Estimated Duration (Days)
                    </Label>
                    <Input
                      id="estimatedDuration"
                      type="number"
                      value={estimatedDuration}
                      onChange={(e) => setEstimatedDuration(e.target.value)}
                      placeholder="e.g., 90"
                      min="1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Line Items */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Calculator className="h-5 w-5" />
                      Cost Items
                    </CardTitle>
                    <CardDescription>
                      Add detailed cost breakdown
                    </CardDescription>
                  </div>
                  <Button onClick={addLineItem} size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead className="min-w-[140px]">
                          Category
                        </TableHead>
                        <TableHead className="min-w-[200px]">
                          Description *
                        </TableHead>
                        <TableHead className="min-w-[200px]">
                          Specifications
                        </TableHead>
                        <TableHead className="min-w-[100px]">
                          Quantity *
                        </TableHead>
                        <TableHead className="min-w-[120px]">Unit</TableHead>
                        <TableHead className="min-w-[120px]">
                          Unit Rate (₹) *
                        </TableHead>
                        <TableHead className="min-w-[120px]">
                          Labor Cost (₹)
                        </TableHead>
                        <TableHead className="min-w-[120px]">
                          Material Cost (₹)
                        </TableHead>
                        <TableHead className="min-w-[120px]">
                          Equipment Cost (₹)
                        </TableHead>
                        <TableHead className="min-w-[150px]">Notes</TableHead>
                        <TableHead className="min-w-[120px]">Total</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lineItems.map((item, index) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            {index + 1}
                          </TableCell>
                          <TableCell>
                            <Select
                              value={item.category}
                              onValueChange={(value) =>
                                updateLineItem(item.id, 'category', value)
                              }
                            >
                              <SelectTrigger className="h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Materials">
                                  Materials
                                </SelectItem>
                                <SelectItem value="Labor">Labor</SelectItem>
                                <SelectItem value="Equipment">
                                  Equipment
                                </SelectItem>
                                <SelectItem value="Subcontractor">
                                  Subcontractor
                                </SelectItem>
                                <SelectItem value="Permits & Fees">
                                  Permits & Fees
                                </SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
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
                              className="h-9"
                            />
                          </TableCell>
                          <TableCell>
                            <Textarea
                              value={item.specifications}
                              onChange={(e) =>
                                updateLineItem(
                                  item.id,
                                  'specifications',
                                  e.target.value
                                )
                              }
                              placeholder="Specifications..."
                              rows={2}
                              className="min-h-[60px] text-xs"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={item.quantity || ''}
                              onChange={(e) =>
                                updateLineItem(
                                  item.id,
                                  'quantity',
                                  Number.parseFloat(e.target.value) || 0
                                )
                              }
                              placeholder="0"
                              min="0"
                              step="0.01"
                              className="h-9"
                            />
                          </TableCell>
                          <TableCell>
                            <Select
                              value={item.unit}
                              onValueChange={(value) =>
                                updateLineItem(item.id, 'unit', value)
                              }
                            >
                              <SelectTrigger className="h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="sqft">
                                  Square Feet
                                </SelectItem>
                                <SelectItem value="sqm">
                                  Square Meters
                                </SelectItem>
                                <SelectItem value="cft">Cubic Feet</SelectItem>
                                <SelectItem value="cum">
                                  Cubic Meters
                                </SelectItem>
                                <SelectItem value="rmt">
                                  Running Meter
                                </SelectItem>
                                <SelectItem value="kg">Kilograms</SelectItem>
                                <SelectItem value="ton">Tons</SelectItem>
                                <SelectItem value="pcs">Pieces</SelectItem>
                                <SelectItem value="nos">Numbers</SelectItem>
                                <SelectItem value="ls">Lump Sum</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={item.unitRate || ''}
                              onChange={(e) =>
                                updateLineItem(
                                  item.id,
                                  'unitRate',
                                  Number.parseFloat(e.target.value) || 0
                                )
                              }
                              placeholder="0"
                              min="0"
                              step="0.01"
                              className="h-9"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={item.laborCost || ''}
                              onChange={(e) =>
                                updateLineItem(
                                  item.id,
                                  'laborCost',
                                  Number.parseFloat(e.target.value) || 0
                                )
                              }
                              placeholder="0"
                              min="0"
                              step="0.01"
                              className="h-9"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={item.materialCost || ''}
                              onChange={(e) =>
                                updateLineItem(
                                  item.id,
                                  'materialCost',
                                  Number.parseFloat(e.target.value) || 0
                                )
                              }
                              placeholder="0"
                              min="0"
                              step="0.01"
                              className="h-9"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={item.equipmentCost || ''}
                              onChange={(e) =>
                                updateLineItem(
                                  item.id,
                                  'equipmentCost',
                                  Number.parseFloat(e.target.value) || 0
                                )
                              }
                              placeholder="0"
                              min="0"
                              step="0.01"
                              className="h-9"
                            />
                          </TableCell>
                          <TableCell>
                            <Textarea
                              value={item.notes}
                              onChange={(e) =>
                                updateLineItem(item.id, 'notes', e.target.value)
                              }
                              placeholder="Notes..."
                              rows={2}
                              className="min-h-[60px] text-xs"
                            />
                          </TableCell>
                          <TableCell>
                            <div className="font-semibold whitespace-nowrap text-zinc-900 dark:text-zinc-100">
                              ₹
                              {calculateItemTotal(item).toLocaleString(
                                'en-IN',
                                {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                }
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {lineItems.length > 1 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeLineItem(item.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Payment Terms */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Payment Terms
                </CardTitle>
                <CardDescription>Define payment structure</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="paymentTerms">Payment Terms</Label>
                  <Textarea
                    id="paymentTerms"
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    placeholder="e.g., 30% advance, 40% on completion of structure, 30% on final handover"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="advancePayment">Advance Payment (%)</Label>
                  <Input
                    id="advancePayment"
                    type="number"
                    value={advancePayment}
                    onChange={(e) => setAdvancePayment(e.target.value)}
                    placeholder="e.g., 30"
                    min="0"
                    max="100"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Terms & Conditions */}
            <Card>
              <CardHeader>
                <CardTitle>Terms & Conditions</CardTitle>
                <CardDescription>
                  Legal and warranty information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="termsAndConditions">Terms & Conditions</Label>
                  <Textarea
                    id="termsAndConditions"
                    value={termsAndConditions}
                    onChange={(e) => setTermsAndConditions(e.target.value)}
                    placeholder="Enter terms and conditions..."
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="warrantyTerms">Warranty Terms</Label>
                  <Textarea
                    id="warrantyTerms"
                    value={warrantyTerms}
                    onChange={(e) => setWarrantyTerms(e.target.value)}
                    placeholder="Enter warranty terms..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any additional notes..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Cost Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Cost Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-500 dark:text-zinc-400">
                    Material Cost:
                  </span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    ₹
                    {totals.materialCost.toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500 dark:text-zinc-400">
                    Labor Cost:
                  </span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    ₹
                    {totals.laborCost.toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500 dark:text-zinc-400">
                    Equipment Cost:
                  </span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    ₹
                    {totals.equipmentCost.toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-zinc-500 dark:text-zinc-400">
                    Subtotal:
                  </span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                    ₹
                    {totals.subtotal.toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500 dark:text-zinc-400">
                    Contingency ({contingencyPercent}%):
                  </span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    ₹
                    {totals.contingencyAmount.toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500 dark:text-zinc-400">
                    Tax ({taxRate}%):
                  </span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    ₹
                    {totals.taxAmount.toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between pt-2">
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                    Total Amount:
                  </span>
                  <span className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                    ₹
                    {totals.totalAmount.toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Cost Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Cost Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="contingencyPercent">Contingency (%)</Label>
                  <Input
                    id="contingencyPercent"
                    type="number"
                    value={contingencyPercent}
                    onChange={(e) => setContingencyPercent(e.target.value)}
                    placeholder="10"
                    min="0"
                    max="100"
                    step="0.1"
                  />
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    Buffer for unexpected costs
                  </p>
                </div>

                <div>
                  <Label htmlFor="taxRate">Tax Rate (%)</Label>
                  <Input
                    id="taxRate"
                    type="number"
                    value={taxRate}
                    onChange={(e) => setTaxRate(e.target.value)}
                    placeholder="18"
                    min="0"
                    max="100"
                    step="0.1"
                  />
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    GST or applicable tax rate
                  </p>
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
                <p>• Be detailed in scope to avoid disputes</p>
                <p>• Include all assumptions clearly</p>
                <p>• Specify what&apos;s excluded from estimate</p>
                <p>• Add contingency for unforeseen costs</p>
                <p>• Review cost breakdown before submitting</p>
                <p>• Set realistic timelines and validity period</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
