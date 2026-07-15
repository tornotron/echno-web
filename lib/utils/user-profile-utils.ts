// lib/utils/user-profile-utils.ts
import { User } from '@tornotron/echno-core/user/types';

// Re-export date utilities for backward compatibility

/**
 * Formats phone number for display
 * Handles various phone formats
 */
export function formatPhoneNumber(phone: string | undefined): string {
  if (!phone || phone === 'Not Specified') return 'Not specified';
  // Return as-is, backend already provides formatted phone
  return phone;
}

/**
 * Validates and formats email
 */
export function formatEmail(email: string | undefined): string {
  if (!email || email === 'Not Specified') return 'Not specified';
  return email.toLowerCase().trim();
}

/**
 * Gets user's full name or email as fallback
 */
export function getUserDisplayName(user: User): string {
  return user.name || user.email || 'User';
}

/**
 * Checks if user profile is complete
 */
export function isProfileComplete(user: User): boolean {
  const requiredFields = [
    user.name,
    user.email,
    user.phone,
    user.address,
    user.dateOfBirth,
    user.gender,
  ];

  return requiredFields.every((field) => field && field !== 'Not Specified');
}

/**
 * Calculates profile completion percentage
 */
export function getProfileCompletionPercentage(user: User): number {
  const fields = [
    user.name,
    user.email,
    user.phone,
    user.address,
    user.dateOfBirth,
    user.gender,
    user.bloodGroup,
    user.qualification,
    user.skills && user.skills.length > 0,
    user.experience,
    user.cv?.file,
    user.emergencyContact,
    user.profilePicture?.file,
  ];

  const filledFields = fields.filter((field) => {
    if (typeof field === 'string') {
      return field && field !== 'Not Specified';
    }
    return field !== null && field !== undefined;
  }).length;

  return Math.round((filledFields / fields.length) * 100);
}

/**
 * Gets role display name
 */
export function getRoleDisplayName(role: string): string {
  const roleMap: Record<string, string> = {
    admin: 'Administrator',
    client: 'Client',
    supervisor: 'Supervisor',
    engineer: 'Engineer',
    laborer: 'Laborer',
    viewer: 'Viewer',
  };

  return roleMap[role.toLowerCase()] || role;
}

/**
 * Formats experience in years
 */
export function formatExperience(experience: number | undefined): string {
  if (experience === undefined || experience === null) return 'Not specified';
  if (experience === 0) return 'Fresher';
  if (experience === 1) return '1 year';
  return `${experience} years`;
}

/**
 * Gets avatar color based on user initials
 */
export function getAvatarColor(initials: string): string {
  const colors = [
    'bg-red-500',
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500',
  ];

  const charCode = initials.codePointAt(0) || 0;
  return colors[charCode % colors.length];
}

/**
 * Validates if a field has a meaningful value
 */
export function hasValue(field: unknown): boolean {
  if (field === null || field === undefined) return false;
  if (typeof field === 'string') {
    return field.trim() !== '' && field !== 'Not Specified';
  }
  if (Array.isArray(field)) {
    return field.length > 0;
  }
  return true;
}

/**
 * Formats a list of items into a comma-separated string
 */
export function formatList(items: string[] | undefined): string {
  if (!items || items.length === 0) return 'Not specified';
  return items.join(', ');
}

/**
 * Gets user's organization names as a string
 * Note: Organizations should be fetched separately using useOrganizations hook
 */
export function getOrganizationNames(user: User): string {
  // Organizations are now fetched via hooks, not stored in user object
  return user.defaultOrganizationId ? 'View organizations' : 'No organizations';
}

/**
 * Checks if user has any professional information
 */
export function hasProfessionalInfo(user: User): boolean {
  return !!(
    hasValue(user.qualification) ||
    hasValue(user.skills) ||
    hasValue(user.experience) ||
    hasValue(user.cv?.file)
  );
}

/**
 * Gets a color class based on profile completion percentage
 */
export function getCompletionColor(percentage: number): string {
  if (percentage >= 80) return 'text-green-600';
  if (percentage >= 50) return 'text-yellow-600';
  return 'text-red-600';
}

/**
 * Sanitizes user input to prevent XSS
 */
export function sanitizeString(input: string | undefined): string {
  if (!input) return '';
  return input.replaceAll(/[<>]/g, '').trim();
}

export {
  formatDate,
  formatDateShort,
  formatDateForInput,
  calculateAge,
} from './date-utils';
