'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Organization } from '@/types/organization';
import { Building, Loader2, Upload, X, Image as ImageIcon } from 'lucide-react';
import { toast } from '@/lib/styles/toast-styles';
import {
  required,
  compose,
  optional,
  email,
  phone,
  url,
} from '@/lib/validators';
import Image from 'next/image';

interface OrganizationFormData {
  organizationName: string;
  organizationAddress: string;
  organizationEmail: string;
  organizationPhone: string;
  organizationWebsite: string;
  isActive: boolean;
}

interface OrganizationFormProps {
  organization?: Organization;
  onSubmit: (data: Partial<Organization>, logoFile?: File) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function OrganizationForm({
  organization,
  onSubmit,
  onCancel,
  isLoading = false,
}: OrganizationFormProps) {
  const [formData, setFormData] = useState<OrganizationFormData>({
    organizationName: organization?.organizationName || '',
    organizationAddress: organization?.organizationAddress || '',
    organizationEmail: organization?.organizationEmail || '',
    organizationPhone: organization?.organizationPhone || '',
    organizationWebsite: organization?.organizationWebsite || '',
    isActive: organization?.isActive ?? true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(
    organization?.logo?.file || null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Validate organization name
    const nameError = required('Organization name')(
      formData.organizationName ?? ''
    );
    if (nameError) newErrors.organizationName = nameError;

    // Validate address
    const addressError = required('Address')(
      formData.organizationAddress ?? ''
    );
    if (addressError) newErrors.organizationAddress = addressError;

    // Validate email
    const emailValidator = compose(required('Email'), email);
    const emailError = emailValidator(formData.organizationEmail ?? '');
    if (emailError) newErrors.organizationEmail = emailError;

    // Validate phone
    const phoneValidator = compose(required('Phone'), phone);
    const phoneError = phoneValidator(formData.organizationPhone ?? '');
    if (phoneError) newErrors.organizationPhone = phoneError;

    // Validate website (optional)
    const websiteValidator = optional(url);
    const websiteError = websiteValidator(formData.organizationWebsite ?? '');
    if (websiteError) newErrors.organizationWebsite = websiteError;

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

    const orgData: Partial<Organization> = {
      organizationName: formData.organizationName,
      organizationAddress: formData.organizationAddress,
      organizationEmail: formData.organizationEmail,
      organizationPhone: formData.organizationPhone,
      organizationWebsite: formData.organizationWebsite || undefined,
      isActive: formData.isActive,
    };

    onSubmit(orgData, logoFile || undefined);
  };

  const handleChange = (
    field: keyof OrganizationFormData,
    value: string | boolean
  ) => {
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

    // Store the file and create preview
    setLogoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
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
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-linear-to-br from-blue-500 to-blue-600">
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
            <Textarea
              id="organizationAddress"
              value={formData.organizationAddress}
              onChange={(e) =>
                handleChange('organizationAddress', e.target.value)
              }
              placeholder="Enter organization address"
              rows={3}
              className={errors.organizationAddress ? 'border-red-500' : ''}
            />
            {errors.organizationAddress && (
              <p className="text-sm text-red-500">
                {errors.organizationAddress}
              </p>
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
              onChange={(e) =>
                handleChange('organizationEmail', e.target.value)
              }
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
              onChange={(e) =>
                handleChange('organizationPhone', e.target.value)
              }
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
              onChange={(e) =>
                handleChange('organizationWebsite', e.target.value)
              }
              placeholder="https://example.com"
              className={errors.organizationWebsite ? 'border-red-500' : ''}
            />
            {errors.organizationWebsite && (
              <p className="text-sm text-red-500">
                {errors.organizationWebsite}
              </p>
            )}
          </div>

          {/* Logo Upload */}
          <div className="space-y-2">
            <Label>Organization Logo</Label>
            <div className="flex items-start space-x-4">
              {/* Logo Preview */}
              <div className="relative flex h-32 w-32 items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-zinc-300 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900">
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
                      className="absolute top-1 right-1 rounded-full bg-red-500 p-1 text-white transition-colors hover:bg-red-600"
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
                  <Upload className="mr-2 h-4 w-4" />
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
              className="text-primary focus:ring-primary h-4 w-4 rounded border-zinc-300"
            />
            <Label htmlFor="isActive" className="cursor-pointer">
              Active Organization
            </Label>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 border-t border-zinc-200 pt-4 dark:border-zinc-800">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
