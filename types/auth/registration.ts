import { toLocalDateAtMidnight } from '@tornotron/echno-core';
import { UserRole } from '@tornotron/echno-core/user/types';

/**
 * Registration request payload sent to the backend.
 */
export interface RegistrationRequest {
  userName: string;
  name: string;
  email: string;
  password: string;
  phone: string;
  gender: 'Male' | 'Female' | 'Other';
  dateOfBirth: string; // Local calendar date at midnight, no offset
  role: UserRole | string;
  acceptTerms: boolean;
}

/**
 * Registration response from the backend.
 */
export interface RegistrationResponse {
  success: boolean;
  message?: string;
  userId?: number;
}

/**
 * Registration form data used in the UI.
 * Includes confirmPassword for client-side validation.
 */
export interface RegistrationFormData extends Omit<
  RegistrationRequest,
  'dateOfBirth'
> {
  confirmPassword: string;
  dateOfBirth: Date | null;
}

/**
 * Initial empty form state.
 */
export const initialRegistrationFormData: RegistrationFormData = {
  userName: '',
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  phone: '',
  gender: 'Male',
  dateOfBirth: null,
  role: '',
  acceptTerms: false,
};

/**
 * Convert form data to API request payload.
 *
 * The date of birth goes out as a local calendar date with a zeroed time and no
 * offset. The backend holds it in a strict LocalDateTime and rejects an ISO
 * string with a trailing Z. The form keeps the picked date at local midnight.
 */
export function toRegistrationRequest(
  formData: RegistrationFormData
): RegistrationRequest {
  return {
    userName: formData.userName,
    name: formData.name,
    email: formData.email,
    password: formData.password,
    phone: formData.phone,
    gender: formData.gender,
    dateOfBirth: formData.dateOfBirth
      ? toLocalDateAtMidnight(formData.dateOfBirth)
      : '',
    role: formData.role,
    acceptTerms: formData.acceptTerms,
  };
}
