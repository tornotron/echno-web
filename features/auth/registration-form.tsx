'use client';

import { useState } from 'react';
import { Input } from '@/components/shadcn/input';
import { PhoneInput } from '@/components/shadcn/phone-input';
import { Label } from '@/components/shadcn/label';
import { Button } from '@/components/shadcn/button';
import { Checkbox } from '@/components/shadcn/checkbox';
import { Calendar } from '@/components/shadcn/calendar';
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger,
} from '@/components/shadcn/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/select';
import { CalendarIcon, Eye, EyeOff, Loader2 } from 'lucide-react';
import { format, isValid, parse, subYears } from 'date-fns';
import { signIn } from 'next-auth/react';
import { toast } from '@/lib/styles/toast-styles';
import {
  RegistrationFormData,
  initialRegistrationFormData,
  toRegistrationRequest,
} from '@/types/auth/registration';
import { UserRole, getUserRoleLabel } from '@tornotron/echno-core/user/types';
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

const REGISTRATION_ROLES = Object.values(UserRole);

const GENDER_OPTIONS = ['Male', 'Female', 'Other'] as const;

const EARLIEST_DOB = new Date(1900, 0, 1);
const DOB_FORMAT = 'dd/MM/yyyy';
const DOB_PLACEHOLDER = 'dd/mm/yyyy';
const DOB_FORMAT_ERROR = `Enter a valid date as ${DOB_PLACEHOLDER}`;

function joinDobDigits(digits: string, trailingSlash: boolean): string {
  const text = [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4)]
    .filter(Boolean)
    .join('/');
  return trailingSlash && (digits.length === 2 || digits.length === 4)
    ? `${text}/`
    : text;
}

// Keep only digits and add each slash as soon as the day or month is
// complete, like a card expiry field, so 1508 reads as 15/08/
function formatDobText(value: string, previous: string): string {
  const isDeleting = value.length < previous.length;
  let digits = value.replaceAll(/\D/g, '').slice(0, 8);
  // A separator typed after a single digit pads it, so 5/ reads as 05/
  if (!isDeleting && /[/.-]$/.test(value)) {
    if (digits.length === 1) digits = `0${digits}`;
    else if (digits.length === 3) digits = `${digits.slice(0, 2)}0${digits[2]}`;
  }
  const text = joinDobDigits(digits, !isDeleting);
  // Backspacing over a slash in the middle would put it straight back, so
  // drop the digit before it instead
  return isDeleting && text === previous
    ? joinDobDigits(digits.slice(0, -1), false)
    : text;
}

function parseDobText(text: string): Date | null {
  if (text.length !== DOB_FORMAT.length) return null;
  const date = parse(text, DOB_FORMAT, new Date());
  return isValid(date) && date >= EARLIEST_DOB ? date : null;
}

export function RegistrationForm() {
  const [formData, setFormData] = useState<RegistrationFormData>(
    initialRegistrationFormData
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isDobOpen, setIsDobOpen] = useState(false);
  const [dobText, setDobText] = useState('');
  // Anyone born after this is under 18 and cannot register
  const latestDob = subYears(new Date(), 18);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    const usernameValidator = compose(required('Username'), username);
    const usernameError = usernameValidator(formData.userName);
    if (usernameError) newErrors.userName = usernameError;

    const nameValidator = compose(required('Full name'), name);
    const nameError = nameValidator(formData.name);
    if (nameError) newErrors.name = nameError;

    const emailValidator = compose(required('Email'), email);
    const emailError = emailValidator(formData.email);
    if (emailError) newErrors.email = emailError;

    const passwordValidator = compose(required('Password'), password);
    const passwordError = passwordValidator(formData.password);
    if (passwordError) newErrors.password = passwordError;

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirm password is required';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    const phoneValidator = compose(required('Phone'), phone);
    const phoneError = phoneValidator(formData.phone);
    if (phoneError) newErrors.phone = phoneError;

    if (formData.dateOfBirth) {
      const age = Math.floor(
        (Date.now() - formData.dateOfBirth.getTime()) /
          (365.25 * 24 * 60 * 60 * 1000)
      );
      if (age < 18) {
        newErrors.dateOfBirth = 'You must be at least 18 years old';
      }
    } else {
      newErrors.dateOfBirth = dobText
        ? DOB_FORMAT_ERROR
        : 'Date of birth is required';
    }

    const roleError = required('Role')(formData.role);
    if (roleError) newErrors.role = roleError;

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

      setTimeout(() => {
        signIn('keycloak');
      }, 1500);
    } catch (error) {
      logger.error('Registration error:', error);

      if (error instanceof ApiError) {
        if (error.errors) {
          const fieldErrors: Record<string, string> = {};
          for (const [field, messages] of Object.entries(error.errors)) {
            fieldErrors[field] = messages[0] || 'Invalid value';
          }
          setErrors((prev) => ({ ...prev, ...fieldErrors }));
        }

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

  const handleDobTextChange = (value: string) => {
    const text = formatDobText(value, dobText);
    setDobText(text);
    handleChange('dateOfBirth', parseDobText(text));
  };

  const handleDobBlur = () => {
    if (dobText && !parseDobText(dobText)) {
      setErrors((prev) => ({ ...prev, dateOfBirth: DOB_FORMAT_ERROR }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        {/* Username */}
        <div className="space-y-1">
          <Label
            htmlFor="userName"
            className="text-sm text-zinc-700 dark:text-zinc-300"
          >
            Username <span className="text-red-500">*</span>
          </Label>
          <Input
            variant="auth"
            id="userName"
            value={formData.userName}
            onChange={(e) => handleChange('userName', e.target.value)}
            placeholder="john_doe"
            aria-invalid={!!errors.userName}
          />
          {errors.userName && (
            <p className="text-xs text-red-500">{errors.userName}</p>
          )}
        </div>

        {/* Full Name */}
        <div className="space-y-1">
          <Label
            htmlFor="name"
            className="text-sm text-zinc-700 dark:text-zinc-300"
          >
            Full Name <span className="text-red-500">*</span>
          </Label>
          <Input
            variant="auth"
            id="name"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="John Doe"
            aria-invalid={!!errors.name}
          />
          {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
        </div>

        {/* Email */}
        <div className="col-span-2 space-y-1">
          <Label
            htmlFor="email"
            className="text-sm text-zinc-700 dark:text-zinc-300"
          >
            Email <span className="text-red-500">*</span>
          </Label>
          <Input
            variant="auth"
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="john@example.com"
            aria-invalid={!!errors.email}
          />
          {errors.email && (
            <p className="text-xs text-red-500">{errors.email}</p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1">
          <Label
            htmlFor="password"
            className="text-sm text-zinc-700 dark:text-zinc-300"
          >
            Password <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <Input
              variant="auth"
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              placeholder="Min 8 characters"
              className="pr-9"
              aria-invalid={!!errors.password}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="absolute top-1/2 right-2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
          {errors.password && (
            <p className="text-xs text-red-500">{errors.password}</p>
          )}
        </div>

        {/* Confirm Password */}
        <div className="space-y-1">
          <Label
            htmlFor="confirmPassword"
            className="text-sm text-zinc-700 dark:text-zinc-300"
          >
            Confirm Password <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <Input
              variant="auth"
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={(e) => handleChange('confirmPassword', e.target.value)}
              placeholder="Confirm password"
              className="pr-9"
              aria-invalid={!!errors.confirmPassword}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="absolute top-1/2 right-2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
          {errors.confirmPassword && (
            <p className="text-xs text-red-500">{errors.confirmPassword}</p>
          )}
        </div>

        {/* Phone */}
        <div className="space-y-1">
          <Label
            htmlFor="phone"
            className="text-sm text-zinc-700 dark:text-zinc-300"
          >
            Phone <span className="text-red-500">*</span>
          </Label>
          <PhoneInput
            id="phone"
            value={formData.phone}
            onChange={(value) => handleChange('phone', value || '')}
            aria-invalid={!!errors.phone}
          />
          {errors.phone && (
            <p className="text-xs text-red-500">{errors.phone}</p>
          )}
        </div>

        {/* Date of Birth */}
        <div className="space-y-1">
          <Label
            htmlFor="dateOfBirth"
            className="text-sm text-zinc-700 dark:text-zinc-300"
          >
            Date of Birth <span className="text-red-500">*</span>
          </Label>
          {/* Safari's native date picker can only step month by month, so take typed input and offer a calendar with month/year dropdowns */}
          <Popover open={isDobOpen} onOpenChange={setIsDobOpen}>
            <PopoverAnchor asChild>
              <div className="relative">
                <Input
                  variant="auth"
                  id="dateOfBirth"
                  value={dobText}
                  onChange={(e) => handleDobTextChange(e.target.value)}
                  onBlur={handleDobBlur}
                  placeholder={DOB_PLACEHOLDER}
                  inputMode="numeric"
                  autoComplete="bday"
                  maxLength={DOB_FORMAT.length}
                  className="pr-9"
                  aria-invalid={!!errors.dateOfBirth}
                />
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Open calendar"
                    className="absolute top-1/2 right-2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300"
                  >
                    <CalendarIcon className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
              </div>
            </PopoverAnchor>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                captionLayout="dropdown"
                selected={formData.dateOfBirth ?? undefined}
                defaultMonth={formData.dateOfBirth ?? subYears(latestDob, 7)}
                startMonth={EARLIEST_DOB}
                endMonth={latestDob}
                disabled={[{ after: latestDob }, { before: EARLIEST_DOB }]}
                onSelect={(date) => {
                  handleChange('dateOfBirth', date ?? null);
                  setDobText(date ? format(date, DOB_FORMAT) : '');
                  if (date) setIsDobOpen(false);
                }}
              />
            </PopoverContent>
          </Popover>
          {errors.dateOfBirth && (
            <p className="text-xs text-red-500">{errors.dateOfBirth}</p>
          )}
        </div>

        {/* Gender */}
        <div className="space-y-1">
          <Label
            htmlFor="gender"
            className="text-sm text-zinc-700 dark:text-zinc-300"
          >
            Gender <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.gender}
            onValueChange={(value) =>
              handleChange('gender', value as 'Male' | 'Female' | 'Other')
            }
          >
            <SelectTrigger
              className={`h-9 w-full border-zinc-300 bg-white text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 ${errors.gender ? 'border-red-500' : ''}`}
            >
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent className="border-zinc-300 bg-white text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
              {GENDER_OPTIONS.map((gender) => (
                <SelectItem
                  key={gender}
                  value={gender}
                  className="text-zinc-900 focus:bg-zinc-100 focus:text-zinc-900 dark:text-zinc-100 dark:focus:bg-zinc-800 dark:focus:text-zinc-100"
                >
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
          <Label
            htmlFor="role"
            className="text-sm text-zinc-700 dark:text-zinc-300"
          >
            Role <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.role}
            onValueChange={(value) => handleChange('role', value)}
          >
            <SelectTrigger
              className={`h-9 w-full border-zinc-300 bg-white text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 ${errors.role ? 'border-red-500' : ''}`}
            >
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent className="border-zinc-300 bg-white text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
              {REGISTRATION_ROLES.map((role) => (
                <SelectItem
                  key={role}
                  value={role}
                  className="text-zinc-900 focus:bg-zinc-100 focus:text-zinc-900 dark:text-zinc-100 dark:focus:bg-zinc-800 dark:focus:text-zinc-100"
                >
                  {getUserRoleLabel(role)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.role && <p className="text-xs text-red-500">{errors.role}</p>}
        </div>

        {/* Terms */}
        <div className="col-span-2 flex items-center space-x-2 pt-2">
          <Checkbox
            id="acceptTerms"
            checked={formData.acceptTerms}
            onCheckedChange={(checked) =>
              handleChange('acceptTerms', checked === true)
            }
            className={`border-zinc-400 data-[state=checked]:border-amber-500 data-[state=checked]:bg-amber-500 dark:border-zinc-600 ${errors.acceptTerms ? 'border-red-500' : ''}`}
          />
          <Label
            htmlFor="acceptTerms"
            className="cursor-pointer text-sm text-zinc-600 dark:text-zinc-400"
          >
            I agree to the{' '}
            <Link
              href="/terms"
              className="font-semibold text-amber-600 hover:text-amber-700 hover:underline dark:text-amber-500"
            >
              Terms
            </Link>{' '}
            and{' '}
            <Link
              href="/privacy"
              className="font-semibold text-amber-600 hover:text-amber-700 hover:underline dark:text-amber-500"
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

        {/* Submit */}
        <Button
          type="submit"
          variant="gradient"
          disabled={isLoading}
          className="group relative col-span-2 mt-2 h-10 w-full overflow-hidden rounded-lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating Account…
            </>
          ) : (
            'Create Account'
          )}
          <span
            className="absolute inset-0 -translate-x-full skew-x-12 bg-white/20 transition-transform duration-500 group-hover:translate-x-full"
            aria-hidden
          />
        </Button>

        {/* Sign In Link */}
        <p className="col-span-2 text-center text-sm text-zinc-600 dark:text-zinc-400">
          Already have an account?{' '}
          <Button
            type="button"
            variant="link"
            className="h-auto p-0 font-semibold text-amber-600 hover:text-amber-700 dark:text-amber-500"
            onClick={() => signIn('keycloak')}
          >
            Sign in
          </Button>
        </p>
      </div>
    </form>
  );
}
