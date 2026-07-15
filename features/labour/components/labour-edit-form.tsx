'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { Separator } from '@/components/shadcn/separator';
import { Loader2, Save } from 'lucide-react';
import { PageHeader } from '@/components/common';
import { toast } from '@/lib/styles/toast-styles';
import { format } from 'date-fns';
import { getErrorMessage, getErrorTitle } from '@tornotron/echno-core';
import {
  EmploymentType,
  LabourStatus,
  SkillLevel,
  type Labour,
} from '@tornotron/echno-core/labour/types';
import {
  useCreateLabour,
  useUpdateLabour,
} from '@tornotron/echno-core/labour/hooks';
import { useProjects } from '@tornotron/echno-core/project/hooks';

export interface LabourEditFormProps {
  initialData?: Labour;
  isEdit: boolean;
}

export function LabourEditForm({ initialData, isEdit }: LabourEditFormProps) {
  const router = useRouter();
  const createLabour = useCreateLabour();
  const updateLabour = useUpdateLabour();
  const { data: projects = [] } = useProjects();
  const isPending = createLabour.isPending || updateLabour.isPending;

  const [formData, setFormData] = useState(() => ({
    labourId: initialData?.labourId ?? '',
    fullName: initialData?.fullName ?? '',
    phoneNumber: initialData?.phoneNumber ?? '',
    email: initialData?.email ?? '',
    address: initialData?.address ?? '',
    specialization: initialData?.specialization ?? '',
    employmentType: initialData?.employmentType ?? EmploymentType.DAILY_WAGE,
    skillLevel: initialData?.skillLevel ?? SkillLevel.SKILLED,
    status: initialData?.status ?? LabourStatus.ACTIVE,
    dailyRate: initialData?.dailyRate?.toString() ?? '',
    monthlyRate: initialData?.monthlyRate?.toString() ?? '',
    overTimeRate: initialData?.overTimeRate?.toString() ?? '',
    joiningDate: initialData?.joiningDate
      ? format(new Date(initialData.joiningDate), 'yyyy-MM-dd')
      : '',
    contractorName: initialData?.contractorName ?? '',
    contractorPhone: initialData?.contractorPhone ?? '',
    emergencyContactName: initialData?.emergencyContactName ?? '',
    emergencyContactPhone: initialData?.emergencyContactNumber ?? '',
    currentProjectId: initialData?.currentProjectId?.toString() ?? '',
    bankAccountNumber: initialData?.bankAccountNumber ?? '',
    bankName: initialData?.bankName ?? '',
    ifscCode: initialData?.ifscCode ?? '',
    additionalNotes: initialData?.additionalNotes ?? '',
  }));

  const [errors, setErrors] = useState<Record<string, string>>({});

  function clearError(field: string) {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.phoneNumber.trim())
      newErrors.phoneNumber = 'Phone number is required';
    if (!formData.specialization.trim())
      newErrors.specialization = 'Trade/Specialization is required';
    if (!formData.joiningDate)
      newErrors.joiningDate = 'Joining date is required';
    if (!formData.currentProjectId)
      newErrors.currentProjectId = 'Project is required';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('Please fill in all required fields');
      return;
    }

    const payload = {
      labourID: formData.labourId || undefined,
      fullName: formData.fullName,
      phoneNumber: formData.phoneNumber,
      email: formData.email || undefined,
      address: formData.address || undefined,
      specialization: formData.specialization,
      employmentType: formData.employmentType,
      skillLevel: formData.skillLevel,
      status: formData.status,
      joiningDate: formData.joiningDate,
      dailyRate: (() => {
        const n = Number.parseFloat(formData.dailyRate);
        return Number.isFinite(n) ? n : undefined;
      })(),
      overTimeRate: (() => {
        const n = Number.parseFloat(formData.overTimeRate);
        return Number.isFinite(n) ? n : undefined;
      })(),
      emergencyContactName: formData.emergencyContactName || undefined,
      emergencyContactPhone: formData.emergencyContactPhone || undefined,
      currentProjectId: (() => {
        const n = Number.parseInt(formData.currentProjectId, 10);
        return Number.isFinite(n) ? n : undefined;
      })(),
      bankAccountNumber: formData.bankAccountNumber || undefined,
      bankName: formData.bankName || undefined,
      ifscCode: formData.ifscCode || undefined,
      additionalNotes: formData.additionalNotes || undefined,
    };

    if (isEdit && initialData) {
      updateLabour.mutate(
        { id: initialData.id, data: payload },
        {
          onSuccess: () => {
            toast.success('Labour Updated', {
              description: 'The labour record has been updated successfully',
            });
            router.push(routes.thirdParty.labour.href);
          },
          onError: (error) => {
            toast.error(getErrorTitle(error, 'Failed to Update Labour'), {
              description: getErrorMessage(error),
            });
          },
        }
      );
    } else {
      createLabour.mutate(payload, {
        onSuccess: (created) => {
          toast.success('Labour Created', {
            description: 'The labour record has been created successfully',
          });
          router.push(routes.thirdParty.labour.detail(created.id).href);
        },
        onError: (error) => {
          toast.error(getErrorTitle(error, 'Failed to Create Labour'), {
            description: getErrorMessage(error),
          });
        },
      });
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    clearError(field);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title={isEdit ? 'Edit Labour' : 'Add New Labour'}
        description={
          isEdit ? 'Update labour information' : 'Enter new labour details'
        }
      />

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main Form */}
          <div className="space-y-6 lg:col-span-2">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Enter personal and contact details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="labourId">Labour ID</Label>
                    <Input
                      id="labourId"
                      value={formData.labourId}
                      onChange={(e) => handleChange('labourId', e.target.value)}
                      placeholder="LAB-001"
                      maxLength={15}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fullName">
                      Full Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => handleChange('fullName', e.target.value)}
                      placeholder="Enter full name"
                      className={errors.fullName ? 'border-red-500' : ''}
                    />
                    {errors.fullName && (
                      <p className="text-sm text-red-500">{errors.fullName}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">
                      Phone Number <span className="text-red-500">*</span>
                    </Label>
                    <div
                      className={
                        errors.phoneNumber
                          ? 'rounded-md border border-red-500'
                          : undefined
                      }
                    >
                      <PhoneInput
                        id="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={(value) =>
                          handleChange('phoneNumber', value || '')
                        }
                      />
                    </div>
                    {errors.phoneNumber && (
                      <p className="text-sm text-red-500">
                        {errors.phoneNumber}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      placeholder="email@example.com"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => handleChange('address', e.target.value)}
                      placeholder="Enter complete address"
                      rows={3}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Work Details */}
            <Card>
              <CardHeader>
                <CardTitle>Work Details</CardTitle>
                <CardDescription>
                  Employment and work-related information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="specialization">
                      Trade/Specialization{' '}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="specialization"
                      value={formData.specialization}
                      onChange={(e) =>
                        handleChange('specialization', e.target.value)
                      }
                      placeholder="e.g., Mason, Carpenter"
                      className={errors.specialization ? 'border-red-500' : ''}
                    />
                    {errors.specialization && (
                      <p className="text-sm text-red-500">
                        {errors.specialization}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="skillLevel">Skill Level</Label>
                    <Select
                      value={formData.skillLevel}
                      onValueChange={(value) =>
                        handleChange('skillLevel', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={SkillLevel.UNSKILLED}>
                          Unskilled
                        </SelectItem>
                        <SelectItem value={SkillLevel.SEMI_SKILLED}>
                          Semi-Skilled
                        </SelectItem>
                        <SelectItem value={SkillLevel.SKILLED}>
                          Skilled
                        </SelectItem>
                        <SelectItem value={SkillLevel.HIGHLY_SKILLED}>
                          Highly Skilled
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="employmentType">Employment Type</Label>
                    <Select
                      value={formData.employmentType}
                      onValueChange={(value) =>
                        handleChange('employmentType', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={EmploymentType.DAILY_WAGE}>
                          Daily Wage
                        </SelectItem>
                        <SelectItem value={EmploymentType.MONTHLY}>
                          Monthly
                        </SelectItem>
                        <SelectItem value={EmploymentType.CONTRACT}>
                          Contract
                        </SelectItem>
                        <SelectItem value={EmploymentType.PIECE_RATE}>
                          Piece Rate
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => handleChange('status', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={LabourStatus.ACTIVE}>
                          Active
                        </SelectItem>
                        <SelectItem value={LabourStatus.INACTIVE}>
                          Inactive
                        </SelectItem>
                        <SelectItem value={LabourStatus.ON_LEAVE}>
                          On Leave
                        </SelectItem>
                        <SelectItem value={LabourStatus.TERMINATED}>
                          Terminated
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="joiningDate">
                      Joining Date <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="joiningDate"
                      type="date"
                      value={formData.joiningDate}
                      onChange={(e) =>
                        handleChange('joiningDate', e.target.value)
                      }
                      className={errors.joiningDate ? 'border-red-500' : ''}
                    />
                    {errors.joiningDate && (
                      <p className="text-sm text-red-500">
                        {errors.joiningDate}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currentProjectId">
                      Project <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.currentProjectId}
                      onValueChange={(value) =>
                        handleChange('currentProjectId', value)
                      }
                    >
                      <SelectTrigger
                        className={
                          errors.currentProjectId ? 'border-red-500' : ''
                        }
                      >
                        <SelectValue placeholder="Select project" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map((project) => (
                          <SelectItem
                            key={project.id}
                            value={String(project.id)}
                          >
                            {project.projectName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.currentProjectId && (
                      <p className="text-sm text-red-500">
                        {errors.currentProjectId}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contractorName">Contractor Name</Label>
                    <Input
                      id="contractorName"
                      value={formData.contractorName}
                      onChange={(e) =>
                        handleChange('contractorName', e.target.value)
                      }
                      placeholder="Contractor name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contractorPhone">Contractor Phone</Label>
                    <PhoneInput
                      id="contractorPhone"
                      value={formData.contractorPhone}
                      onChange={(value) =>
                        handleChange('contractorPhone', value || '')
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Information */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Information</CardTitle>
                <CardDescription>Salary and payment details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {formData.employmentType === EmploymentType.DAILY_WAGE && (
                    <div className="space-y-2">
                      <Label htmlFor="dailyRate">Daily Rate (₹)</Label>
                      <Input
                        id="dailyRate"
                        type="number"
                        value={formData.dailyRate}
                        onChange={(e) =>
                          handleChange('dailyRate', e.target.value)
                        }
                        placeholder="800"
                      />
                    </div>
                  )}
                  {formData.employmentType === EmploymentType.MONTHLY && (
                    <div className="space-y-2">
                      <Label htmlFor="monthlyRate">Monthly Rate (₹)</Label>
                      <Input
                        id="monthlyRate"
                        type="number"
                        value={formData.monthlyRate}
                        onChange={(e) =>
                          handleChange('monthlyRate', e.target.value)
                        }
                        placeholder="25000"
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="overTimeRate">Overtime Rate (₹/hr)</Label>
                    <Input
                      id="overTimeRate"
                      type="number"
                      value={formData.overTimeRate}
                      onChange={(e) =>
                        handleChange('overTimeRate', e.target.value)
                      }
                      placeholder="100"
                    />
                  </div>
                </div>
                <Separator />
                <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  Banking Details
                </p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="bankName">Bank Name</Label>
                    <Input
                      id="bankName"
                      value={formData.bankName}
                      onChange={(e) => handleChange('bankName', e.target.value)}
                      placeholder="e.g., State Bank of India"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bankAccountNumber">Account Number</Label>
                    <Input
                      id="bankAccountNumber"
                      value={formData.bankAccountNumber}
                      onChange={(e) =>
                        handleChange('bankAccountNumber', e.target.value)
                      }
                      placeholder="Account number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ifscCode">IFSC Code</Label>
                    <Input
                      id="ifscCode"
                      value={formData.ifscCode}
                      onChange={(e) => handleChange('ifscCode', e.target.value)}
                      placeholder="e.g., SBIN0001234"
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="additionalNotes">Additional Notes</Label>
                    <Textarea
                      id="additionalNotes"
                      value={formData.additionalNotes}
                      onChange={(e) =>
                        handleChange('additionalNotes', e.target.value)
                      }
                      placeholder="Any additional information"
                      rows={3}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Emergency Contact</CardTitle>
                <CardDescription>
                  Contact person in case of emergency
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="emergencyContactName">Contact Name</Label>
                  <Input
                    id="emergencyContactName"
                    value={formData.emergencyContactName}
                    onChange={(e) =>
                      handleChange('emergencyContactName', e.target.value)
                    }
                    placeholder="Enter name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergencyContactPhone">Contact Phone</Label>
                  <PhoneInput
                    id="emergencyContactPhone"
                    value={formData.emergencyContactPhone}
                    onChange={(value) =>
                      handleChange('emergencyContactPhone', value || '')
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col space-y-2">
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {isEdit ? 'Update Labour' : 'Create Labour'}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={isPending}
                onClick={() => router.push(routes.thirdParty.labour.href)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
