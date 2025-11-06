'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Organization } from '@/types/organization';
import { Building, Loader2, Upload, X, Image as ImageIcon } from 'lucide-react';
import { toast } from '@/lib/styles/toast-styles';
import Image from 'next/image';

interface OrganizationFormProps {
  organization?: Organization;
  onSubmit: (data: Partial<Organization>) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function OrganizationForm({
  organization,
  onSubmit,
  onCancel,
  isLoading = false,
}: OrganizationFormProps) {
  const [formData, setFormData] = useState<Partial<Organization>>({
    organizationName: organization?.organizationName || '',
    organizationAddress: organization?.organizationAddress || '',
    organizationEmail: organization?.organizationEmail || '',
    organizationPhone: organization?.organizationPhone || '',
    organizationWebsite: organization?.organizationWebsite || '',
    organizationLogo: organization?.organizationLogo || '',
    isActive: organization?.isActive ?? true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [logoPreview, setLogoPreview] = useState<string | null>(organization?.organizationLogo || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.organizationName?.trim()) {
      newErrors.organizationName = 'Organization name is required';
    }

    if (!formData.organizationAddress?.trim()) {
      newErrors.organizationAddress = 'Address is required';
    }

    if (!formData.organizationEmail?.trim()) {
      newErrors.organizationEmail = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.organizationEmail)) {
      newErrors.organizationEmail = 'Invalid email format';
    }

    if (!formData.organizationPhone?.trim()) {
      newErrors.organizationPhone = 'Phone number is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Validation Error', {
        description: 'Please fix the errors in the form',
      });
      return;
    }

    onSubmit(formData);
  };

  const handleChange = (field: keyof Organization, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Invalid file type', {
        description: 'Please upload an image file (PNG, JPG, etc.)',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large', {
        description: 'Please upload an image smaller than 5MB',
      });
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setLogoPreview(result);
      setFormData((prev) => ({ ...prev, organizationLogo: result }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoPreview(null);
    setFormData((prev) => ({ ...prev, organizationLogo: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-lg bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <Building className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle>
                {organization ? 'Edit Organization' : 'New Organization'}
              </CardTitle>
              <CardDescription>
                {organization
                  ? 'Update organization information'
                  : 'Add a new organization to the system'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Organization Name */}
          <div className="space-y-2">
            <Label htmlFor="organizationName">
              Organization Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="organizationName"
              value={formData.organizationName}
              onChange={(e) => handleChange('organizationName', e.target.value)}
              placeholder="Enter organization name"
              className={errors.organizationName ? 'border-red-500' : ''}
            />
            {errors.organizationName && (
              <p className="text-sm text-red-500">{errors.organizationName}</p>
            )}
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="organizationAddress">
              Address <span className="text-red-500">*</span>
            </Label>
            <Input
              id="organizationAddress"
              value={formData.organizationAddress}
              onChange={(e) => handleChange('organizationAddress', e.target.value)}
              placeholder="Enter organization address"
              className={errors.organizationAddress ? 'border-red-500' : ''}
            />
            {errors.organizationAddress && (
              <p className="text-sm text-red-500">{errors.organizationAddress}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="organizationEmail">
              Email <span className="text-red-500">*</span>
            </Label>
            <Input
              id="organizationEmail"
              type="email"
              value={formData.organizationEmail}
              onChange={(e) => handleChange('organizationEmail', e.target.value)}
              placeholder="contact@example.com"
              className={errors.organizationEmail ? 'border-red-500' : ''}
            />
            {errors.organizationEmail && (
              <p className="text-sm text-red-500">{errors.organizationEmail}</p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="organizationPhone">
              Phone <span className="text-red-500">*</span>
            </Label>
            <Input
              id="organizationPhone"
              value={formData.organizationPhone}
              onChange={(e) => handleChange('organizationPhone', e.target.value)}
              placeholder="+91 XX XXXX XXXX"
              className={errors.organizationPhone ? 'border-red-500' : ''}
            />
            {errors.organizationPhone && (
              <p className="text-sm text-red-500">{errors.organizationPhone}</p>
            )}
          </div>

          {/* Website */}
          <div className="space-y-2">
            <Label htmlFor="organizationWebsite">Website (Optional)</Label>
            <Input
              id="organizationWebsite"
              type="url"
              value={formData.organizationWebsite}
              onChange={(e) => handleChange('organizationWebsite', e.target.value)}
              placeholder="https://example.com"
            />
          </div>

          {/* Logo Upload */}
          <div className="space-y-2">
            <Label>Organization Logo</Label>
            <div className="flex items-start space-x-4">
              {/* Logo Preview */}
              <div className="relative w-32 h-32 rounded-lg border-2 border-dashed border-zinc-300 dark:border-zinc-700 flex items-center justify-center overflow-hidden bg-zinc-50 dark:bg-zinc-900">
                {logoPreview ? (
                  <>
                    <Image
                      src={logoPreview}
                      alt="Organization logo preview"
                      fill
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </>
                ) : (
                  <ImageIcon className="h-12 w-12 text-zinc-400" />
                )}
              </div>

              {/* Upload Button */}
              <div className="flex-1 space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleUploadClick}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {logoPreview ? 'Change Logo' : 'Upload Logo'}
                </Button>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  PNG, JPG up to 5MB. Recommended size: 400x400px
                </p>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => handleChange('isActive', e.target.checked)}
              className="w-4 h-4 rounded border-zinc-300 text-primary focus:ring-primary"
            />
            <Label htmlFor="isActive" className="cursor-pointer">
              Active Organization
            </Label>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>{organization ? 'Update' : 'Create'} Organization</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
