'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { Textarea } from '@/components/shadcn/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/select';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { toast } from '@/lib/styles/toast-styles';

export default function NewLabourPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    labourId: '',
    name: '',
    phone: '',
    email: '',
    address: '',
    trade: '',
    type: 'daily',
    skillLevel: 'skilled',
    status: 'active',
    dailyRate: '',
    monthlyRate: '',
    overtimeRate: '',
    currentProject: '',
    joiningDate: new Date().toISOString().split('T')[0],
    contractorName: '',
    contractorPhone: '',
    aadhaarNumber: '',
    panNumber: '',
    bankAccount: '',
    bankName: '',
    ifscCode: '',
    emergencyContact: '',
    emergencyContactName: '',
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.name || !formData.phone || !formData.trade) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Simulate API call
    toast.success('Labour created successfully');
    router.push('/dashboard/third-party/labour');
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/users/dashboard/third-party/labour">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            Add New Labour
          </h1>
          <p className="mt-1 text-zinc-600 dark:text-zinc-400">
            Enter new labour details
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
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      placeholder="+91 98765 43210"
                      required
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
                    <Input
                      id="contractorPhone"
                      type="tel"
                      value={formData.contractorPhone}
                      onChange={(e) =>
                        handleChange('contractorPhone', e.target.value)
                      }
                      placeholder="+91 98765 00000"
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
                  <div>
                    <Label htmlFor="bankAccount">Bank Account Number</Label>
                    <Input
                      id="bankAccount"
                      value={formData.bankAccount}
                      onChange={(e) =>
                        handleChange('bankAccount', e.target.value)
                      }
                      placeholder="1234567890"
                    />
                  </div>
                  <div>
                    <Label htmlFor="bankName">Bank Name</Label>
                    <Input
                      id="bankName"
                      value={formData.bankName}
                      onChange={(e) => handleChange('bankName', e.target.value)}
                      placeholder="State Bank of India"
                    />
                  </div>
                  <div>
                    <Label htmlFor="ifscCode">IFSC Code</Label>
                    <Input
                      id="ifscCode"
                      value={formData.ifscCode}
                      onChange={(e) => handleChange('ifscCode', e.target.value)}
                      placeholder="SBIN0001234"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Documents */}
            <Card>
              <CardHeader>
                <CardTitle>Documents & ID</CardTitle>
                <CardDescription>Government ID and documents</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="aadhaarNumber">Aadhaar Number</Label>
                    <Input
                      id="aadhaarNumber"
                      value={formData.aadhaarNumber}
                      onChange={(e) =>
                        handleChange('aadhaarNumber', e.target.value)
                      }
                      placeholder="1234 5678 9012"
                    />
                  </div>
                  <div>
                    <Label htmlFor="panNumber">PAN Number</Label>
                    <Input
                      id="panNumber"
                      value={formData.panNumber}
                      onChange={(e) =>
                        handleChange('panNumber', e.target.value)
                      }
                      placeholder="ABCDE1234F"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
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
                  <Label htmlFor="emergencyContact">Contact Phone</Label>
                  <Input
                    id="emergencyContact"
                    type="tel"
                    value={formData.emergencyContact}
                    onChange={(e) =>
                      handleChange('emergencyContact', e.target.value)
                    }
                    placeholder="+91 98765 11111"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Additional Notes</CardTitle>
                <CardDescription>Any additional information</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  placeholder="Enter any additional notes..."
                  rows={6}
                />
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col space-y-2">
              <Button type="submit" className="w-full">
                <Save className="mr-2 h-4 w-4" />
                Create Labour
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => router.push('/dashboard/third-party/labour')}
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
