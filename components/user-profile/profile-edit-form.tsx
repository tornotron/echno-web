'use client';

import { useState } from 'react';
import { User } from '@/types/user/user';
import { updateUserProfile } from '@/lib/api/user-api';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/lib/styles/toast-styles';
import { Loader2, Save, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ProfileEditFormProps {
  user: User;
  onCancel?: () => void;
  onSuccess?: (updatedUser: User) => void;
}

export function ProfileEditForm({ user, onCancel, onSuccess }: ProfileEditFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
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
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Prepare the update payload
      const updates: Partial<User> = {
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
        gender: formData.gender,
        dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth) : user.dateOfBirth,
        qualification: formData.qualification,
        bloodGroup: formData.bloodGroup || undefined,
        emergencyContact: formData.emergencyContact || undefined,
        experience: formData.experience ? parseInt(formData.experience, 10) : undefined,
        skills: formData.skills
          ? formData.skills.split(',').map((s) => s.trim()).filter(Boolean)
          : undefined,
      };

      const updatedUser = await updateUserProfile(updates);
      
      toast.success('Profile updated successfully!', {
        description: 'Your changes have been saved.',
      });

      if (onSuccess) {
        onSuccess(updatedUser);
      }

      // Refresh the page to show updated data
      router.refresh();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile', {
        description: error instanceof Error ? error.message : 'Please try again later.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Update your basic personal details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
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
              <Label htmlFor="gender">Gender *</Label>
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
              <Label htmlFor="dateOfBirth">Date of Birth *</Label>
              <Input
                id="dateOfBirth"
                name="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bloodGroup">Blood Group</Label>
              <Select
                value={formData.bloodGroup}
                onValueChange={(value) => handleSelectChange('bloodGroup', value)}
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
            <Label htmlFor="address">Address *</Label>
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
              <Label htmlFor="phone">Phone Number *</Label>
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

      {/* Professional Information */}
      <Card>
        <CardHeader>
          <CardTitle>Professional Information</CardTitle>
          <CardDescription>Your qualifications and experience</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="qualification">Qualification *</Label>
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
            <p className="text-xs text-muted-foreground">
              Separate multiple skills with commas
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
  );
}
