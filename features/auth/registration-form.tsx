'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { signIn } from 'next-auth/react';
import { toast } from '@/lib/styles/toast-styles';
import {
  RegistrationFormData,
  initialRegistrationFormData,
  toRegistrationRequest,
} from '@/types/auth/registration';
import { UserRole, getUserRoleLabel } from '@/types/user/user-role';
import { authService } from '@/services/auth-service';
import { ApiError } from '@/lib/api/api-client';
import { logger } from '@/lib/logger';
import {
  required,
  compose,
  username,
  name,
  email,
  password,
  phone,
} from '@/lib/validators';
import Link from 'next/link';

// Common roles for registration (subset of all roles)
const REGISTRATION_ROLES: UserRole[] = [
  UserRole.laborer,
  UserRole.electrician,
  UserRole.plumber,
  UserRole.carpenter,
  UserRole.mason,
  UserRole.welder,
  UserRole.painter,
  UserRole.driver,
  UserRole.helper,
  UserRole.securityGuard,
  UserRole.civilEngineer,
  UserRole.siteEngineer,
  UserRole.architect,
  UserRole.projectManager,
  UserRole.supervisor,
  UserRole.foreman,
  UserRole.contractor,
  UserRole.intern,
  UserRole.trainee,
];

const GENDER_OPTIONS = ['Male', 'Female', 'Other'] as const;

export function RegistrationForm() {
  const [formData, setFormData] = useState<RegistrationFormData>(
    initialRegistrationFormData
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate username using composed validators
    const usernameValidator = compose(required('Username'), username);
    const usernameError = usernameValidator(formData.userName);
    if (usernameError) newErrors.userName = usernameError;

    // Validate name
    const nameValidator = compose(required('Full name'), name);
    const nameError = nameValidator(formData.name);
    if (nameError) newErrors.name = nameError;

    // Validate email
    const emailValidator = compose(required('Email'), email);
    const emailError = emailValidator(formData.email);
    if (emailError) newErrors.email = emailError;

    // Validate password
    const passwordValidator = compose(required('Password'), password);
    const passwordError = passwordValidator(formData.password);
    if (passwordError) newErrors.password = passwordError;

    // Validate confirm password
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirm password is required';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Validate phone
    const phoneValidator = compose(required('Phone'), phone);
    const phoneError = phoneValidator(formData.phone);
    if (phoneError) newErrors.phone = phoneError;

    // Validate date of birth
    if (formData.dateOfBirth) {
      const age = Math.floor(
        (Date.now() - formData.dateOfBirth.getTime()) /
          (365.25 * 24 * 60 * 60 * 1000)
      );
      if (age < 18) {
        newErrors.dateOfBirth = 'You must be at least 18 years old';
      }
    } else {
      newErrors.dateOfBirth = 'Date of birth is required';
    }

    // Validate role
    const roleError = required('Role')(formData.role);
    if (roleError) newErrors.role = roleError;

    // Validate terms acceptance
    if (!formData.acceptTerms) {
      newErrors.acceptTerms = 'You must accept the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Validation Error', {
        description: 'Please fix the errors in the form',
      });
      return;
    }

    setIsLoading(true);

    try {
      const payload = toRegistrationRequest(formData);
      await authService.register(payload);

      toast.success('Registration Successful', {
        description: 'Your account has been created. Redirecting to sign in...',
      });

      setFormData(initialRegistrationFormData);

      // Redirect to Keycloak sign in after short delay
      setTimeout(() => {
        signIn('keycloak');
      }, 1500);
    } catch (error) {
      logger.error('Registration error:', error);

      // Handle ApiError with field-level errors
      if (error instanceof ApiError) {
        // Set field-level errors from server validation
        if (error.errors) {
          const fieldErrors: Record<string, string> = {};
          for (const [field, messages] of Object.entries(error.errors)) {
            fieldErrors[field] = messages[0] || 'Invalid value';
          }
          setErrors((prev) => ({ ...prev, ...fieldErrors }));
        }

        // Show context-aware toast (avoid nested ternary for readability/linting)
        let title = 'Registration Failed';
        if (error.isTimeout) {
          title = 'Request Timeout';
        } else if (error.status === 0) {
          title = 'Network Error';
        } else if (error.status === 409) {
          title = 'Account Exists';
        }

        toast.error(title, { description: error.message });
      } else {
        const message =
          error instanceof Error ? error.message : 'Registration failed';
        toast.error('Registration Failed', { description: message });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = <K extends keyof RegistrationFormData>(
    field: K,
    value: RegistrationFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      {/* Two-column grid layout */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        {/* Username */}
        <div className="space-y-1">
          <Label htmlFor="userName" className="text-sm">
            Username <span className="text-red-500">*</span>
          </Label>
          <Input
            id="userName"
            value={formData.userName}
            onChange={(e) => handleChange('userName', e.target.value)}
            placeholder="john_doe"
            className={`h-9 ${errors.userName ? 'border-red-500' : ''}`}
          />
          {errors.userName && (
            <p className="text-xs text-red-500">{errors.userName}</p>
          )}
        </div>

        {/* Full Name */}
        <div className="space-y-1">
          <Label htmlFor="name" className="text-sm">
            Full Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="John Doe"
            className={`h-9 ${errors.name ? 'border-red-500' : ''}`}
          />
          {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
        </div>

        {/* Email - Full width */}
        <div className="col-span-2 space-y-1">
          <Label htmlFor="email" className="text-sm">
            Email <span className="text-red-500">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="john@example.com"
            className={`h-9 ${errors.email ? 'border-red-500' : ''}`}
          />
          {errors.email && (
            <p className="text-xs text-red-500">{errors.email}</p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1">
          <Label htmlFor="password" className="text-sm">
            Password <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              placeholder="Min 8 characters"
              className={`h-9 pr-9 ${errors.password ? 'border-red-500' : ''}`}
            />
            <button
              type="button"
              className="absolute top-1/2 right-2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-red-500">{errors.password}</p>
          )}
        </div>

        {/* Confirm Password */}
        <div className="space-y-1">
          <Label htmlFor="confirmPassword" className="text-sm">
            Confirm Password <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={(e) => handleChange('confirmPassword', e.target.value)}
              placeholder="Confirm password"
              className={`h-9 pr-9 ${errors.confirmPassword ? 'border-red-500' : ''}`}
            />
            <button
              type="button"
              className="absolute top-1/2 right-2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-xs text-red-500">{errors.confirmPassword}</p>
          )}
        </div>

        {/* Phone */}
        <div className="space-y-1">
          <Label htmlFor="phone" className="text-sm">
            Phone <span className="text-red-500">*</span>
          </Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            placeholder="9876543210"
            className={`h-9 ${errors.phone ? 'border-red-500' : ''}`}
          />
          {errors.phone && (
            <p className="text-xs text-red-500">{errors.phone}</p>
          )}
        </div>

        {/* Date of Birth */}
        <div className="space-y-1">
          <Label htmlFor="dateOfBirth" className="text-sm">
            Date of Birth <span className="text-red-500">*</span>
          </Label>
          <Input
            id="dateOfBirth"
            type="date"
            value={
              formData.dateOfBirth
                ? formData.dateOfBirth.toISOString().split('T')[0]
                : ''
            }
            onChange={(e) =>
              handleChange(
                'dateOfBirth',
                e.target.value ? new Date(e.target.value) : null
              )
            }
            className={`h-9 ${errors.dateOfBirth ? 'border-red-500' : ''}`}
          />
          {errors.dateOfBirth && (
            <p className="text-xs text-red-500">{errors.dateOfBirth}</p>
          )}
        </div>

        {/* Gender */}
        <div className="space-y-1">
          <Label htmlFor="gender" className="text-sm">
            Gender <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.gender}
            onValueChange={(value) =>
              handleChange('gender', value as 'Male' | 'Female' | 'Other')
            }
          >
            <SelectTrigger
              className={`h-9 w-full ${errors.gender ? 'border-red-500' : ''}`}
            >
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {GENDER_OPTIONS.map((gender) => (
                <SelectItem key={gender} value={gender}>
                  {gender}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.gender && (
            <p className="text-xs text-red-500">{errors.gender}</p>
          )}
        </div>

        {/* Role */}
        <div className="space-y-1">
          <Label htmlFor="role" className="text-sm">
            Role <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.role}
            onValueChange={(value) => handleChange('role', value)}
          >
            <SelectTrigger
              className={`h-9 w-full ${errors.role ? 'border-red-500' : ''}`}
            >
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              {REGISTRATION_ROLES.map((role) => (
                <SelectItem key={role} value={role}>
                  {getUserRoleLabel(role)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.role && <p className="text-xs text-red-500">{errors.role}</p>}
        </div>

        {/* Terms - Full width */}
        <div className="col-span-2 flex items-center space-x-2 pt-2">
          <Checkbox
            id="acceptTerms"
            checked={formData.acceptTerms}
            onCheckedChange={(checked) =>
              handleChange('acceptTerms', checked === true)
            }
            className={errors.acceptTerms ? 'border-red-500' : ''}
          />
          <Label htmlFor="acceptTerms" className="cursor-pointer text-sm">
            I agree to the{' '}
            <Link
              href="/terms"
              className="text-blue-600 hover:underline dark:text-blue-400"
            >
              Terms
            </Link>{' '}
            and{' '}
            <Link
              href="/privacy"
              className="text-blue-600 hover:underline dark:text-blue-400"
            >
              Privacy Policy
            </Link>
          </Label>
        </div>
        {errors.acceptTerms && (
          <p className="col-span-2 -mt-1 text-xs text-red-500">
            {errors.acceptTerms}
          </p>
        )}

        {/* Submit Button - Full width */}
        <Button
          type="submit"
          className="col-span-2 mt-2 h-10 w-full bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-200"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Account...
            </>
          ) : (
            'Create Account'
          )}
        </Button>

        {/* Sign In Link */}
        <p className="col-span-2 text-center text-sm text-zinc-600 dark:text-zinc-400">
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => signIn('keycloak')}
            className="font-medium text-zinc-900 hover:underline dark:text-zinc-100"
          >
            Sign in
          </button>
        </p>
      </div>
    </form>
  );
}
