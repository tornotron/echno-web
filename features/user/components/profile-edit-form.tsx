'use client';

import { useState, useRef } from 'react';
import { User } from '@/types/user/user';
import { useUpdateUserWithFiles } from '@/hooks/user/use-user-mutations';
import { useDeleteAttachment } from '@/hooks/attachment/use-attachment-mutations';
import { useQueryClient } from '@tanstack/react-query';
import { userKeys } from '@/hooks/user/user-keys';
import { Button } from '@/components/ui/button';
import {
  RemoveProfilePictureDialog,
  RemoveCvDialog,
  SaveProfileDialog,
} from './user-alert-dialogs';
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Loader2,
  Save,
  X,
  Calendar,
  Upload,
  FileText,
  Download,
  Trash2,
  User as UserIcon,
} from 'lucide-react';
import { toast } from '@/lib/styles/toast-styles';
import Image from 'next/image';
import { isValidAttachmentUrl } from '@/lib/utils/attachment-url';

interface ProfileEditFormProps {
  user: User;
  onCancel?: () => void;
  onSuccess?: () => void;
}

export function ProfileEditForm({
  user,
  onCancel,
  onSuccess,
}: ProfileEditFormProps) {
  const updateUserWithFiles = useUpdateUserWithFiles();
  const { mutate: deleteAttachment } = useDeleteAttachment();
  const queryClient = useQueryClient();
  const [showConfirmUpdate, setShowConfirmUpdate] = useState(false);
  const [pendingMutateArgs, setPendingMutateArgs] = useState<{
    id: number;
    data: Partial<User>;
    files: { profilePicture?: File; cv?: File };
  } | null>(null);
  const [showRemovePictureDialog, setShowRemovePictureDialog] = useState(false);
  const [showRemoveCvDialog, setShowRemoveCvDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name || '',
    phone: user.phone || '',
    address: user.address || '',
    gender: user.gender || '',
    dateOfBirth: user.dateOfBirth
      ? new Date(user.dateOfBirth).toISOString().split('T')[0]
      : '',
    qualification: user.qualification || '',
    bloodGroup: user.bloodGroup || '',
    emergencyContact: user.emergencyContact || '',
    experience: user.experience?.toString() || '',
    skills: user.skills?.join(', ') || '',
    certifications: user.certifications?.join(', ') || '',
  });

  // File state - store both File object and preview URL
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(
    null
  );
  const [profilePicturePreview, setProfilePicturePreview] = useState<
    string | null
  >(user.profilePicture?.file || null);

  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvPreview, setCvPreview] = useState<string | null>(
    user.cv?.file || null
  );
  const [cvFileName, setCvFileName] = useState<string | null>(
    user.cv?.fileName || null
  );

  // Persisted baseline — tracks the last known server state so that
  // discarding a staged file after a server-side delete falls back to
  // null rather than the stale user prop.
  const [persistedProfilePicture, setPersistedProfilePicture] = useState<
    string | null
  >(user.profilePicture?.file || null);
  const [persistedCv, setPersistedCv] = useState<string | null>(
    user.cv?.file || null
  );
  const [persistedCvFileName, setPersistedCvFileName] = useState<string | null>(
    user.cv?.fileName || null
  );

  const profilePictureInputRef = useRef<HTMLInputElement>(null);
  const cvInputRef = useRef<HTMLInputElement>(null);
  const profilePictureReadIdRef = useRef(0);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfilePictureChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
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
    setProfilePictureFile(file);
    const readId = ++profilePictureReadIdRef.current;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (readId === profilePictureReadIdRef.current) {
        setProfilePicturePreview(reader.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type (PDF only for CV)
    if (file.type !== 'application/pdf') {
      toast.error('Invalid file type', {
        description: 'Please upload a PDF file',
      });
      return;
    }

    // Validate file size (max 10MB for CV)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large', {
        description: 'Please upload a PDF smaller than 10MB',
      });
      return;
    }

    // Store the file
    setCvFile(file);
    setCvFileName(file.name);
    setCvPreview('uploaded'); // Just a flag to show uploaded state
  };

  const handleRemoveProfilePicture = () => {
    profilePictureReadIdRef.current++;
    if (profilePictureInputRef.current)
      profilePictureInputRef.current.value = '';
    if (profilePictureFile) {
      // Staged file — discard and revert to persisted baseline
      setProfilePictureFile(null);
      setProfilePicturePreview(persistedProfilePicture);
    } else {
      // Saved attachment — ask for confirmation
      setShowRemovePictureDialog(true);
    }
  };

  const confirmRemoveProfilePicture = () => {
    const id = user.profilePicture?.id;
    if (!id) return;
    deleteAttachment(id, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: userKeys.all });
        setProfilePicturePreview(null);
        setPersistedProfilePicture(null);
      },
    });
    setShowRemovePictureDialog(false);
  };

  const handleRemoveCv = () => {
    if (cvInputRef.current) cvInputRef.current.value = '';
    if (cvFile) {
      // Staged file — discard and revert to persisted baseline
      setCvFile(null);
      setCvPreview(persistedCv);
      setCvFileName(persistedCvFileName);
    } else {
      // Saved attachment — ask for confirmation
      setShowRemoveCvDialog(true);
    }
  };

  const confirmRemoveCv = () => {
    const id = user.cv?.id;
    if (!id) return;
    deleteAttachment(id, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: userKeys.all });
        setCvPreview(null);
        setCvFileName(null);
        setPersistedCv(null);
        setPersistedCvFileName(null);
      },
    });
    setShowRemoveCvDialog(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!user.id) {
      toast.error('Error', { description: 'User ID is required' });
      return;
    }

    // Prepare the update payload
    const updates: Partial<User> = {
      name: formData.name,
      phone: formData.phone,
      address: formData.address,
      gender: formData.gender,
      dateOfBirth: formData.dateOfBirth
        ? new Date(formData.dateOfBirth)
        : user.dateOfBirth,
      qualification: formData.qualification,
      bloodGroup: formData.bloodGroup || undefined,
      emergencyContact: formData.emergencyContact || undefined,
      experience: formData.experience
        ? Number.parseInt(formData.experience, 10)
        : undefined,
      skills: formData.skills
        ? formData.skills
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : undefined,
      certifications: formData.certifications
        ? formData.certifications
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : undefined,
    };

    // Prepare files for upload
    const files = {
      profilePicture: profilePictureFile || undefined,
      cv: cvFile || undefined,
    };

    setPendingMutateArgs({ id: user.id, data: updates, files });
    setShowConfirmUpdate(true);
  };

  const isSubmitting = updateUserWithFiles.isPending;

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>
              Update your basic personal details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Full Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Enter your full name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">
                  Gender <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) => handleSelectChange('gender', value)}
                >
                  <SelectTrigger id="gender">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">
                  Date of Birth <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Calendar className="absolute top-3 left-3 h-4 w-4 text-zinc-400" />
                  <Input
                    id="dateOfBirth"
                    name="dateOfBirth"
                    type="date"
                    className="pl-9"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bloodGroup">Blood Group</Label>
                <Select
                  value={formData.bloodGroup}
                  onValueChange={(value) =>
                    handleSelectChange('bloodGroup', value)
                  }
                >
                  <SelectTrigger id="bloodGroup">
                    <SelectValue placeholder="Select blood group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A+">A+</SelectItem>
                    <SelectItem value="A-">A-</SelectItem>
                    <SelectItem value="B+">B+</SelectItem>
                    <SelectItem value="B-">B-</SelectItem>
                    <SelectItem value="O+">O+</SelectItem>
                    <SelectItem value="O-">O-</SelectItem>
                    <SelectItem value="AB+">AB+</SelectItem>
                    <SelectItem value="AB-">AB-</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">
                Address <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                required
                placeholder="Enter your full address"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
            <CardDescription>How people can reach you</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">
                  Phone Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergencyContact">Emergency Contact</Label>
                <Input
                  id="emergencyContact"
                  name="emergencyContact"
                  type="tel"
                  value={formData.emergencyContact}
                  onChange={handleChange}
                  placeholder="Emergency contact number"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Picture & CV */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Picture & Documents</CardTitle>
            <CardDescription>Upload your profile photo and CV</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Profile Picture Upload */}
            <div className="space-y-2">
              <Label>Profile Picture</Label>
              <div className="flex items-start space-x-4">
                {/* Picture Preview */}
                <div className="group relative h-32 w-32">
                  <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-zinc-300 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900">
                    {profilePicturePreview ? (
                      <Image
                        src={profilePicturePreview}
                        alt="Profile picture preview"
                        fill
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <UserIcon className="h-12 w-12 text-zinc-400" />
                    )}
                  </div>
                  {profilePicturePreview && (
                    <>
                      {isValidAttachmentUrl(profilePicturePreview) && (
                        <a
                          href={profilePicturePreview}
                          download
                          aria-label="Download profile picture"
                          className="absolute inset-0 flex items-center justify-center rounded-full bg-zinc-900/60 opacity-0 transition-opacity group-hover:opacity-100"
                        >
                          <Download className="h-5 w-5 text-white" />
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={handleRemoveProfilePicture}
                        aria-label="Remove profile picture"
                        className="absolute top-0 right-0 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-red-500/90 opacity-0 shadow-md transition-opacity group-hover:opacity-100 hover:bg-red-600"
                      >
                        <Trash2 className="h-3 w-3 text-white" />
                      </button>
                    </>
                  )}
                </div>

                {/* Upload Button */}
                <div className="flex-1 space-y-2">
                  <input
                    ref={profilePictureInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePictureChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => profilePictureInputRef.current?.click()}
                    className="w-full"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {profilePicturePreview
                      ? 'Change Picture'
                      : 'Upload Picture'}
                  </Button>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    PNG, JPG up to 5MB. Recommended size: 400x400px
                  </p>
                </div>
              </div>
            </div>

            {/* CV Upload */}
            <div className="space-y-2">
              <Label>Curriculum Vitae (CV)</Label>
              <div className="flex items-start space-x-4">
                {/* CV Preview */}
                <div className="group relative flex h-32 w-32 items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-zinc-300 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900">
                  {cvPreview ? (
                    <>
                      <div className="text-center">
                        <FileText className="mx-auto h-12 w-12 text-blue-500" />
                        <p className="mt-2 max-w-[100px] truncate text-xs text-zinc-600 dark:text-zinc-400">
                          {cvFileName || 'CV Uploaded'}
                        </p>
                      </div>
                      {isValidAttachmentUrl(cvPreview) && (
                        <a
                          href={cvPreview}
                          download
                          aria-label="Download CV"
                          onClick={(e) => e.stopPropagation()}
                          className="absolute inset-0 flex items-center justify-center rounded-lg bg-zinc-900/60 opacity-0 transition-opacity group-hover:opacity-100"
                        >
                          <Download className="h-5 w-5 text-white" />
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleRemoveCv();
                        }}
                        aria-label="Remove CV"
                        className="absolute top-1 right-1 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-red-500/90 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-600"
                      >
                        <Trash2 className="h-3 w-3 text-white" />
                      </button>
                    </>
                  ) : (
                    <FileText className="h-12 w-12 text-zinc-400" />
                  )}
                </div>

                {/* Upload Button */}
                <div className="flex-1 space-y-2">
                  <input
                    ref={cvInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={handleCvChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => cvInputRef.current?.click()}
                    className="w-full"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {cvPreview ? 'Change CV' : 'Upload CV'}
                  </Button>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    PDF only, up to 10MB
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Professional Information */}
        <Card>
          <CardHeader>
            <CardTitle>Professional Information</CardTitle>
            <CardDescription>
              Your qualifications and experience
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="qualification">
                  Qualification <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="qualification"
                  name="qualification"
                  value={formData.qualification}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Bachelor's Degree"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="experience">Years of Experience</Label>
                <Input
                  id="experience"
                  name="experience"
                  type="number"
                  min="0"
                  value={formData.experience}
                  onChange={handleChange}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="skills">Skills</Label>
              <Textarea
                id="skills"
                name="skills"
                value={formData.skills}
                onChange={handleChange}
                placeholder="Enter your skills separated by commas (e.g., CAD, Candy, MS Excel)"
                rows={3}
              />
              <p className="text-muted-foreground text-xs">
                Separate multiple skills with commas
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="certifications">Certifications</Label>
              <Textarea
                id="certifications"
                name="certifications"
                value={formData.certifications}
                onChange={handleChange}
                placeholder="Enter your certifications separated by commas (e.g., PMP, OSHA 30, AWS Certified)"
                rows={3}
              />
              <p className="text-muted-foreground text-xs">
                Separate multiple certifications with commas
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex justify-end gap-4">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>

      <RemoveProfilePictureDialog
        open={showRemovePictureDialog}
        onOpenChange={(open) => setShowRemovePictureDialog(open)}
        onConfirm={confirmRemoveProfilePicture}
      />

      <RemoveCvDialog
        open={showRemoveCvDialog}
        onOpenChange={(open) => setShowRemoveCvDialog(open)}
        onConfirm={confirmRemoveCv}
      />

      <SaveProfileDialog
        open={showConfirmUpdate}
        onOpenChange={(open) => {
          setShowConfirmUpdate(open);
          if (!open) setPendingMutateArgs(null);
        }}
        isPending={isSubmitting}
        onConfirm={() => {
          if (!pendingMutateArgs) return;
          updateUserWithFiles.mutate(pendingMutateArgs, {
            onSuccess: () => {
              if (onSuccess) onSuccess();
            },
            onSettled: () => {
              setShowConfirmUpdate(false);
              setPendingMutateArgs(null);
            },
          });
        }}
      />
    </>
  );
}
