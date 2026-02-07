'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { toast } from '@/lib/styles/toast-styles';
import { Building2, FileText, Save, X } from 'lucide-react';

export default function VendorNewPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    vendorId: '',
    companyName: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    type: 'material',
    status: 'active',
    category: '',
    gstNumber: '',
    panNumber: '',
    paymentTerms: 'net30',
    bankAccount: '',
    bankName: '',
    ifscCode: '',
    registrationDate: new Date().toISOString().split('T')[0],
    website: '',
    notes: '',
    totalOutstanding: 0,
  });

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (
      !formData.companyName ||
      !formData.contactPerson ||
      !formData.phone ||
      !formData.email
    ) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Simulate API call
    setTimeout(() => {
      toast.success('Vendor created successfully');
      router.push('/dashboard/third-party/vendors');
    }, 500);
  };

  const handleCancel = () => {
    router.push('/dashboard/third-party/vendors');
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            Add New Vendor
          </h1>
          <p className="mt-1 text-zinc-600 dark:text-zinc-400">
            Fill in the details to add a new vendor
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main Form */}
          <div className="space-y-6 lg:col-span-2">
            {/* Company Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building2 className="h-5 w-5" />
                  <span>Company Information</span>
                </CardTitle>
                <CardDescription>
                  Basic vendor and contact details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="vendorId">Vendor ID *</Label>
                    <Input
                      id="vendorId"
                      value={formData.vendorId}
                      onChange={(e) =>
                        handleInputChange('vendorId', e.target.value)
                      }
                      placeholder="VEN-001"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="companyName">Company Name *</Label>
                    <Input
                      id="companyName"
                      value={formData.companyName}
                      onChange={(e) =>
                        handleInputChange('companyName', e.target.value)
                      }
                      placeholder="ABC Materials Pvt Ltd"
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
                      placeholder="Rajesh Sharma"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        handleInputChange('phone', e.target.value)
                      }
                      placeholder="+91 98765 43210"
                      required
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
                      placeholder="contact@abcmaterials.com"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={formData.website}
                      onChange={(e) =>
                        handleInputChange('website', e.target.value)
                      }
                      placeholder="www.abcmaterials.com"
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
                      placeholder="456, Industrial Area, Phase 2"
                      rows={2}
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Business Details */}
            <Card>
              <CardHeader>
                <CardTitle>Business Details</CardTitle>
                <CardDescription>
                  Vendor type, status, and categories
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="type">Vendor Type *</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) =>
                        handleInputChange('type', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="material">
                          Material Supplier
                        </SelectItem>
                        <SelectItem value="equipment">Equipment</SelectItem>
                        <SelectItem value="service">
                          Service Provider
                        </SelectItem>
                        <SelectItem value="transport">Transport</SelectItem>
                        <SelectItem value="mixed">Mixed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
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
                        <SelectItem value="blacklisted">Blacklisted</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="registrationDate">
                      Registration Date *
                    </Label>
                    <Input
                      id="registrationDate"
                      type="date"
                      value={formData.registrationDate}
                      onChange={(e) =>
                        handleInputChange('registrationDate', e.target.value)
                      }
                      required
                    />
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
                        <SelectItem value="immediate">Immediate</SelectItem>
                        <SelectItem value="net15">Net 15 Days</SelectItem>
                        <SelectItem value="net30">Net 30 Days</SelectItem>
                        <SelectItem value="net45">Net 45 Days</SelectItem>
                        <SelectItem value="net60">Net 60 Days</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="category">
                      Product Categories (comma-separated)
                    </Label>
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) =>
                        handleInputChange('category', e.target.value)
                      }
                      placeholder="Cement, Steel, Aggregates"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Financial Information */}
            <Card>
              <CardHeader>
                <CardTitle>Financial Information</CardTitle>
                <CardDescription>Bank and transaction details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="bankAccount">Bank Account Number</Label>
                    <Input
                      id="bankAccount"
                      value={formData.bankAccount}
                      onChange={(e) =>
                        handleInputChange('bankAccount', e.target.value)
                      }
                      placeholder="9876543210"
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
                      placeholder="HDFC Bank"
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
                      placeholder="HDFC0001234"
                    />
                  </div>
                  <div>
                    <Label htmlFor="totalOutstanding">
                      Total Outstanding (₹)
                    </Label>
                    <Input
                      id="totalOutstanding"
                      type="number"
                      value={formData.totalOutstanding}
                      onChange={(e) =>
                        handleInputChange(
                          'totalOutstanding',
                          Number.parseFloat(e.target.value) || 0
                        )
                      }
                      placeholder="0"
                    />
                  </div>
                </div>
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
                    placeholder="27AABCU9603R1ZX"
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
                  Create Vendor
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
