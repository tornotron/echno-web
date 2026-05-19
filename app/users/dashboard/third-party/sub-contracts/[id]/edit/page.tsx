'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
import { PhoneInput } from '@/components/shadcn/phone-input';
import { Label } from '@/components/shadcn/label';
import { Textarea } from '@/components/shadcn/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/select';
import { toast } from '@/lib/styles/toast-styles';
import {
  User,
  FileText,
  Loader2,
  Save,
  X,
  Plus,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import { PageHeader } from '@/components/common';
import Link from 'next/link';
import { useSubContract } from '@/hooks/sub-contracts';
import {
  Empty,
  EmptyErrorMedia,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from '@/components/shadcn/empty';
import type { SubContract } from '@/types/third-party/sub-contract';

interface Milestone {
  name: string;
  percentage: number;
  amount: number;
  status: string;
  date: string;
}

export default function SubContractEditPage() {
  const params = useParams();
  const isEditMode = params.id !== 'new';
  const contractId = isEditMode ? Number(params.id) : 0;
  const {
    data: subContractData,
    isLoading,
    isError,
  } = useSubContract(contractId);

  if (isEditMode && isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (isEditMode && (isError || !subContractData)) {
    return (
      <Empty variant="default">
        <EmptyErrorMedia>
          <FileText className="size-6" />
        </EmptyErrorMedia>
        <EmptyHeader>
          <EmptyTitle>Sub-contract not found</EmptyTitle>
          <EmptyDescription>
            This record may have been deleted or does not exist.
          </EmptyDescription>
        </EmptyHeader>
        <Button asChild>
          <Link href={routes.thirdParty.subContracts.href}>
            Back to Sub-Contracts
          </Link>
        </Button>
      </Empty>
    );
  }

  return (
    <SubContractEditForm
      initialData={subContractData}
      isEditMode={isEditMode}
      id={params.id as string}
    />
  );
}

interface SubContractEditFormProps {
  initialData?: SubContract;
  isEditMode: boolean;
  id: string;
}

function SubContractEditForm({
  initialData,
  isEditMode,
  id,
}: SubContractEditFormProps) {
  const router = useRouter();

  const [formData, setFormData] = useState<{
    contractId: string;
    contractorName: string;
    contactPerson: string;
    phone: string;
    email: string;
    address: string;
    status: string;
    scope: string;
    contractValue: number;
    totalPaid: number;
    totalDue: number;
    startDate: string;
    endDate: string;
    completionPercentage: number;
    gstNumber: string;
    panNumber: string;
    accountNumber: string;
    bankName: string;
    ifscCode: string;
    paymentTerms: string;
    milestones: Milestone[];
    notes: string;
  }>(() => ({
    contractId: initialData?.contractId ?? '',
    contractorName: initialData?.contractorName ?? '',
    contactPerson: initialData?.contactPerson ?? '',
    phone: initialData?.phone ?? '',
    email: initialData?.email ?? '',
    address: initialData?.address ?? '',
    status: initialData?.status ?? 'active',
    scope: initialData?.scope ?? '',
    contractValue: initialData?.contractValue ?? 0,
    totalPaid: initialData?.totalPaid ?? 0,
    totalDue: initialData?.totalDue ?? 0,
    startDate:
      initialData?.startDate instanceof Date
        ? initialData.startDate.toISOString().split('T')[0]
        : initialData?.startDate
          ? String(initialData.startDate)
          : new Date().toISOString().split('T')[0],
    endDate:
      initialData?.endDate instanceof Date
        ? initialData.endDate.toISOString().split('T')[0]
        : initialData?.endDate
          ? String(initialData.endDate)
          : '',
    completionPercentage: initialData?.completionPercentage ?? 0,
    gstNumber: initialData?.gstNumber ?? '',
    panNumber: initialData?.panNumber ?? '',
    accountNumber: initialData?.accountNumber ?? '',
    bankName: initialData?.bankName ?? '',
    ifscCode: initialData?.ifscCode ?? '',
    paymentTerms: initialData?.paymentTerms ?? 'milestone',
    milestones: (initialData?.milestones ?? []).map((m) => ({
      name: m.name,
      percentage: m.paymentPercentage,
      amount: m.amount,
      status: m.status,
      date:
        m.targetDate instanceof Date
          ? m.targetDate.toISOString().split('T')[0]
          : String(m.targetDate),
    })),
    notes: initialData?.notes ?? '',
  }));

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === 'contractValue' || field === 'totalPaid') {
        updated.totalDue = updated.contractValue - updated.totalPaid;
      }
      return updated;
    });
  };

  const handleMilestoneChange = (
    index: number,
    field: string,
    value: string | number
  ) => {
    const updatedMilestones = [...formData.milestones];
    updatedMilestones[index] = { ...updatedMilestones[index], [field]: value };
    setFormData((prev) => ({ ...prev, milestones: updatedMilestones }));
  };

  const addMilestone = () => {
    setFormData((prev) => ({
      ...prev,
      milestones: [
        ...prev.milestones,
        { name: '', percentage: 0, amount: 0, status: 'pending', date: '' },
      ],
    }));
  };

  const removeMilestone = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      milestones: prev.milestones.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.contractorName ||
      !formData.contactPerson ||
      !formData.phone ||
      !formData.email
    ) {
      toast.error('Please fill in all required fields');
      return;
    }
    setTimeout(() => {
      toast.success(
        isEditMode
          ? 'Sub-contract updated successfully'
          : 'Sub-contract created successfully'
      );
      router.push(routes.thirdParty.subContracts.href);
    }, 500);
  };

  const handleCancel = () => {
    router.push(
      isEditMode
        ? routes.thirdParty.subContracts.detail(id).href
        : routes.thirdParty.subContracts.href
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title={isEditMode ? 'Edit Sub-Contract' : 'Add New Sub-Contract'}
        description={
          isEditMode
            ? `Update sub-contract information for ${formData.contractorName}`
            : 'Fill in the details to add a new sub-contract'
        }
      />

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main Form */}
          <div className="space-y-6 lg:col-span-2">
            {/* Contractor Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Contractor Information</span>
                </CardTitle>
                <CardDescription>
                  Basic contractor and contact details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="contractId">Contract ID *</Label>
                    <Input
                      id="contractId"
                      value={formData.contractId}
                      onChange={(e) =>
                        handleInputChange('contractId', e.target.value)
                      }
                      placeholder="SUB-001"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="contractorName">Contractor Name *</Label>
                    <Input
                      id="contractorName"
                      value={formData.contractorName}
                      onChange={(e) =>
                        handleInputChange('contractorName', e.target.value)
                      }
                      placeholder="Elite Construction Services"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="contactPerson">Contact Person *</Label>
                    <Input
                      id="contactPerson"
                      value={formData.contactPerson}
                      onChange={(e) =>
                        handleInputChange('contactPerson', e.target.value)
                      }
                      placeholder="Amit Patel"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone *</Label>
                    <PhoneInput
                      id="phone"
                      value={formData.phone}
                      onChange={(value) =>
                        handleInputChange('phone', value || '')
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        handleInputChange('email', e.target.value)
                      }
                      placeholder="amit@eliteconstruction.com"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="address">Address *</Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) =>
                        handleInputChange('address', e.target.value)
                      }
                      placeholder="789, Contractor Colony, Sector 15"
                      rows={2}
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contract Details */}
            <Card>
              <CardHeader>
                <CardTitle>Contract Details</CardTitle>
                <CardDescription>
                  Contract dates, status, and scope
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="status">Status *</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) =>
                        handleInputChange('status', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="paymentTerms">Payment Terms *</Label>
                    <Select
                      value={formData.paymentTerms}
                      onValueChange={(value) =>
                        handleInputChange('paymentTerms', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="milestone">
                          Milestone-based
                        </SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="completion">
                          On Completion
                        </SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="startDate">Start Date *</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) =>
                        handleInputChange('startDate', e.target.value)
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate">End Date *</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) =>
                        handleInputChange('endDate', e.target.value)
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="completionPercentage">
                      Completion Percentage
                    </Label>
                    <Input
                      id="completionPercentage"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.completionPercentage}
                      onChange={(e) =>
                        handleInputChange(
                          'completionPercentage',
                          Number.parseInt(e.target.value) || 0
                        )
                      }
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="scope">Scope of Work *</Label>
                    <Textarea
                      id="scope"
                      value={formData.scope}
                      onChange={(e) =>
                        handleInputChange('scope', e.target.value)
                      }
                      placeholder="Detailed description of work to be performed"
                      rows={3}
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Financial Information */}
            <Card>
              <CardHeader>
                <CardTitle>Financial Information</CardTitle>
                <CardDescription>
                  Contract value and payment details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="contractValue">Contract Value (₹) *</Label>
                    <Input
                      id="contractValue"
                      type="number"
                      value={formData.contractValue}
                      onChange={(e) =>
                        handleInputChange(
                          'contractValue',
                          Number.parseFloat(e.target.value) || 0
                        )
                      }
                      placeholder="2500000"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="totalPaid">Paid Amount (₹)</Label>
                    <Input
                      id="totalPaid"
                      type="number"
                      value={formData.totalPaid}
                      onChange={(e) =>
                        handleInputChange(
                          'totalPaid',
                          Number.parseFloat(e.target.value) || 0
                        )
                      }
                      placeholder="1500000"
                    />
                  </div>
                  <div>
                    <Label htmlFor="totalDue">Outstanding Amount (₹)</Label>
                    <Input
                      id="totalDue"
                      type="number"
                      value={formData.totalDue}
                      disabled
                      placeholder="Auto-calculated"
                    />
                  </div>
                  <div>
                    <Label htmlFor="accountNumber">Bank Account Number</Label>
                    <Input
                      id="accountNumber"
                      value={formData.accountNumber}
                      onChange={(e) =>
                        handleInputChange('accountNumber', e.target.value)
                      }
                      placeholder="1234567890"
                    />
                  </div>
                  <div>
                    <Label htmlFor="bankName">Bank Name</Label>
                    <Input
                      id="bankName"
                      value={formData.bankName}
                      onChange={(e) =>
                        handleInputChange('bankName', e.target.value)
                      }
                      placeholder="ICICI Bank"
                    />
                  </div>
                  <div>
                    <Label htmlFor="ifscCode">IFSC Code</Label>
                    <Input
                      id="ifscCode"
                      value={formData.ifscCode}
                      onChange={(e) =>
                        handleInputChange('ifscCode', e.target.value)
                      }
                      placeholder="ICIC0001234"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Milestones */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <TrendingUp className="h-5 w-5" />
                      <span>Project Milestones</span>
                    </CardTitle>
                    <CardDescription>Define payment milestones</CardDescription>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={addMilestone}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Milestone
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.milestones.length === 0 ? (
                  <p className="py-4 text-center text-sm text-zinc-500 dark:text-zinc-500">
                    No milestones added yet
                  </p>
                ) : (
                  formData.milestones.map((milestone, index) => (
                    <div
                      key={index}
                      className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
                    >
                      <div className="mb-4 flex items-start justify-between">
                        <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">
                          Milestone {index + 1}
                        </h4>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => removeMilestone(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="md:col-span-2">
                          <Label htmlFor={`milestone-name-${index}`}>
                            Milestone Name
                          </Label>
                          <Input
                            id={`milestone-name-${index}`}
                            value={milestone.name}
                            onChange={(e) =>
                              handleMilestoneChange(
                                index,
                                'name',
                                e.target.value
                              )
                            }
                            placeholder="Foundation Work"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`milestone-percentage-${index}`}>
                            Percentage (%)
                          </Label>
                          <Input
                            id={`milestone-percentage-${index}`}
                            type="number"
                            min="0"
                            max="100"
                            value={milestone.percentage}
                            onChange={(e) =>
                              handleMilestoneChange(
                                index,
                                'percentage',
                                Number.parseInt(e.target.value) || 0
                              )
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor={`milestone-amount-${index}`}>
                            Amount (₹)
                          </Label>
                          <Input
                            id={`milestone-amount-${index}`}
                            type="number"
                            value={milestone.amount}
                            onChange={(e) =>
                              handleMilestoneChange(
                                index,
                                'amount',
                                Number.parseFloat(e.target.value) || 0
                              )
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor={`milestone-status-${index}`}>
                            Status
                          </Label>
                          <Select
                            value={milestone.status}
                            onValueChange={(value) =>
                              handleMilestoneChange(index, 'status', value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="in-progress">
                                In Progress
                              </SelectItem>
                              <SelectItem value="completed">
                                Completed
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor={`milestone-date-${index}`}>
                            Due Date
                          </Label>
                          <Input
                            id={`milestone-date-${index}`}
                            type="date"
                            value={milestone.date}
                            onChange={(e) =>
                              handleMilestoneChange(
                                index,
                                'date',
                                e.target.value
                              )
                            }
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Tax & Legal */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Tax & Legal</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="gstNumber">GST Number</Label>
                  <Input
                    id="gstNumber"
                    value={formData.gstNumber}
                    onChange={(e) =>
                      handleInputChange('gstNumber', e.target.value)
                    }
                    placeholder="09AABCU9603R1ZX"
                  />
                </div>
                <div>
                  <Label htmlFor="panNumber">PAN Number</Label>
                  <Input
                    id="panNumber"
                    value={formData.panNumber}
                    onChange={(e) =>
                      handleInputChange('panNumber', e.target.value)
                    }
                    placeholder="AABCU9603R"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Additional Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Additional Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Add any additional notes or comments..."
                  rows={6}
                />
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <Card>
              <CardContent className="space-y-2 pt-6">
                <Button type="submit" className="w-full">
                  <Save className="mr-2 h-4 w-4" />
                  {isEditMode ? 'Update Sub-Contract' : 'Create Sub-Contract'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleCancel}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
