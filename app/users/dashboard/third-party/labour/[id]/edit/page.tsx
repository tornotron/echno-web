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
import { Save, HardHat } from 'lucide-react';
import { toast } from '@/lib/styles/toast-styles';
import { getLabourById } from '@/components/shared/mock-data';
import {
  Empty,
  EmptyErrorMedia,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from '@/components/shadcn/empty';
import Link from 'next/link';
import { format } from 'date-fns';

export default function LabourFormPage() {
  const params = useParams();
  const router = useRouter();
  const isEdit = params?.id !== 'new';
  const labourId = isEdit ? Number(params.id) : null;
  const mockLabourData = labourId ? getLabourById(labourId) : null;

  const [formData, setFormData] = useState({
    labourId: mockLabourData?.labourId || '',
    name: mockLabourData?.name || '',
    phone: mockLabourData?.phone || '',
    email: mockLabourData?.email || '',
    address: mockLabourData?.address || '',
    trade: mockLabourData?.trade || '',
    type: mockLabourData?.type || 'daily',
    skillLevel: mockLabourData?.skillLevel || 'skilled',
    status: mockLabourData?.status || 'active',
    dailyRate: mockLabourData?.dailyRate?.toString() || '',
    monthlyRate: mockLabourData?.monthlyRate?.toString() || '',
    overtimeRate: mockLabourData?.overtimeRate?.toString() || '',
    currentProject: mockLabourData?.currentProject || '',
    joiningDate: mockLabourData?.joiningDate
      ? format(mockLabourData.joiningDate, 'yyyy-MM-dd')
      : '',
    contractorName: mockLabourData?.contractorName || '',
    contractorPhone: mockLabourData?.contractorPhone || '',
    emergencyContactName: mockLabourData?.emergencyContactName || '',
    emergencyContactPhone: mockLabourData?.emergencyContactPhone || '',
  });

  if (isEdit && !mockLabourData) {
    return (
      <Empty variant="default">
        <EmptyErrorMedia>
          <HardHat className="size-6" />
        </EmptyErrorMedia>
        <EmptyHeader>
          <EmptyTitle>Labour record not found</EmptyTitle>
          <EmptyDescription>
            This record may have been deleted or does not exist.
          </EmptyDescription>
        </EmptyHeader>
        <Button asChild>
          <Link href={routes.thirdParty.labour.href}>Back to Labour</Link>
        </Button>
      </Empty>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.name || !formData.phone || !formData.trade) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Simulate API call
    toast.success(
      isEdit ? 'Labour updated successfully' : 'Labour created successfully'
    );
    router.push(routes.thirdParty.labour.href);
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            {isEdit ? 'Edit Labour' : 'Add New Labour'}
          </h1>
          <p className="mt-1 text-zinc-600 dark:text-zinc-400">
            {isEdit ? 'Update labour information' : 'Enter new labour details'}
          </p>
        </div>
      </div>

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
                  <div>
                    <Label htmlFor="labourId">
                      Labour ID <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="labourId"
                      value={formData.labourId}
                      onChange={(e) => handleChange('labourId', e.target.value)}
                      placeholder="LAB-001"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="name">
                      Full Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      placeholder="Enter full name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">
                      Phone Number <span className="text-red-500">*</span>
                    </Label>
                    <PhoneInput
                      id="phone"
                      value={formData.phone}
                      onChange={(value) => handleChange('phone', value || '')}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      placeholder="email@example.com"
                    />
                  </div>
                  <div className="md:col-span-2">
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
                  <div>
                    <Label htmlFor="trade">
                      Trade/Specialization{' '}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="trade"
                      value={formData.trade}
                      onChange={(e) => handleChange('trade', e.target.value)}
                      placeholder="e.g., Mason, Carpenter"
                      required
                    />
                  </div>
                  <div>
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
                        <SelectItem value="unskilled">Unskilled</SelectItem>
                        <SelectItem value="semiskilled">
                          Semi-Skilled
                        </SelectItem>
                        <SelectItem value="skilled">Skilled</SelectItem>
                        <SelectItem value="highlySkilled">
                          Highly Skilled
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="type">Employment Type</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => handleChange('type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily Wage</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="contract">Contract</SelectItem>
                        <SelectItem value="piece">Piece Rate</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => handleChange('status', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="onLeave">On Leave</SelectItem>
                        <SelectItem value="terminated">Terminated</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="joiningDate">Joining Date</Label>
                    <Input
                      id="joiningDate"
                      type="date"
                      value={formData.joiningDate}
                      onChange={(e) =>
                        handleChange('joiningDate', e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="currentProject">Current Project</Label>
                    <Input
                      id="currentProject"
                      value={formData.currentProject}
                      onChange={(e) =>
                        handleChange('currentProject', e.target.value)
                      }
                      placeholder="Project name"
                    />
                  </div>
                  <div>
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
                  <div>
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
                  {formData.type === 'daily' && (
                    <div>
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
                  {formData.type === 'monthly' && (
                    <div>
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
                  <div>
                    <Label htmlFor="overtimeRate">Overtime Rate (₹/hr)</Label>
                    <Input
                      id="overtimeRate"
                      type="number"
                      value={formData.overtimeRate}
                      onChange={(e) =>
                        handleChange('overtimeRate', e.target.value)
                      }
                      placeholder="100"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Documents & ID */}
            {/* Emergency Contact */}
            <Card>
              <CardHeader>
                <CardTitle>Emergency Contact</CardTitle>
                <CardDescription>
                  Contact person in case of emergency
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
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
                <div>
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
              <Button type="submit" className="w-full">
                <Save className="mr-2 h-4 w-4" />
                {isEdit ? 'Update Labour' : 'Create Labour'}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
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
